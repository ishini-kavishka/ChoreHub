-- OPTIONAL demo seed. Run only for a dedicated demo user, never a shared database:
-- psql "$DATABASE_URL" -v demo_user_id="<demo-user-uuid>" -f member4_seed.sql
-- Re-running is idempotent. Creates 25 chores (18 complete, 7 pending), six
-- tagged notifications and default settings for the explicitly selected user.
\if :{?demo_user_id}
BEGIN;

CREATE TEMP TABLE _chorehub_demo_user ON COMMIT DROP AS
  SELECT :'demo_user_id'::uuid AS user_id;

DELETE FROM notifications
WHERE user_id = (SELECT user_id FROM _chorehub_demo_user)
  AND message LIKE '[ChoreHub demo seed] %';

INSERT INTO chores (id, family_id, title, created_by, assigned_to, status, completed_at, completed_by)
SELECT (
    substr(md5(u.user_id::text || ':chorehub-demo:' || n::text), 1, 8) || '-' ||
    substr(md5(u.user_id::text || ':chorehub-demo:' || n::text), 9, 4) || '-' ||
    substr(md5(u.user_id::text || ':chorehub-demo:' || n::text), 13, 4) || '-' ||
    substr(md5(u.user_id::text || ':chorehub-demo:' || n::text), 17, 4) || '-' ||
    substr(md5(u.user_id::text || ':chorehub-demo:' || n::text), 21, 12)
  )::uuid,
  NULL,
  CASE WHEN n <= 18 THEN 'Demo completed chore ' ELSE 'Demo pending chore ' END || lpad(n::text, 2, '0'),
  u.user_id,
  u.user_id,
  CASE WHEN n <= 18 THEN 'completed' ELSE 'pending' END,
  CASE WHEN n <= 18 THEN CURRENT_TIMESTAMP - (n || ' hours')::interval ELSE NULL END,
  CASE WHEN n <= 18 THEN u.user_id ELSE NULL END
FROM _chorehub_demo_user u CROSS JOIN generate_series(1, 25) AS n
ON CONFLICT (id) DO NOTHING;

INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
SELECT user_id, title, '[ChoreHub demo seed] ' || message, type, is_read, created_at
FROM _chorehub_demo_user CROSS JOIN (VALUES
  ('Chore Reminder', 'Vacuum Living Room is due in 10 minutes', 'chore_reminder', FALSE, NOW() - INTERVAL '1 hour'),
  ('Chore Completed', 'Dad completed: Wash the car', 'chore_completed', FALSE, NOW() - INTERVAL '2 hours'),
  ('New Chore Assigned', 'You have been assigned: Grocery Shopping', 'chore_assigned', FALSE, NOW() - INTERVAL '3 hours'),
  ('Weekly Progress Update', 'Your family completed 72% of chores this week! Great job!', 'weekly_progress', TRUE, NOW() - INTERVAL '1 day'),
  ('Family Update', 'Mom joined the ChoreSync family', 'family_update', TRUE, NOW() - INTERVAL '1 day 2 hours'),
  ('Chore Reminder', 'Take out trash is due tomorrow', 'chore_reminder', TRUE, NOW() - INTERVAL '1 day 4 hours')
) AS demo(title, message, type, is_read, created_at);

INSERT INTO notification_settings (user_id) SELECT user_id FROM _chorehub_demo_user
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO user_preferences (user_id) SELECT user_id FROM _chorehub_demo_user
ON CONFLICT (user_id) DO NOTHING;

COMMIT;
\else
\echo 'Skipped demo seed: pass -v demo_user_id=<dedicated-demo-user-uuid> explicitly.'
\endif
