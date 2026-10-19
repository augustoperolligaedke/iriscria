CREATE TABLE IF NOT EXISTS ig_insights_cache (
  user_id TEXT PRIMARY KEY,
  week TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
