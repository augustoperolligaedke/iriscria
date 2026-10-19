CREATE TABLE IF NOT EXISTS instagram_accounts (
  user_id TEXT PRIMARY KEY,
  ig_user_id TEXT NOT NULL,
  username TEXT,
  account_type TEXT,
  picture_url TEXT,
  access_token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
ALTER TABLE contents ADD COLUMN ig_media_id TEXT;
ALTER TABLE contents ADD COLUMN ig_permalink TEXT;
ALTER TABLE contents ADD COLUMN ig_creation_id TEXT;
ALTER TABLE contents ADD COLUMN published_at TEXT;
