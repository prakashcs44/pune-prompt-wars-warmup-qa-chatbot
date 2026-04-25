import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from app.agents.orchestrator import LuminaOrchestrator

app = FastAPI(title="Lumina AI - Intelligent Learning Assistant")
orchestrator = LuminaOrchestrator()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    session_id: str
    user_id: str

@app.get("/")
async def root():
    return {"message": "Lumina AI API is running"}

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        response = await orchestrator.chat(
            user_id=request.user_id,
            session_id=request.session_id,
            message=request.message
        )
        return {
            "response": response,
            "session_id": request.session_id
        }
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
