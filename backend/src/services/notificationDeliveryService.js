const { pool } = require('../config/db');

const REMINDER_MINUTES = Object.freeze({ '10min': 10, '30min': 30, '1hour': 60, '1day': 1440 });
function reminderTrigger(due, option = '10min') {
  const timestamp = new Date(due).getTime();
  if (!Number.isFinite(timestamp) || !Object.hasOwn(REMINDER_MINUTES, option)) throw new Error('Invalid reminder schedule.');
  return new Date(timestamp - REMINDER_MINUTES[option] * 60000);
}

async function ensureReminderDeliverySchema(db = pool) {
  // Delivery receipts, not another inbox or preference table. Keep receipts after
  // inbox deletion so refreshing/restarting cannot redeliver a removed reminder.
  await db.query(`CREATE TABLE IF NOT EXISTS notification_reminder_deliveries (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delivery_key TEXT NOT NULL,
    chore_id UUID NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
    trigger_at TIMESTAMPTZ NOT NULL,
    delivered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY(user_id, delivery_key)
  )`);
}

async function lockNotificationPreferences(db, userId) {
  await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 41))', [userId]);
}

async function deliverUser(userId, now, dbPool) {
  const db = await dbPool.connect();
  try {
    await db.query('BEGIN');
    await lockNotificationPreferences(db, userId);
    const settings = (await db.query('SELECT * FROM notification_settings WHERE user_id=$1', [userId])).rows[0];
    if (settings?.chore_reminders === false) { await db.query('COMMIT'); return 0; }
    const minutes = REMINDER_MINUTES[settings?.reminder_time] ?? 10;
    // Read the current assignment/status/due date on each pass: edits, deletions,
    // completion and preference changes never leave a stale scheduled job.
    const eligible = `c.assigned_to=$1 AND c.status='pending'
      AND EXISTS (SELECT 1 FROM users u WHERE u.id=$1 AND u.is_active IS DISTINCT FROM FALSE)
      AND (c.family_id IS NULL OR EXISTS (SELECT 1 FROM family_members fm WHERE fm.user_id=$1 AND fm.family_id=c.family_id))`;
    const automatic = await db.query(`SELECT c.id, c.title, c.due_date,
      c.due_date - ($3 * interval '1 minute') AS trigger_at
      FROM chores c WHERE ${eligible} AND c.due_date > $2
      AND c.due_date - ($3 * interval '1 minute') <= $2
      ORDER BY c.id FOR SHARE OF c`, [userId, now, minutes]);
    const personal = await db.query(`SELECT r.id, r.chore_id, r.title, r.note, r.remind_at AS trigger_at
      FROM personal_reminders r JOIN chores c ON c.id=r.chore_id
      WHERE r.user_id=$1 AND ${eligible} AND r.remind_at <= $2
      AND (c.due_date IS NULL OR c.due_date > $2)
      ORDER BY r.id FOR SHARE OF r, c`, [userId, now]);
    let delivered = 0;
    for (const row of [...automatic.rows, ...personal.rows]) {
      const isPersonal = row.chore_id !== undefined;
      const choreId = isPersonal ? row.chore_id : row.id;
      const key = isPersonal ? `personal:${row.id}:${new Date(row.trigger_at).toISOString()}`
        : `chore:${row.id}:${new Date(row.due_date).toISOString()}`;
      const claim = await db.query(`INSERT INTO notification_reminder_deliveries(user_id,delivery_key,chore_id,trigger_at,delivered_at)
        VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING RETURNING delivery_key`, [userId, key, choreId, row.trigger_at, now]);
      if (!claim.rowCount) continue;
      await db.query(`INSERT INTO notifications(user_id,title,message,type,chore_id,reminder_at,created_at)
        VALUES($1,$2,$3,$4,$5,$6,$7)`, [userId, isPersonal ? row.title : 'Chore Reminder',
        isPersonal ? row.note || row.title : `Reminder for: "${row.title}"`,
        isPersonal ? 'personal_reminder' : 'chore_reminder', choreId, row.trigger_at, now]);
      delivered++;
    }
    await db.query('COMMIT'); return delivered;
  } catch (error) { await db.query('ROLLBACK'); throw error; }
  finally { db.release(); }
}

async function processDueReminders({ userId, now = new Date(), dbPool = pool } = {}) {
  const users = userId ? [userId] : (await dbPool.query(`SELECT DISTINCT assigned_to AS id FROM chores
    WHERE assigned_to IS NOT NULL AND status='pending' AND (due_date IS NULL OR due_date>$1)`, [now])).rows.map(row => row.id);
  let delivered = 0;
  for (const id of users) delivered += await deliverUser(id, now, dbPool);
  return delivered;
}

function startReminderDeliveryWorker() {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try { await processDueReminders(); }
    catch { console.error('In-app reminder delivery failed; the next pass will retry.'); }
    finally { running = false; }
  };
  void tick(); const timer = setInterval(() => void tick(), 30000); timer.unref();
  return () => clearInterval(timer);
}

async function notifyFamilyUpdate(db, familyId, actorId, title, message) {
  await db.query(`INSERT INTO notifications(user_id,title,message,type)
    SELECT fm.user_id,$3,$4,'family_update' FROM family_members fm
    LEFT JOIN notification_settings ns ON ns.user_id=fm.user_id
    WHERE fm.family_id=$1 AND fm.user_id<>$2 AND COALESCE(ns.family_updates,TRUE)`, [familyId, actorId, title, message]);
}

module.exports = { REMINDER_MINUTES, reminderTrigger, ensureReminderDeliverySchema, lockNotificationPreferences,
  processDueReminders, startReminderDeliveryWorker, notifyFamilyUpdate };
