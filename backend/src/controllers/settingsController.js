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
          due_date_alerts: true,
          weekly_summary: true,
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
    const { due_date_alerts, weekly_summary } = req.body || {};
    if ([due_date_alerts, weekly_summary].some(v => v !== undefined && typeof v !== 'boolean')) {
      return res.status(400).json({ message: 'Provide boolean due date and weekly summary options.' });
    }
    const safeReminderTime = reminder_time;

    const result = await pool.query(
      `INSERT INTO notification_settings
         (user_id, chore_reminders, chore_completions, family_updates, announcements, reminder_time, due_date_alerts, weekly_summary, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, TRUE), COALESCE($8, TRUE), CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET
         chore_reminders = EXCLUDED.chore_reminders,
         chore_completions = EXCLUDED.chore_completions,
         family_updates = EXCLUDED.family_updates,
         announcements = EXCLUDED.announcements,
         reminder_time = EXCLUDED.reminder_time,
         due_date_alerts = COALESCE($7, notification_settings.due_date_alerts),
         weekly_summary = COALESCE($8, notification_settings.weekly_summary),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        userId,
        chore_reminders,
        chore_completions,
        family_updates,
        announcements,
        safeReminderTime,
        due_date_alerts ?? null,
        weekly_summary ?? null,
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
        preferences: {
          user_id: userId,
          theme: 'light',
          language: 'en',
          brightness: 70,
          auto_brightness: false,
        },
      });
    }

    const row = result.rows[0];
    return res.json({
      preferences: {
        ...row,
        brightness: row.brightness ?? 70,
        auto_brightness: row.auto_brightness ?? false,
      },
    });
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
    const { theme, language, brightness, auto_brightness } = req.body || {};

    const validThemes = ['light', 'dark', 'system'];
    const validLanguages = ['en', 'si', 'ta'];

    if (theme !== undefined && !validThemes.includes(theme)) return res.status(400).json({ message: 'Theme is invalid.' });
    if (language !== undefined && !validLanguages.includes(language)) return res.status(400).json({ message: 'Language is invalid.' });

    const safeTheme = theme ?? null;
    const safeLang = language ?? null;
    const safeBrightness = typeof brightness === 'number' && brightness >= 30 && brightness <= 100 ? Math.round(brightness) : null;
    const safeAutoBrightness = typeof auto_brightness === 'boolean' ? auto_brightness : null;

    const result = await pool.query(
      `INSERT INTO user_preferences (user_id, theme, language, brightness, auto_brightness, updated_at)
       VALUES ($1, COALESCE($2, 'light'), COALESCE($3, 'en'), COALESCE($4, 70), COALESCE($5, FALSE), CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET
         theme = COALESCE($2, user_preferences.theme),
         language = COALESCE($3, user_preferences.language),
         brightness = COALESCE($4, user_preferences.brightness),
         auto_brightness = COALESCE($5, user_preferences.auto_brightness),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, safeTheme, safeLang, safeBrightness, safeAutoBrightness]
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
