CREATE TABLE IF NOT EXISTS users (
  uid TEXT PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  photo_url TEXT,
  created_at INTEGER,
  last_login_at INTEGER,
  usage_count INTEGER DEFAULT 0,
  monthly_usage INTEGER DEFAULT 0
)
