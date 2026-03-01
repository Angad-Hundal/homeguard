from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.models import Notification
from schemas.schemas import NotificationOut
from core.security import get_current_user_id

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=List[NotificationOut])
def list_notifications(
    unread_only: bool = False,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    query = db.query(Notification).filter(Notification.user_id == user_id)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    return query.order_by(Notification.sent_at.desc()).limit(50).all()


@router.patch("/{notification_id}/read")
def mark_read(
    notification_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id,
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"ok": True}


@router.post("/read-all")
def mark_all_read(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"ok": True}
