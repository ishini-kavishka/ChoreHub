-- Apply explicitly after member1_auth, member2_chores_families and member4 settings.
BEGIN;
CREATE TABLE IF NOT EXISTS personal_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chore_id UUID REFERENCES chores(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),
  note TEXT NOT NULL DEFAULT '' CHECK (length(note) <= 2000),
  remind_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS personal_reminders_owner_time ON personal_reminders(user_id, remind_at);
ALTER TABLE personal_reminders ADD COLUMN IF NOT EXISTS vibrate BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE personal_reminders ADD COLUMN IF NOT EXISTS sound BOOLEAN NOT NULL DEFAULT TRUE;
CREATE TABLE IF NOT EXISTS household_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),
  message TEXT NOT NULL CHECK (length(trim(message)) BETWEEN 1 AND 5000),
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS household_announcements_family ON household_announcements(family_id, created_at);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS announcement_id UUID REFERENCES household_announcements(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS notification_announcement_recipient ON notifications(announcement_id, user_id) WHERE announcement_id IS NOT NULL;
COMMIT;
