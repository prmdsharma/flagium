from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
from api import auth, portfolios

app = FastAPI(title="Flagium Analysis Engine")

# CORS Config
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
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
