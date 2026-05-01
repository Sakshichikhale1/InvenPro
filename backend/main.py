from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Smart Inventory System API")

# Simple CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "message": "Simple API Test",
        "version": "1.0.3-minimal"
    }

@app.get("/health")
def health():
    return {"status": "ok"}

# Re-adding the notification router to test it in isolation
try:
    from api.notifications import router as notifications_router
    app.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
except ImportError:
    print("SMS Notifications service not found. Skipping...")
