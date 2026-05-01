"""
Lumina AI — LangGraph Orchestrator.

This is the core intelligence layer. It builds a LangGraph state graph with:
  1. LTM Fetch   — loads the user's learner profile from Long-Term Memory
  2. Agent        — calls LLM with tools, adapting based on the profile
  3. Tools        — executes tool calls (knowledge search, scraping, progress, insights)
  4. LTM Update   — persists any changes back to Long-Term Memory
"""

import logging
import uuid
import json
from typing import Annotated, List, TypedDict, Sequence, Optional

from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

# ── LLM Imports ──────────────────────────────────────────────
from langchain_openai import ChatOpenAI

from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage, AIMessage

from app.models import Attachment
from app.utils.file_processor import extract_text_from_file
from app.config import settings
from app.memory.long_term import ltm_store
from app.memory.short_term import stm_store
from app.agents.tools import (
    search_learning_materials,
    scrape_website,
    get_learning_progress,
    record_learning_insight,
)

logger = logging.getLogger(__name__)

# ── State Definition ──────────────────────────────────────────

class AgentState(TypedDict):
    """
    The state object passed between LangGraph nodes.
    """
    messages: Annotated[Sequence[BaseMessage], add_messages]
    user_id: str
    learner_profile: dict  # Loaded from LTM


# ── Orchestrator Class ────────────────────────────────────────

class LuminaOrchestrator:
    """
    Orchestrates the adaptive learning flow using LangGraph.
    """

    def __init__(self):
        # ── OpenRouter Initialization ──────────────────────────
        # OpenRouter uses the OpenAI-compatible API
        self.llm = ChatOpenAI(
            model=settings.openrouter_model,
            openai_api_key=settings.openrouter_api_key,
            base_url="https://openrouter.ai/api/v1",
            temperature=0.4,
        )


        self.tools = [
            search_learning_materials,
            scrape_website,
            get_learning_progress,
            record_learning_insight,
        ]
        self.llm_with_tools = self.llm.bind_tools(self.tools)
        self.graph = self._build_graph()
        logger.info("LuminaOrchestrator initialised with model=%s (OpenRouter)", settings.openrouter_model)

    # ── Nodes ───────────────────────────────────────────────────

    def _ltm_fetch(self, state: AgentState) -> dict:
        """Load the user's profile from Long-Term Memory."""
        user_id = state.get("user_id", "anonymous")
        profile = ltm_store.get_profile(user_id)
        return {"learner_profile": profile.model_dump()}

    async def _call_model(self, state: AgentState) -> dict:
        """Execute the primary LLM agent node."""
        profile = state["learner_profile"]
        
        # Build adaptive system prompt
        sys_prompt = (
            "You are Lumina, a highly adaptive and personalized AI learning assistant.\n"
            f"User Profile: Pace={profile['pace']}, Level={profile['expertise_level']}.\n"
            f"Interests: {', '.join(profile['interests']) or 'None yet'}.\n"
            f"Stuck Points: {', '.join(profile['stuck_points']) or 'None yet'}.\n\n"
            "Guidelines:\n"
            "1. **Be Concise & Encouraging**: Adapt your tone to the user's level.\n"
            "2. **Memory**: Reference previous topics the user mastered.\n"
            "3. **Knowledge Search**: Call search_learning_materials for grounding on internal topics.\n"
            "4. **Web Analysis**: If the user provides a URL, call scrape_website to read and analyze it.\n"
            "5. **Insight**: If you notice a shift in pace or interest, call record_learning_insight."
        )
        
        messages = [SystemMessage(content=sys_prompt)] + list(state["messages"])
        response = await self.llm_with_tools.ainvoke(messages)
        return {"messages": [response]}

    async def _ltm_update(self, state: AgentState) -> dict:
        """After a response, increment message count in LTM and refresh prompts if needed."""
        user_id = state.get("user_id", "anonymous")
        ltm_store.increment_messages(user_id)
        
        # Refresh suggested prompts every 5 messages to keep them relevant to recent history
        profile = ltm_store.get_profile(user_id)
        if profile.total_messages % 5 == 0:
            logger.info("Refreshing suggested prompts for user %s", user_id)
            await self.generate_suggested_prompts(user_id)
            
        return {}

    # ── Conditional Routing ─────────────────────────────────────

    def _should_continue(self, state: AgentState):
        """Determine if we should call tools or finish the loop."""
        messages = state["messages"]
        last_message = messages[-1]
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            return "tools"
        return "ltm_update"

    # ── Graph Builder ───────────────────────────────────────────

    def _build_graph(self):
        workflow = StateGraph(AgentState)

        # Nodes
        workflow.add_node("ltm_fetch", self._ltm_fetch)
        workflow.add_node("agent", self._call_model)
        workflow.add_node("tools", ToolNode(self.tools))
        workflow.add_node("ltm_update", self._ltm_update)

        # Edges
        workflow.add_edge(START, "ltm_fetch")
        workflow.add_edge("ltm_fetch", "agent")

        workflow.add_conditional_edges(
            "agent",
            self._should_continue,
            {"tools": "tools", "ltm_update": "ltm_update"},
        )
        workflow.add_edge("tools", "agent")  # loop back after tool execution
        workflow.add_edge("ltm_update", END)

        return workflow.compile(checkpointer=stm_store.checkpointer)

    # ── Public Chat Method ──────────────────────────────────────

    async def chat(self, user_id: str, session_id: str, message: str, attachments: Optional[List[Attachment]] = None) -> str:
        """
        Send a message and get an AI response.
        """
        # Register session in STM metadata
        stm_store.register_session(session_id, user_id)

        # Inject file contents into the message for grounding (with truncation to avoid length errors)
        full_msg = message
        if attachments:
            for att in attachments:
                # Extract text using utility (supports PDF, CSV, etc.)
                extracted_text = extract_text_from_file(att.filename, att.content)
                
                # Limit to 10,000 characters per file for stability (increased from 6000 since PDFs are denser)
                safe_content = extracted_text[:10000]
                full_msg += f"\n\n[ATTACHED FILE: {att.filename}]\n{safe_content}\n[END OF FILE]"


        config = stm_store.get_config(session_id)
        input_state = {
            "messages": [HumanMessage(content=full_msg)],
            "user_id": user_id,
        }

        # Auto-title with first user message
        stm_store.bump_session(session_id, title=message[:50])

        try:
            final_state = await self.graph.ainvoke(input_state, config=config)
            return final_state["messages"][-1].content
        except Exception as e:
            logger.error("LLM API error: %s", e)
            return f"⚠️ **LLM Error**: {str(e)[:500]}"

    def get_history(self, session_id: str) -> List[dict]:
        """Retrieve full conversation history for a specific session."""
        config = stm_store.get_config(session_id)
        state = self.graph.get_state(config)
        
        messages = state.values.get("messages", [])
        history = []
        for msg in messages:
            if isinstance(msg, HumanMessage):
                role = "user"
            elif isinstance(msg, AIMessage):
                role = "assistant"
            else:
                continue # Skip System, Tool, or Function messages for the UI
                
            history.append({
                "role": role,
                "content": msg.content,
                "id": getattr(msg, "id", str(uuid.uuid4()))
            })
        return history

    async def generate_suggested_prompts(self, user_id: str) -> List[str]:
        """
        Dynamically generate personalized suggested prompts based on the learner's profile.
        """
        profile = ltm_store.get_profile(user_id)
        
        # Build a prompt for the LLM to generate suggestions
        prompt = (
            "You are a helpful learning coach. Based on the user's profile below, generate 3-4 specific, "
            "engaging 'suggested prompts' or questions the user could ask to start their next learning session.\n\n"
            f"User Profile:\n"
            f"- Profession: {profile.profession or 'Not specified'}\n"
            f"- Education: {profile.education_level or 'Not specified'}\n"
            f"- Interests: {', '.join(profile.interests) or 'None'}\n"
            f"- Learning Goals: {profile.learning_goals or 'General knowledge'}\n"
            f"- Level: {profile.expertise_level}\n"
            f"- Topics Mastered: {', '.join(profile.topics_completed) or 'None yet'}\n"
            f"- Stuck Points: {', '.join(profile.stuck_points) or 'None'}\n\n"
            "Return ONLY a JSON list of strings. Example: ['How does X work in the context of Y?', 'Can you explain Z?']"
        )

        try:
            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            content = response.content
            
            # Basic parsing of the JSON response
            if "[" in content and "]" in content:
                start = content.find("[")
                end = content.rfind("]") + 1
                suggested = json.loads(content[start:end])
                
                # Store in LTM
                ltm_store.update_profile(user_id, suggested_prompts=suggested)
                return suggested
        except Exception as e:
            logger.error("Failed to generate suggested prompts: %s", e)
            
        # Fallback prompts if generation fails
        fallback = ["How can I get started with my learning goals?", "Tell me something interesting about my interests."]
        return fallback
