ALTER TABLE users ADD COLUMN plan_source TEXT;
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_id TEXT,
  plan TEXT NOT NULL,
  months INTEGER NOT NULL DEFAULT 1,
  amount INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  paid_at TEXT
);
CREATE INDEX IF NOT EXISTS payments_user ON payments(user_id, created_at);
CREATE INDEX IF NOT EXISTS payments_provider ON payments(provider_id);
