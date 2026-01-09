# app/main.py
from fastapi import FastAPI
from app.config import API_TITLE, API_DESCRIPTION, API_VERSION
from app.routes import (
    health,
    xml_validation,
    psv_validation,
    mpc_validation,
    model_context,
)

app = FastAPI(title=API_TITLE, description=API_DESCRIPTION, version=API_VERSION)

# Include routers
app.include_router(health.router)
app.include_router(xml_validation.router)
app.include_router(psv_validation.router)
app.include_router(mpc_validation.router)
app.include_router(model_context.router)
