-- Additive, idempotent. Apply after member4_progress_notifications_settings.sql.
-- Preferences only: this does not install a reminder scheduler or push delivery.
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS due_date_alerts BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS weekly_summary BOOLEAN NOT NULL DEFAULT TRUE;
