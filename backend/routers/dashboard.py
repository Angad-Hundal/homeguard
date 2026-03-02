from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone

from database import get_db
from models.models import Property, Appliance, MaintenanceTask, MaintenanceLog, Notification
from schemas.schemas import DashboardStats
from core.security import get_current_user_id

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    year_start = datetime(now.year, 1, 1, tzinfo=timezone.utc)

    total_properties = db.query(Property).filter(Property.user_id == user_id).count()

    total_appliances = (
        db.query(Appliance)
        .join(Property)
        .filter(Property.user_id == user_id)
        .count()
    )

    upcoming_tasks_count = (
        db.query(MaintenanceTask)
        .join(Appliance)
        .join(Property)
        .filter(
            Property.user_id == user_id,
            MaintenanceTask.is_active == True,
            MaintenanceTask.next_due >= now,
            MaintenanceTask.next_due <= now + timedelta(days=30),
        )
        .count()
    )

    overdue_tasks_count = (
        db.query(MaintenanceTask)
        .join(Appliance)
        .join(Property)
        .filter(
            Property.user_id == user_id,
            MaintenanceTask.is_active == True,
            MaintenanceTask.next_due < now,
        )
        .count()
    )

    # Total cost logged this year
    cost_result = (
        db.query(func.sum(MaintenanceLog.actual_cost))
        .join(MaintenanceTask)
        .join(Appliance)
        .join(Property)
        .filter(
            Property.user_id == user_id,
            MaintenanceLog.completed_at >= year_start,
        )
        .scalar()
    )
    total_cost_this_year = float(cost_result or 0)

    # Health score: % of tasks that are NOT overdue
    total_active = (
        db.query(MaintenanceTask)
        .join(Appliance)
        .join(Property)
        .filter(Property.user_id == user_id, MaintenanceTask.is_active == True)
        .count()
    )
    health_score = 100
    if total_active > 0:
        health_score = max(0, round(((total_active - overdue_tasks_count) / total_active) * 100))

    unread_notifications = (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read == False)
        .count()
    )

    return DashboardStats(
        total_properties=total_properties,
        total_appliances=total_appliances,
        upcoming_tasks_count=upcoming_tasks_count,
        overdue_tasks_count=overdue_tasks_count,
        total_cost_this_year=total_cost_this_year,
        health_score=health_score,
        unread_notifications=unread_notifications,
    )


@router.get("/upcoming-tasks")
def get_upcoming_tasks(
    days: int = 30,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    tasks = (
        db.query(MaintenanceTask)
        .join(Appliance)
        .join(Property)
        .filter(
            Property.user_id == user_id,
            MaintenanceTask.is_active == True,
            MaintenanceTask.next_due <= now + timedelta(days=days),
        )
        .order_by(MaintenanceTask.next_due)
        .limit(10)
        .all()
    )

    result = []
    for task in tasks:
        result.append({
            "id": task.id,
            "title": task.title,
            "appliance_name": task.appliance.name,
            "property_name": task.appliance.property.name,
            "next_due": task.next_due.isoformat(),
            "is_overdue": task.next_due < now,
            "estimated_cost": task.estimated_cost,
            "category": task.appliance.category,
        })
    return result
