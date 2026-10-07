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
  let db;
  try {
    const allowed = ['chore_reminders','chore_completions','family_updates','announcements','due_date_alerts','weekly_summary','reminder_time'];
    const body = req.body || {};
    if (Object.keys(body).some(key => !allowed.includes(key)) || !Object.keys(body).length) {
      return res.status(400).json({ message: 'Provide only your notification preference fields.' });
    }
    for (const key of allowed) if (body[key] !== undefined && (key === 'reminder_time'
      ? !['10min','30min','1hour','1day'].includes(body[key]) : typeof body[key] !== 'boolean')) {
      return res.status(400).json({ message: 'Provide boolean notification options and a valid reminder_time.' });
    }
    db = await pool.connect(); await db.query('BEGIN');
    await require('../services/notificationDeliveryService').lockNotificationPreferences(db, req.userId);
    await db.query('INSERT INTO notification_settings(user_id) VALUES($1) ON CONFLICT DO NOTHING', [req.userId]);
    const fields = allowed.filter(key => body[key] !== undefined);
    const result = await db.query('UPDATE notification_settings SET ' + fields.map((key,index)=>key+'=$'+(index+2)).join(',') + ', updated_at=now() WHERE user_id=$1 RETURNING *', [req.userId, ...fields.map(key=>body[key])]);
    await db.query('COMMIT');
    return res.json({ settings: result.rows[0] });
  } catch (error) { if(db) await db.query('ROLLBACK'); return next(error); }
  finally { db?.release(); }
}

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

    if (!FULLY_SUPPORTED_CODES.includes(resolvedLanguage)) resolvedLanguage = 'en';
    const langCheck = await pool.query('SELECT is_enabled FROM supported_languages WHERE code = $1', [resolvedLanguage]);
    if (!langCheck.rows[0]?.is_enabled) resolvedLanguage = 'en';

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
    const validLanguages = FULLY_SUPPORTED_CODES;

    if (theme !== undefined && !validThemes.includes(theme)) return res.status(400).json({ message: 'Theme is invalid.' });
    if (language !== undefined) {
      if (!validLanguages.includes(language)) return res.status(400).json({ message: 'Language is invalid.' });

      // Admin enabled language check: client cannot select a language that has been disabled
      const langCheck = await pool.query('SELECT is_enabled FROM supported_languages WHERE code = $1', [language]);
      if (!langCheck.rows[0]?.is_enabled) {
        return res.status(400).json({ message: 'This language is currently not enabled by the administrator.' });
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

const languageCatalog = require('../../../shared/languages.json');
const FULLY_SUPPORTED_CODES = languageCatalog.filter(item => item.translation_supported).map(item => item.code);

/**
 * GET /api/settings/languages
 * Returns all supported languages and their enabled states.
 */
async function getSupportedLanguages(_req, res, next) {
  try {
    // Startup schema initialization seeds these existing records. This public route is read-only.
    const result = await pool.query(
      'SELECT code, name, native_name, flag, is_enabled, sort_order FROM supported_languages ORDER BY sort_order ASC, code ASC'
    );
    return res.json({ languages: result.rows.map(row => ({ ...row, translation_supported: FULLY_SUPPORTED_CODES.includes(row.code) })) });
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

    if (typeof code !== 'string' || !/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/.test(code)) {
      return res.status(400).json({ message: `Language '${code}' is not supported. Supported codes: ${FULLY_SUPPORTED_CODES.join(', ')}` });
    }
    if (typeof is_enabled !== 'boolean') {
      return res.status(400).json({ message: 'is_enabled must be a boolean.' });
    }
    if (is_enabled && !FULLY_SUPPORTED_CODES.includes(code)) {
      return res.status(400).json({ message: 'Translation resources are not available for this locale.' });
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

    return res.json({ language: { ...result.rows[0], translation_supported: FULLY_SUPPORTED_CODES.includes(code) } });
  } catch (error) {
    return next(error);
  }
}

async function addSupportedLanguage(req, res, next) {
  try {
    const { code, name, native_name } = req.body || {};
    if (typeof code !== 'string' || !/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/.test(code) || code.length > 35 ||
        [name, native_name].some(value => typeof value !== 'string' || !value.trim() || value.trim().length > 80)) {
      return res.status(400).json({ message: 'Provide a valid locale code, name and native name.' });
    }
    const result = await pool.query(
      `INSERT INTO supported_languages (code, name, native_name, is_enabled, sort_order)
       VALUES ($1, $2, $3, FALSE, 100) ON CONFLICT (code) DO NOTHING
       RETURNING code, name, native_name, flag, is_enabled, sort_order`, [code, name.trim(), native_name.trim()]);
    if (!result.rows.length) return res.status(409).json({ message: 'This locale already exists.' });
    return res.status(201).json({ language: { ...result.rows[0], translation_supported: FULLY_SUPPORTED_CODES.includes(code) } });
  } catch (error) { next(error); }
}

module.exports = {
  getNotificationSettings,
  updateNotificationSettings,
  getPreferences,
  updatePreferences,
  getSupportedLanguages,
  updateSupportedLanguage,
  addSupportedLanguage,
};
