from fastapi import APIRouter
from app.config import API_TITLE, API_VERSION

router = APIRouter()


@router.get("/model-context")
async def get_model_context():
    """Return metadata about the model context protocol."""
    return {
        "service": API_TITLE,
        "version": API_VERSION,
        "supported_validation_types": ["all", "submit", "general"],
    }
