from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import httpx

from database import get_db
from models.models import User
from schemas.schemas import UserOut
from core.security import create_access_token, get_current_user_id
from core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/google")
async def google_auth(token: dict, db: Session = Depends(get_db)):
    """Exchange Google ID token for app JWT."""
    google_token = token.get("id_token")
    if not google_token:
        raise HTTPException(status_code=400, detail="Missing id_token")

    # Verify token with Google
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={google_token}"
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google token")
        google_data = resp.json()

    if google_data.get("aud") != settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=401, detail="Token audience mismatch")

    google_id = google_data.get("sub")
    email = google_data.get("email")
    name = google_data.get("name", email)
    avatar_url = google_data.get("picture")

    # Find or create user
    user = db.query(User).filter(User.google_id == google_id).first()
    if not user:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.google_id = google_id
            user.avatar_url = avatar_url
        else:
            user = User(
                email=email,
                name=name,
                avatar_url=avatar_url,
                google_id=google_id,
            )
            db.add(user)
    else:
        user.avatar_url = avatar_url
        user.name = name

    db.commit()
    db.refresh(user)

    access_token = create_access_token({"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer", "user": UserOut.model_validate(user)}


@router.get("/me", response_model=UserOut)
def get_me(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
