# Lumina: Intelligent Learning Assistant

Lumina is a personalized chatbot designed to adapt to a user's specific learning pace and understanding level. This project was built for a GCP-focused hackathon.

## Features
- **Intelligent Interaction:** Powered by Google Gemini 1.5.
- **Dual-Layer Memory:**
  - **Short-Term Memory (STM):** Thread-specific context managed by LangGraph.
  - **Long-Term Memory (LTM):** User preferences and progress persisted in Firestore.
- **Grounded Answering:** Integration with Google Drive and local materials.
- **Premium UI:** Accessible, high-performance React dashboard with TailwindCSS.

## Project Structure
- `/backend`: FastAPI application with LangGraph agents.
- `/frontend`: React + Vite + TailwindCSS application.
- `/deployment_guide.md`: Step-by-step instructions for GCP.
- `/self_evaluation.md`: Assessment against hackathon criteria.

## Getting Started

### Backend
1. `cd backend`
2. `uv sync`
3. `export GOOGLE_API_KEY=...`
4. `python app/main.py`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Tech Stack
- **Backend:** FastAPI, LangGraph, LangChain, Google Gemini.
- **Frontend:** React, Vite, TailwindCSS, Lucide Icons.
- **Infrastructure:** Google Cloud Run, Firestore, Google Drive API.
