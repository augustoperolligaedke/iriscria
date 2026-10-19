-- Esquema da Íris em Postgres (Supabase). Gerado a partir de migrations/*.sql (D1) para manter os dois iguais.
-- Datas ficam em TEXT ISO 8601, como no D1, para o código funcionar igual nos dois bancos.
-- RLS ligado sem políticas: a API pública do Supabase (anon/authenticated) não lê nada.
-- O app acessa pelo Hyperdrive com o usuário do banco, que não passa pelo RLS.

-- migrations/0001_init.sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  plan_until TEXT,
  stripe_customer TEXT,
  gift_used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS otp_codes (
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS otp_email ON otp_codes(email);
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT,
  site_url TEXT,
  instagram TEXT,
  colors TEXT NOT NULL DEFAULT '{}',
  font TEXT,
  tone TEXT,
  icp TEXT,
  logo_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS brands_user ON brands(user_id);
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price TEXT,
  description TEXT,
  image_url TEXT,
  image_key TEXT,
  source TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS products_brand ON products(brand_id);
CREATE TABLE IF NOT EXISTS contents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  product_id TEXT,
  format TEXT NOT NULL,
  status TEXT NOT NULL,
  spec TEXT NOT NULL DEFAULT '{}',
  provider TEXT,
  provider_request_id TEXT,
  output_url TEXT,
  output_key TEXT,
  error TEXT,
  gift INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS contents_user ON contents(user_id, created_at);
CREATE TABLE IF NOT EXISTS usage (
  user_id TEXT NOT NULL,
  period TEXT NOT NULL,
  posts INTEGER NOT NULL DEFAULT 0,
  reels INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, period)
);
CREATE TABLE IF NOT EXISTS wa_links (
  phone TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS wa_codes (
  code TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

-- migrations/0002_instagram.sql
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
ALTER TABLE contents ADD COLUMN IF NOT EXISTS ig_media_id TEXT;
ALTER TABLE contents ADD COLUMN IF NOT EXISTS ig_permalink TEXT;
ALTER TABLE contents ADD COLUMN IF NOT EXISTS ig_creation_id TEXT;
ALTER TABLE contents ADD COLUMN IF NOT EXISTS published_at TEXT;

-- migrations/0003_payments.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_source TEXT;
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

-- migrations/0004_ig_insights.sql
CREATE TABLE IF NOT EXISTS ig_insights_cache (
  user_id TEXT PRIMARY KEY,
  week TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- migrations/0005_brand_strategy.sql
ALTER TABLE brands ADD COLUMN IF NOT EXISTS strategy TEXT;

-- migrations/0006_meta_catalog.sql
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

-- segurança
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ig_insights_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_links ENABLE ROW LEVEL SECURITY;
