"""
Lumina AI — Authentication Routes.
"""

import uuid
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
import sqlite3

from app.models import UserSignup, UserOut, Token, UserLogin
from app.utils.auth import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    get_db, 
    get_current_user
)
from app.memory.long_term import ltm_store

import logging
router = APIRouter(prefix="/auth", tags=["Auth"])
logger = logging.getLogger(__name__)


@router.post("/signup", response_model=UserOut)
async def signup(user_data: UserSignup, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    # Check if user exists
    cursor.execute("SELECT id FROM users WHERE email = ?", (user_data.email,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    
    cursor.execute(
        "INSERT INTO users (id, email, hashed_password) VALUES (?, ?, ?)",
        (user_id, user_data.email, hashed_password)
    )
    db.commit()
    
    # Initialize learner profile in LTM
    ltm_store.get_profile(user_id)
    
    return UserOut(id=user_id, email=user_data.email)


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT id, email, hashed_password FROM users WHERE email = ?", (form_data.username,))
    user = cursor.fetchone()
    
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user["id"]})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
async def get_me(current_user: UserOut = Depends(get_current_user)):
    return current_user
