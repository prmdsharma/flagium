from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from api.routes import router
from api import auth, portfolios, admin
import os

app = FastAPI(
    title="Flagium AI Analysis Engine",
    docs_url=None,
    redoc_url=None
)

FAVICON_URL = "/favicon.png"

@app.get("/api-docs", include_in_schema=False)
async def custom_swagger_ui():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=app.title + " — API Docs",
        swagger_favicon_url=FAVICON_URL
    )

@app.get("/api-redoc", include_in_schema=False)
async def custom_redoc():
    return get_redoc_html(
        openapi_url=app.openapi_url,
        title=app.title + " — ReDoc",
        redoc_favicon_url=FAVICON_URL
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

@app.get("/api/ping")
@app.get("/ping")
def ping():
    return {
        "status": "ok", 
        "version": "1.0.4", 
        "message": "Flagium API is live"
    }

# Serve Technical Documentation (Redundant mounts)
docs_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "docs")
if os.path.exists(docs_path):
    app.mount("/api/docs", StaticFiles(directory=docs_path, html=True), name="docs_prefix")
    app.mount("/docs", StaticFiles(directory=docs_path, html=True), name="docs_root")
