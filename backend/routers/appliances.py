from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.models import Appliance, Property
from schemas.schemas import ApplianceCreate, ApplianceUpdate, ApplianceOut
from core.security import get_current_user_id

router = APIRouter(prefix="/appliances", tags=["appliances"])


def verify_property_ownership(property_id: int, user_id: int, db: Session):
    prop = db.query(Property).filter(Property.id == property_id, Property.user_id == user_id).first()
    if not prop:
        raise HTTPException(status_code=403, detail="Property not found or not yours")
    return prop


@router.get("/", response_model=List[ApplianceOut])
def list_appliances(
    property_id: int = None,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Appliance)
        .join(Property)
        .filter(Property.user_id == user_id)
    )
    if property_id:
        query = query.filter(Appliance.property_id == property_id)
    return query.all()


@router.post("/", response_model=ApplianceOut)
def create_appliance(
    data: ApplianceCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    verify_property_ownership(data.property_id, user_id, db)
    appliance = Appliance(**data.model_dump())
    db.add(appliance)
    db.commit()
    db.refresh(appliance)
    return appliance


@router.get("/{appliance_id}", response_model=ApplianceOut)
def get_appliance(
    appliance_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    appliance = (
        db.query(Appliance)
        .join(Property)
        .filter(Appliance.id == appliance_id, Property.user_id == user_id)
        .first()
    )
    if not appliance:
        raise HTTPException(status_code=404, detail="Appliance not found")
    return appliance


@router.patch("/{appliance_id}", response_model=ApplianceOut)
def update_appliance(
    appliance_id: int,
    data: ApplianceUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    appliance = (
        db.query(Appliance)
        .join(Property)
        .filter(Appliance.id == appliance_id, Property.user_id == user_id)
        .first()
    )
    if not appliance:
        raise HTTPException(status_code=404, detail="Appliance not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(appliance, k, v)
    db.commit()
    db.refresh(appliance)
    return appliance


@router.delete("/{appliance_id}")
def delete_appliance(
    appliance_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    appliance = (
        db.query(Appliance)
        .join(Property)
        .filter(Appliance.id == appliance_id, Property.user_id == user_id)
        .first()
    )
    if not appliance:
        raise HTTPException(status_code=404, detail="Appliance not found")
    db.delete(appliance)
    db.commit()
    return {"ok": True}
