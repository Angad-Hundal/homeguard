from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ─── User ───────────────────────────────────────────────
class UserBase(BaseModel):
    email: EmailStr
    name: str
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    google_id: str


class UserOut(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Property ───────────────────────────────────────────
class PropertyCreate(BaseModel):
    name: str
    address: Optional[str] = None
    property_type: Optional[str] = "house"
    year_built: Optional[int] = None
    square_footage: Optional[int] = None


class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    property_type: Optional[str] = None
    year_built: Optional[int] = None
    square_footage: Optional[int] = None


class PropertyOut(PropertyCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Appliance ──────────────────────────────────────────
class ApplianceCreate(BaseModel):
    property_id: int
    name: str
    brand: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    category: Optional[str] = "other"
    purchase_date: Optional[datetime] = None
    warranty_expiry: Optional[datetime] = None
    purchase_cost: Optional[float] = None
    photo_url: Optional[str] = None
    notes: Optional[str] = None


class ApplianceUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    category: Optional[str] = None
    purchase_date: Optional[datetime] = None
    warranty_expiry: Optional[datetime] = None
    purchase_cost: Optional[float] = None
    photo_url: Optional[str] = None
    notes: Optional[str] = None


class ApplianceOut(ApplianceCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Maintenance Task ────────────────────────────────────
class TaskCreate(BaseModel):
    appliance_id: int
    title: str
    description: Optional[str] = None
    frequency_days: int
    next_due: datetime
    estimated_cost: Optional[float] = None
    reminder_days_before: Optional[int] = 7


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    frequency_days: Optional[int] = None
    next_due: Optional[datetime] = None
    estimated_cost: Optional[float] = None
    reminder_days_before: Optional[int] = None
    is_active: Optional[bool] = None


class TaskOut(BaseModel):
    id: int
    appliance_id: int
    title: str
    description: Optional[str]
    frequency_days: int
    last_completed: Optional[datetime]
    next_due: datetime
    estimated_cost: Optional[float]
    reminder_days_before: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Maintenance Log ─────────────────────────────────────
class LogCreate(BaseModel):
    task_id: int
    actual_cost: Optional[float] = None
    notes: Optional[str] = None
    completed_by: Optional[str] = None


class LogOut(LogCreate):
    id: int
    completed_at: datetime

    class Config:
        from_attributes = True


# ─── Notification ─────────────────────────────────────────
class NotificationOut(BaseModel):
    id: int
    task_id: Optional[int]
    title: str
    message: str
    is_read: bool
    notification_type: str
    sent_at: datetime

    class Config:
        from_attributes = True


# ─── Dashboard ───────────────────────────────────────────
class DashboardStats(BaseModel):
    total_properties: int
    total_appliances: int
    upcoming_tasks_count: int
    overdue_tasks_count: int
    total_cost_this_year: float
    health_score: int
    unread_notifications: int
