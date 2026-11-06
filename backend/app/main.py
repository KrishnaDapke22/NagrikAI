import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.database.session import engine, Base, SessionLocal
from backend.app.services.department_service import seed_default_departments
import backend.app.models  # Register all models

from backend.app.api.auth import router as auth_router
from backend.app.api.complaints import router as complaints_router
from backend.app.api.officer import router as officer_router
from backend.app.api.admin import router as admin_router
from backend.app.api.ai import router as ai_router
from backend.app.api.departments import router as departments_router
from backend.app.api.uploads import router as uploads_router
from backend.app.api.notifications import router as notifications_router
from backend.app.api.incidents import router as incidents_router

# Initialize database schema
Base.metadata.create_all(bind=engine)

# Seed default departments on start
db = SessionLocal()
try:
    seed_default_departments(db)
finally:
    db.close()

app = FastAPI(
    title="NagrikAI API",
    description="NagrikAI – Your Voice. Your City. Our Responsibility. Intelligent Civic Grievance Management Platform",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads static folder
uploads_dir = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Include Routers
app.include_router(auth_router, prefix="/api")
app.include_router(complaints_router, prefix="/api")
app.include_router(officer_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(departments_router, prefix="/api")
app.include_router(uploads_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(incidents_router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "platform": "NagrikAI",
        "tagline": "Your Voice. Your City. Our Responsibility.",
        "version": "2.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
