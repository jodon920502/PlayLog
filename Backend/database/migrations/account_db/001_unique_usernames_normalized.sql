CREATE UNIQUE INDEX IF NOT EXISTS users_username_normalized_key
ON users (lower(btrim(username)));
