from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from api.routes import router
from api import auth, portfolios, admin
import os

app = FastAPI(
    title="Flagium AI Analysis Engine",
    docs_url="/api-docs",  # Move Swagger UI
    redoc_url="/api-redoc" # Move Redoc
)

# CORS Config
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://80.225.201.34",
    "https://flagiumai.com",
    "https://www.flagiumai.com",
    "http://flagiumai.com",
    "http://www.flagiumai.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(portfolios.router, prefix="/api/portfolios", tags=["Portfolios"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

# Serve Technical Documentation at /docs
docs_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "docs")
if os.path.exists(docs_path):
    app.mount("/docs", StaticFiles(directory=docs_path, html=True), name="docs")
