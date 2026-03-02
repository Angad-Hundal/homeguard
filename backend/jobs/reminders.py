from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import resend
import logging

from database import SessionLocal
from models.models import MaintenanceTask, Appliance, Property, User, Notification
from core.config import settings

logger = logging.getLogger(__name__)


def send_reminder_email(to_email: str, user_name: str, task_title: str, appliance_name: str, due_date: datetime, days_until: int):
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set, skipping email")
        return

    resend.api_key = settings.RESEND_API_KEY
    subject = f"🔧 Reminder: {task_title} due {'today' if days_until == 0 else f'in {days_until} days'}"
    
    body = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">HomeGuard Reminder</h2>
        <p>Hi {user_name},</p>
        <p>This is a reminder that the following maintenance task is coming up:</p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <strong>{task_title}</strong><br/>
            <span style="color: #666;">Appliance: {appliance_name}</span><br/>
            <span style="color: #666;">Due: {due_date.strftime('%B %d, %Y')}</span>
        </div>
        <p>Log in to HomeGuard to mark it complete once done.</p>
        <a href="{settings.FRONTEND_URL}/dashboard" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">View Dashboard</a>
    </div>
    """

    try:
        resend.Emails.send({
            "from": "HomeGuard <reminders@yourdomain.com>",
            "to": [to_email],
            "subject": subject,
            "html": body,
        })
    except Exception as e:
        logger.error(f"Failed to send email: {e}")


def check_and_send_reminders():
    """Run daily — check for tasks due soon and send reminders."""
    db: Session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        
        tasks = (
            db.query(MaintenanceTask)
            .join(Appliance)
            .join(Property)
            .filter(MaintenanceTask.is_active == True)
            .all()
        )

        for task in tasks:
            days_until = (task.next_due - now).days
            if days_until not in [0, task.reminder_days_before]:
                continue

            user = task.appliance.property.owner

            # Create in-app notification
            notif = Notification(
                user_id=user.id,
                task_id=task.id,
                title=f"Maintenance Due: {task.title}",
                message=f"{task.title} for {task.appliance.name} is due {'today' if days_until == 0 else f'in {days_until} days'}.",
                notification_type="reminder" if days_until > 0 else "overdue",
            )
            db.add(notif)

            # Send email
            send_reminder_email(
                to_email=user.email,
                user_name=user.name,
                task_title=task.title,
                appliance_name=task.appliance.name,
                due_date=task.next_due,
                days_until=days_until,
            )

        # Mark overdue tasks
        overdue_tasks = (
            db.query(MaintenanceTask)
            .filter(MaintenanceTask.is_active == True, MaintenanceTask.next_due < now)
            .all()
        )
        for task in overdue_tasks:
            # Only notify once per day for overdue
            existing = db.query(Notification).filter(
                Notification.task_id == task.id,
                Notification.notification_type == "overdue",
                Notification.sent_at >= now - timedelta(hours=23),
            ).first()
            if not existing:
                user = task.appliance.property.owner
                notif = Notification(
                    user_id=user.id,
                    task_id=task.id,
                    title=f"⚠️ Overdue: {task.title}",
                    message=f"{task.title} for {task.appliance.name} was due on {task.next_due.strftime('%B %d')}.",
                    notification_type="overdue",
                )
                db.add(notif)

        db.commit()
        logger.info(f"Reminder check complete at {now}")
    except Exception as e:
        logger.error(f"Error in reminder job: {e}")
        db.rollback()
    finally:
        db.close()


def start_scheduler():
    scheduler = BackgroundScheduler()
    # Run every day at 9am UTC
    scheduler.add_job(check_and_send_reminders, "cron", hour=9, minute=0)
    scheduler.start()
    logger.info("Scheduler started")
    return scheduler
