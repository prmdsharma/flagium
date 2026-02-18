from typing import Optional
import jwt
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from passlib.context import CryptContext
from db.connection import get_connection

import os
from dotenv import load_dotenv

import secrets
from api.email_utils import send_verification_email

# Load environment variables
load_dotenv()

# Config
SECRET_KEY = os.getenv("SECRET_KEY", "flagium_super_secret_key_change_me_in_prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 1 day

# Router
router = APIRouter()

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Models
class UserRegister(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserProfile(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    role: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

# Helpers
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        user_id: int = payload.get("id")
        if email is None:
            raise credentials_exception
        
        # Fetch fresh role from DB to handle promotions without re-login
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
            row = cursor.fetchone()
            if row:
                role = row[0]
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Error fetching fresh role: {e}")
            # Fallback to token role if DB fails? Or just fail? 
            # Let's fallback to token role or just continue with token role if DB fails
            pass

        return {"id": user_id, "email": email, "role": role}
    except jwt.PyJWTError:
        raise credentials_exception

# Endpoints
@router.post("/register", response_model=UserProfile)
def register(user: UserRegister):
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check existing
    cursor.execute("SELECT id FROM users WHERE email = %s", (user.email,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user with verification token
    hashed_pw = get_password_hash(user.password)
    verification_token = secrets.token_urlsafe(32)
    
    try:
        cursor.execute(
            "INSERT INTO users (email, password_hash, full_name, role, is_verified, verification_token) VALUES (%s, %s, %s, 'free', 0, %s)",
            (user.email, hashed_pw, user.full_name, verification_token)
        )
        conn.commit()
        user_id = cursor.lastrowid
        
        # Send email
        send_verification_email(user.email, verification_token)
        
        return {"id": user_id, "email": user.email, "full_name": user.full_name, "role": "free"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Note: OAuth2PasswordRequestForm expects 'username', we map email to username
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("SELECT * FROM users WHERE email = %s", (form_data.username,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.get("is_verified"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address before logging in."
        )
    
    access_token = create_access_token(data={"sub": user["email"], "id": user["id"], "role": user["role"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/verify-email")
def verify_email(token: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("SELECT id FROM users WHERE verification_token = %s", (token,))
    user = cursor.fetchone()
    
    if not user:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    
    try:
        cursor.execute("UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = %s", (user["id"],))
        conn.commit()
        return {"message": "Email verified successfully! You can now log in."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.get("/me", response_model=UserProfile)
def read_users_me(current_user: dict = Depends(get_current_user)):
    # Fetch latest details from DB in case role changed
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, email, full_name, role FROM users WHERE id = %s", (current_user["id"],))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    return user

@router.put("/me", response_model=UserProfile)
def update_user_profile(update_data: UserUpdate, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "UPDATE users SET full_name = %s WHERE id = %s",
            (update_data.full_name, current_user["id"])
        )
        conn.commit()
        
        cursor.execute("SELECT id, email, full_name, role FROM users WHERE id = %s", (current_user["id"],))
        updated_user = cursor.fetchone()
        return updated_user
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.post("/change-password")
def change_password(data: PasswordChange, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Verify old password
    cursor.execute("SELECT password_hash FROM users WHERE id = %s", (current_user["id"],))
    user = cursor.fetchone()
    if not user or not verify_password(data.old_password, user["password_hash"]):
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    # Hash new password
    hashed_pw = get_password_hash(data.new_password)
    try:
        cursor.execute("UPDATE users SET password_hash = %s WHERE id = %s", (hashed_pw, current_user["id"]))
        conn.commit()
        return {"message": "Password updated successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()
