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

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.barcode import router as barcode_router
from api.products import router as products_router

app = FastAPI(title="Smart Inventory System API")

# Configure CORS
origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers

app.include_router(barcode_router, prefix="/cv", tags=["Computer Vision"])
app.include_router(products_router, tags=["Products"])

@app.get("/")
def home():
    return {"message": "Backend is running"}
