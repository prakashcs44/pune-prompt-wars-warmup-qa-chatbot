from app.agents.orchestrator import LuminaOrchestrator

_orchestrator: LuminaOrchestrator | None = None

def get_orchestrator() -> LuminaOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = LuminaOrchestrator()
    return _orchestrator
