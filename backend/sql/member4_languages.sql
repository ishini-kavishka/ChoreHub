-- Language management: admin controls which languages are available to client users.
-- Safe to run multiple times (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS supported_languages (
    code        TEXT PRIMARY KEY,          -- e.g. 'en', 'si', 'ta'
    name        TEXT NOT NULL,             -- e.g. 'English'
    native_name TEXT NOT NULL,             -- e.g. 'English', 'සිංහල', 'தமிழ்'
    flag        TEXT NOT NULL DEFAULT '🌐',
    is_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed the three fully-supported languages (idempotent)
INSERT INTO supported_languages (code, name, native_name, flag, is_enabled, sort_order)
VALUES
  ('en', 'English', 'English', '🌐', TRUE, 1),
  ('si', 'Sinhala', 'සිංහල',  '🇱🇰', TRUE, 2),
  ('ta', 'Tamil',   'தமிழ்', '🇮🇳', TRUE, 3)
ON CONFLICT (code) DO NOTHING;

CREATE INDEX IF NOT EXISTS supported_languages_enabled_idx ON supported_languages (is_enabled);
