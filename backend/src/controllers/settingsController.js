const { pool } = require('../config/db');

// ─── Notification Settings ────────────────────────────────────────────────────

/**
 * GET /api/settings/notifications
 */
async function getNotificationSettings(req, res, next) {
  try {
    const userId = req.userId;
    const result = await pool.query(
      'SELECT * FROM notification_settings WHERE user_id = $1',
      [userId]
    );

    if (!result.rows[0]) {
      // Return defaults if no row yet
      return res.json({
        settings: {
          user_id: userId,
          chore_reminders: true,
          chore_completions: true,
          family_updates: true,
          announcements: false,
          reminder_time: '10min',
        },
      });
    }

    return res.json({ settings: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}

/**
 * PUT /api/settings/notifications
 */
async function updateNotificationSettings(req, res, next) {
  try {
    const userId = req.userId;
    const {
      chore_reminders,
      chore_completions,
      family_updates,
      announcements,
      reminder_time,
    } = req.body || {};

    const validReminderTimes = ['10min', '30min', '1hour', '1day'];
    if (![chore_reminders, chore_completions, family_updates, announcements].every((v) => typeof v === 'boolean') || !validReminderTimes.includes(reminder_time)) {
      return res.status(400).json({ message: 'Provide boolean notification options and a valid reminder_time.' });
    }
    const safeReminderTime = reminder_time;

    const result = await pool.query(
      `INSERT INTO notification_settings
         (user_id, chore_reminders, chore_completions, family_updates, announcements, reminder_time, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET
         chore_reminders = EXCLUDED.chore_reminders,
         chore_completions = EXCLUDED.chore_completions,
         family_updates = EXCLUDED.family_updates,
         announcements = EXCLUDED.announcements,
         reminder_time = EXCLUDED.reminder_time,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        userId,
        chore_reminders,
        chore_completions,
        family_updates,
        announcements,
        safeReminderTime,
      ]
    );

    return res.json({ settings: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}

// ─── User Preferences ─────────────────────────────────────────────────────────

/**
 * GET /api/settings/preferences
 */
async function getPreferences(req, res, next) {
  try {
    const userId = req.userId;
    const result = await pool.query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [userId]
    );

    if (!result.rows[0]) {
      return res.json({
        preferences: { user_id: userId, theme: 'light', language: 'en' },
      });
    }

    return res.json({ preferences: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}

/**
 * PUT /api/settings/preferences
 */
async function updatePreferences(req, res, next) {
  try {
    const userId = req.userId;
    const { theme, language } = req.body || {};

    const validThemes = ['light', 'dark'];
    const validLanguages = ['en', 'si', 'ta'];

    if (!validThemes.includes(theme) || !validLanguages.includes(language)) return res.status(400).json({ message: 'Theme or language is invalid.' });
    const safeTheme = theme;
    const safeLang = language;

    const result = await pool.query(
      `INSERT INTO user_preferences (user_id, theme, language, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET
         theme = EXCLUDED.theme,
         language = EXCLUDED.language,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, safeTheme, safeLang]
    );

    return res.json({ preferences: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getNotificationSettings,
  updateNotificationSettings,
  getPreferences,
  updatePreferences,
};
