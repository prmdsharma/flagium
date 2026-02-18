import pytest
import os
import sys
from unittest.mock import MagicMock

# Mock growwapi which is missing and causing import errors
sys.modules["growwapi"] = MagicMock()

from api.server import app as fastapi_app
from api.auth import get_current_user

# Global mock user
MOCK_USER = {"id": 1, "email": "test@example.com", "role": "admin"}

def override_get_current_user():
    return MOCK_USER

fastapi_app.dependency_overrides[get_current_user] = override_get_current_user

from httpx import AsyncClient
import pytest_asyncio

@pytest_asyncio.fixture
async def client():
    async with AsyncClient(app=fastapi_app, base_url="http://test") as ac:
        yield ac
