CREATE TABLE IF NOT EXISTS meta_accounts (
  user_id TEXT PRIMARY KEY,
  fb_user_id TEXT,
  ig_business_id TEXT,
  ig_username TEXT,
  catalog_id TEXT,
  catalog_name TEXT,
  access_token TEXT NOT NULL,
  expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
