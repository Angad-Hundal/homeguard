from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.models import Property
from schemas.schemas import PropertyCreate, PropertyUpdate, PropertyOut
from core.security import get_current_user_id

router = APIRouter(prefix="/properties", tags=["properties"])


@router.get("/", response_model=List[PropertyOut])
def list_properties(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return db.query(Property).filter(Property.user_id == user_id).all()


@router.post("/", response_model=PropertyOut)
def create_property(
    data: PropertyCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    prop = Property(**data.model_dump(), user_id=user_id)
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return prop


@router.get("/{property_id}", response_model=PropertyOut)
def get_property(
    property_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    prop = db.query(Property).filter(Property.id == property_id, Property.user_id == user_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop


@router.patch("/{property_id}", response_model=PropertyOut)
def update_property(
    property_id: int,
    data: PropertyUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    prop = db.query(Property).filter(Property.id == property_id, Property.user_id == user_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(prop, k, v)
    db.commit()
    db.refresh(prop)
    return prop


@router.delete("/{property_id}")
def delete_property(
    property_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    prop = db.query(Property).filter(Property.id == property_id, Property.user_id == user_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    db.delete(prop)
    db.commit()
    return {"ok": True}
