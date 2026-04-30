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

class LoginRequest(BaseModel):
    username: str
    password: str

def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ")[1]
    if token != "invenpro-token":
        raise HTTPException(status_code=401, detail="Invalid token")
    return token

app = FastAPI(title="Smart Inventory System API")

from fastapi import Request

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"📡 CONNECTION ATTEMPT: {request.method} {request.url}")
    print(f"👉 FROM ORIGIN: {request.headers.get('origin')}")
    response = await call_next(request)
    return response

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://invenpro-ui.onrender.com",
    "https://smart-stock-keeper-main.onrender.com", # In case this is an alternate UI URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers - Made public for development troubleshooting
app.include_router(barcode_router, prefix="/cv", tags=["Computer Vision"])
app.include_router(products_router, tags=["Products"])
app.include_router(chat_router, prefix="/chat", tags=["Chat"])
app.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])

@app.post("/login")
def login(req: LoginRequest):
    print(f"DEBUG: Login attempt - username: '{req.username}', password: '{req.password}'")
    if req.username == "admin" and (req.password == "admin123" or req.password == "admin"):
        return {"token": "invenpro-token"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/")
def home():
    return {"message": "Backend is running"}
