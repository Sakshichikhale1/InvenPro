import os
import sys

# Fix for pyzbar DLL issue on Windows
if sys.platform == 'win32':
    try:
        # We need to find the pyzbar path without importing the submodules yet
        import importlib.util
        spec = importlib.util.find_spec('pyzbar')
        if spec and spec.submodule_search_locations:
            path = spec.submodule_search_locations[0]
            os.add_dll_directory(path)
            os.environ['PATH'] = path + os.pathsep + os.environ['PATH']
    except Exception as e:
        print(f"Warning: Could not add pyzbar DLL directory: {e}")

from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from api.barcode import router as barcode_router
from api.products import router as products_router
from api.chat import router as chat_router
from api.notifications import router as notifications_router

app = FastAPI(title="Smart Inventory System API")

# Configure CORS - Aggressive settings for Render
origins = ["*"] # Broadest possible for troubleshooting

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False, # Credentials must be False if origin is "*"
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Manual OPTIONS handler as a fallback for preflight requests
from fastapi import Request, Response
@app.options("/{rest_of_path:path}")
async def preflight_handler(request: Request, rest_of_path: str):
    response = Response()
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS, DELETE, PUT"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# Diagnostic endpoint to verify live code version
@app.get("/debug-cors")
async def debug_cors(request: Request):
    return {
        "origin_header": request.headers.get("origin"),
        "host": request.headers.get("host"),
        "version": "1.0.2-manual-cors"
    }

# Include routers - Made public for development troubleshooting
app.include_router(barcode_router, prefix="/cv", tags=["Computer Vision"])
app.include_router(products_router, tags=["Products"])
app.include_router(chat_router, prefix="/chat", tags=["Chat"])
app.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])

@app.get("/")
def home():
    return {
        "message": "Smart Inventory System API is running",
        "version": "1.0.2-manual-cors",
        "status": "healthy"
    }
