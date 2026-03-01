from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Float, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


class PropertyType(str, enum.Enum):
    house = "house"
    apartment = "apartment"
    condo = "condo"
    townhouse = "townhouse"
    other = "other"


class ApplianceCategory(str, enum.Enum):
    hvac = "hvac"
    kitchen = "kitchen"
    plumbing = "plumbing"
    electrical = "electrical"
    exterior = "exterior"
    laundry = "laundry"
    safety = "safety"
    other = "other"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    google_id = Column(String, unique=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    properties = relationship("Property", back_populates="owner", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    address = Column(String, nullable=True)
    property_type = Column(String, default="house")
    year_built = Column(Integer, nullable=True)
    square_footage = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="properties")
    appliances = relationship("Appliance", back_populates="property", cascade="all, delete-orphan")


class Appliance(Base):
    __tablename__ = "appliances"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    name = Column(String, nullable=False)
    brand = Column(String, nullable=True)
    model = Column(String, nullable=True)
    serial_number = Column(String, nullable=True)
    category = Column(String, default="other")
    purchase_date = Column(DateTime(timezone=True), nullable=True)
    warranty_expiry = Column(DateTime(timezone=True), nullable=True)
    purchase_cost = Column(Float, nullable=True)
    photo_url = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    property = relationship("Property", back_populates="appliances")
    tasks = relationship("MaintenanceTask", back_populates="appliance", cascade="all, delete-orphan")


class MaintenanceTask(Base):
    __tablename__ = "maintenance_tasks"

    id = Column(Integer, primary_key=True, index=True)
    appliance_id = Column(Integer, ForeignKey("appliances.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    frequency_days = Column(Integer, nullable=False)
    last_completed = Column(DateTime(timezone=True), nullable=True)
    next_due = Column(DateTime(timezone=True), nullable=False)
    estimated_cost = Column(Float, nullable=True)
    reminder_days_before = Column(Integer, default=7)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    appliance = relationship("Appliance", back_populates="tasks")
    logs = relationship("MaintenanceLog", back_populates="task", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="task")


class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("maintenance_tasks.id"), nullable=False)
    completed_at = Column(DateTime(timezone=True), server_default=func.now())
    actual_cost = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    completed_by = Column(String, nullable=True)

    task = relationship("MaintenanceTask", back_populates="logs")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    task_id = Column(Integer, ForeignKey("maintenance_tasks.id"), nullable=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    notification_type = Column(String, default="reminder")  # reminder, overdue, warranty
    sent_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notifications")
    task = relationship("MaintenanceTask", back_populates="notifications")
