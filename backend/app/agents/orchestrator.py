import os
from typing import Annotated, List, TypedDict, Union
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from pydantic import BaseModel, Field
from app.agents.tools import search_learning_materials, get_user_progress
from langgraph.prebuilt import ToolNode

# Define the state of the agent
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], "The conversation history"]
    user_id: str
    learner_profile: dict
    grounding_context: str

class LuminaOrchestrator:
    def __init__(self, model_name: str = "gemini-2.5-flash"):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is not set")
            
        self.llm = ChatGoogleGenerativeAI(model=model_name, api_key=api_key)
        self.tools = [search_learning_materials, get_user_progress]
        self.llm_with_tools = self.llm.bind_tools(self.tools)
        self.memory = MemorySaver()
        self.graph = self._build_graph()

    def _get_ltm(self, state: AgentState):
        """Fetch Long-Term Memory (Mock)."""
        return {"learner_profile": {
            "pace": "medium",
            "expertise_level": "beginner",
            "interests": ["Python", "AI"],
            "understanding_score": 0.6
        }}

    def _update_ltm(self, state: AgentState):
        """Update Long-Term Memory (Mock)."""
        # Logic to update user state based on the last message
        return state

    def _call_model(self, state: AgentState):
        profile = state.get("learner_profile", {})
        system_prompt = f"""You are Lumina, an Intelligent Learning Assistant.
        Your goal is to adapt to the user's pace and understanding level.
        
        USER PROFILE (LTM):
        - Pace: {profile.get('pace')}
        - Level: {profile.get('expertise_level')}
        - Interests: {', '.join(profile.get('interests', []))}
        - Current Understanding Score: {profile.get('understanding_score')}
        
        You have access to the user's learning materials and progress.
        Use tools to search for information if the user asks about specific topics.
        Adapt your language, examples, and depth based on the profile.
        """
        
        messages = [SystemMessage(content=system_prompt)] + state["messages"]
        response = self.llm_with_tools.invoke(messages)
        return {"messages": [response]}

    def _should_continue(self, state: AgentState):
        messages = state["messages"]
        last_message = messages[-1]
        if last_message.tool_calls:
            return "tools"
        return "ltm_update"

    def _build_graph(self):
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("ltm_fetch", self._get_ltm)
        workflow.add_node("agent", self._call_model)
        workflow.add_node("tools", ToolNode(self.tools))
        workflow.add_node("ltm_update", self._update_ltm)
        
        # Build connections
        workflow.add_edge(START, "ltm_fetch")
        workflow.add_edge("ltm_fetch", "agent")
        
        workflow.add_conditional_edges(
            "agent",
            self._should_continue,
            {
                "tools": "tools",
                "ltm_update": "ltm_update"
            }
        )
        
        workflow.add_edge("tools", "agent")
        workflow.add_edge("ltm_update", END)
        
        return workflow.compile(checkpointer=self.memory)

    async def chat(self, user_id: str, session_id: str, message: str):
        config = {"configurable": {"thread_id": session_id}}
        input_state = {
            "messages": [HumanMessage(content=message)],
            "user_id": user_id
        }
        
        # Use ainvoke for async
        final_state = await self.graph.ainvoke(input_state, config=config)
        return final_state["messages"][-1].content
