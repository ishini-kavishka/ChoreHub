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
    let resolvedLanguage = row.language || 'en';

    // Edge case: If client previously had a language that is now disabled by admin, fall back safely to 'en'
    try {
      const langCheck = await pool.query('SELECT is_enabled FROM supported_languages WHERE code = $1', [resolvedLanguage]);
      if (langCheck.rows[0] && !langCheck.rows[0].is_enabled) {
        resolvedLanguage = 'en';
      }
    } catch (_e) {
      // if table does not exist yet, keep stored language
    }

    return res.json({
      preferences: {
        ...row,
        language: resolvedLanguage,
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
    if (language !== undefined) {
      if (!validLanguages.includes(language)) return res.status(400).json({ message: 'Language is invalid.' });

      // Admin enabled language check: client cannot select a language that has been disabled
      try {
        const langCheck = await pool.query('SELECT is_enabled FROM supported_languages WHERE code = $1', [language]);
        if (langCheck.rows[0] && !langCheck.rows[0].is_enabled) {
          return res.status(400).json({ message: 'This language is currently not enabled by the administrator.' });
        }
      } catch (_e) {
        // if table does not exist yet, allow fallback
      }
    }

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

// ─── Supported Languages ───────────────────────────────────────────────────────

const FULLY_SUPPORTED_CODES = ['en', 'si', 'ta'];

/**
 * GET /api/settings/languages
 * Returns all supported languages and their enabled states.
 */
async function getSupportedLanguages(_req, res, next) {
  try {
    // Ensure table exists and has default entries
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.supported_languages (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        native_name TEXT NOT NULL,
        flag TEXT NOT NULL DEFAULT '🌐',
        is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO public.supported_languages (code, name, native_name, flag, is_enabled, sort_order)
      VALUES
        ('en', 'English', 'English', '🌐', TRUE, 1),
        ('si', 'Sinhala', 'සිංහල',  '🇱🇰', TRUE, 2),
        ('ta', 'Tamil',   'தமிழ்',  '🇮🇳', TRUE, 3)
      ON CONFLICT (code) DO NOTHING;
    `);

    const result = await pool.query(
      'SELECT code, name, native_name, flag, is_enabled, sort_order FROM supported_languages ORDER BY sort_order ASC, code ASC'
    );
    return res.json({ languages: result.rows });
  } catch (error) {
    return next(error);
  }
}

/**
 * PUT /api/settings/languages
 * Admin only. Body: { code: string, is_enabled: boolean }
 * English ('en') cannot be disabled as it is the system fallback.
 */
async function updateSupportedLanguage(req, res, next) {
  try {
    const { code, is_enabled } = req.body || {};

    if (!code || !FULLY_SUPPORTED_CODES.includes(code)) {
      return res.status(400).json({ message: `Language '${code}' is not supported. Supported codes: ${FULLY_SUPPORTED_CODES.join(', ')}` });
    }
    if (typeof is_enabled !== 'boolean') {
      return res.status(400).json({ message: 'is_enabled must be a boolean.' });
    }
    if (code === 'en' && !is_enabled) {
      return res.status(400).json({ message: "English ('en') is the default fallback language and cannot be disabled." });
    }

    const result = await pool.query(
      `UPDATE supported_languages
       SET is_enabled = $1, updated_at = CURRENT_TIMESTAMP
       WHERE code = $2
       RETURNING code, name, native_name, flag, is_enabled, sort_order`,
      [is_enabled, code]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: `Language '${code}' not found.` });
    }

    return res.json({ language: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getNotificationSettings,
  updateNotificationSettings,
  getPreferences,
  updatePreferences,
  getSupportedLanguages,
  updateSupportedLanguage,
};
