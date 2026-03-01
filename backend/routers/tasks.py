from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from database import get_db
from models.models import MaintenanceTask, MaintenanceLog, Appliance, Property
from schemas.schemas import TaskCreate, TaskUpdate, TaskOut, LogCreate, LogOut
from core.security import get_current_user_id

router = APIRouter(prefix="/tasks", tags=["tasks"])


def get_task_or_404(task_id: int, user_id: int, db: Session) -> MaintenanceTask:
    task = (
        db.query(MaintenanceTask)
        .join(Appliance)
        .join(Property)
        .filter(MaintenanceTask.id == task_id, Property.user_id == user_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.get("/", response_model=List[TaskOut])
def list_tasks(
    appliance_id: int = None,
    overdue_only: bool = False,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    query = (
        db.query(MaintenanceTask)
        .join(Appliance)
        .join(Property)
        .filter(Property.user_id == user_id, MaintenanceTask.is_active == True)
    )
    if appliance_id:
        query = query.filter(MaintenanceTask.appliance_id == appliance_id)
    if overdue_only:
        query = query.filter(MaintenanceTask.next_due < datetime.utcnow())
    return query.order_by(MaintenanceTask.next_due).all()


@router.post("/", response_model=TaskOut)
def create_task(
    data: TaskCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    # Verify appliance ownership
    appliance = (
        db.query(Appliance)
        .join(Property)
        .filter(Appliance.id == data.appliance_id, Property.user_id == user_id)
        .first()
    )
    if not appliance:
        raise HTTPException(status_code=403, detail="Appliance not found or not yours")
    task = MaintenanceTask(**data.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    data: TaskUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    task = get_task_or_404(task_id, user_id, db)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(task, k, v)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    task = get_task_or_404(task_id, user_id, db)
    db.delete(task)
    db.commit()
    return {"ok": True}


@router.post("/{task_id}/complete", response_model=LogOut)
def complete_task(
    task_id: int,
    data: LogCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    task = get_task_or_404(task_id, user_id, db)
    now = datetime.utcnow()

    # Create log
    log = MaintenanceLog(
        task_id=task_id,
        actual_cost=data.actual_cost,
        notes=data.notes,
        completed_by=data.completed_by,
        completed_at=now,
    )
    db.add(log)

    # Update task
    task.last_completed = now
    task.next_due = now + timedelta(days=task.frequency_days)

    db.commit()
    db.refresh(log)
    return log


@router.get("/{task_id}/logs", response_model=List[LogOut])
def get_task_logs(
    task_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    get_task_or_404(task_id, user_id, db)
    return (
        db.query(MaintenanceLog)
        .filter(MaintenanceLog.task_id == task_id)
        .order_by(MaintenanceLog.completed_at.desc())
        .all()
    )
