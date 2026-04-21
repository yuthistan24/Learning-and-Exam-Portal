from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints.evaluate import router as evaluation_router
from app.api.endpoints.ocr import router as ocr_router
from app.config import config
from app.utils.logger import logger

# Create FastAPI app
app = FastAPI(
    title="Global Exams - AI Evaluation Engine",
    description="Python microservice for answer evaluation using various methods",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(evaluation_router)
app.include_router(ocr_router)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Global Exams AI Evaluation Engine",
        "version": "1.0.0",
        "status": "running"
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting Python Evaluation Service on {config.HOST}:{config.PORT}")
    logger.info(f"Debug mode: {config.DEBUG}")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Python Evaluation Service shutting down")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=config.HOST,
        port=config.PORT,
        debug=config.DEBUG
    )
