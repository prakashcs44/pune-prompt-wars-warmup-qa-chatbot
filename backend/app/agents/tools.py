"""
Lumina AI — Agent Tools (Grounded Answering).

These tools are bound to the LLM so the LangGraph agent can
call them autonomously during a conversation to provide grounded,
factual responses.
"""

import requests
import trafilatura
from langchain_core.tools import tool
from app.memory.long_term import ltm_store
from typing import List, Dict, Any


# ── Knowledge-base search (simulates Drive / Vertex AI Search) ──────────────────

KNOWLEDGE_BASE = [
    {"id": "kb-001", "topic": "python", "title": "Python Fundamentals",
     "content": "Python is a high-level, interpreted programming language known for its simplicity. Key concepts include variables, data types (int, float, str, list, dict), control flow (if/else, for, while), functions, and classes."},
    {"id": "kb-002", "topic": "python", "title": "Python OOP",
     "content": "Object-Oriented Programming in Python uses classes and objects. Key pillars: Encapsulation (bundling data and methods), Inheritance (deriving new classes), Polymorphism (same interface, different behavior), and Abstraction (hiding complexity)."},
    {"id": "kb-003", "topic": "ai", "title": "Introduction to Machine Learning",
     "content": "Machine Learning is a subset of AI that enables systems to learn from data. Types: Supervised (labeled data), Unsupervised (unlabeled data), Reinforcement (reward-based). Common algorithms include Linear Regression, Decision Trees, and Neural Networks."},
    {"id": "kb-004", "topic": "ai", "title": "Neural Networks Basics",
     "content": "A Neural Network consists of layers of interconnected nodes (neurons). Input layer receives data, hidden layers process it, output layer produces results. Training uses backpropagation and gradient descent to minimize a loss function."},
    {"id": "kb-005", "topic": "math", "title": "Linear Algebra Essentials",
     "content": "Linear Algebra studies vectors, matrices, and linear transformations. Key topics: vector spaces, eigenvalues/eigenvectors, matrix multiplication, determinants, and systems of linear equations."},
    {"id": "kb-006", "topic": "math", "title": "Calculus Foundations",
     "content": "Calculus studies rates of change (differential) and accumulation (integral). Key concepts: limits, derivatives, integrals, chain rule, product rule, and the fundamental theorem of calculus."},
    {"id": "kb-007", "topic": "web", "title": "React Fundamentals",
     "content": "React is a JavaScript library for building user interfaces. Core concepts: components (functional and class), JSX, props, state (useState), effects (useEffect), and the virtual DOM for efficient rendering."},
    {"id": "kb-008", "topic": "web", "title": "FastAPI Basics",
     "content": "FastAPI is a modern Python web framework for building APIs. Features: automatic OpenAPI docs, Pydantic validation, async support, dependency injection, and type hints for request/response schemas."},
]


@tool
def search_learning_materials(query: str) -> List[Dict[str, str]]:
    """
    Search the knowledge base for learning materials relevant to the query.
    Use this when the user asks about a specific topic and you need factual grounding.
    Returns a list of relevant documents with title and content.
    """
    query_lower = query.lower()
    results = []
    for doc in KNOWLEDGE_BASE:
        if (query_lower in doc["title"].lower()
                or query_lower in doc["content"].lower()
                or query_lower in doc["topic"].lower()):
            results.append({"title": doc["title"], "content": doc["content"]})
    
    if not results:
        query_words = set(query_lower.split())
        for doc in KNOWLEDGE_BASE:
            doc_words = set(doc["title"].lower().split()) | set(doc["topic"].lower().split())
            if query_words & doc_words:
                results.append({"title": doc["title"], "content": doc["content"]})
    
    return results[:3] if results else [{"title": "No results", "content": f"No materials found for '{query}'."}]


@tool
def scrape_website(url: str) -> str:
    """
    Visit a URL and extract its main text content. 
    Use this when a user provides a link and asks you to analyze or answer questions based on its content.
    """
    try:
        downloaded = trafilatura.fetch_url(url)
        if not downloaded:
            # Fallback using requests if trafilatura fetch fails (e.g. user-agent issues)
            res = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
            downloaded = res.text
            
        content = trafilatura.extract(downloaded)
        if not content:
            return f"Could not extract meaningful content from {url}. The page might be empty or protected."
        
        # Limit content to avoid token limits (approx 3000 words)
        return content[:15000] 
    except Exception as e:
        return f"Error visiting the link: {str(e)}"


@tool
def get_learning_progress(user_id: str) -> Dict[str, Any]:
    """
    Retrieve the user's learning progress and profile from Long-Term Memory.
    """
    profile = ltm_store.get_profile(user_id)
    return {
        "pace": profile.pace,
        "expertise_level": profile.expertise_level,
        "interests": profile.interests,
        "stuck_points": profile.stuck_points,
        "understanding_score": profile.understanding_score,
        "topics_completed": profile.topics_completed,
        "total_messages": profile.total_messages,
    }


@tool
def record_learning_insight(user_id: str, insight_type: str, value: str) -> str:
    """
    Record a learning insight about the user.
    """
    if insight_type == "interest":
        ltm_store.add_interest(user_id, value)
        return f"Recorded new interest: {value}"
    elif insight_type == "stuck":
        ltm_store.add_stuck_point(user_id, value)
        ltm_store.update_understanding(user_id, -0.05)
        return f"Recorded stuck point: {value}"
    elif insight_type == "resolved":
        ltm_store.resolve_stuck_point(user_id, value)
        ltm_store.update_understanding(user_id, 0.1)
        return f"Resolved stuck point: {value}"
    elif insight_type == "pace":
        if value in ("slow", "medium", "fast"):
            ltm_store.update_profile(user_id, pace=value)
            return f"Updated learning pace to: {value}"
    elif insight_type == "level":
        if value in ("beginner", "intermediate", "advanced"):
            ltm_store.update_profile(user_id, expertise_level=value)
            return f"Updated expertise level to: {value}"
    return f"Unknown insight or value: {insight_type}={value}"
