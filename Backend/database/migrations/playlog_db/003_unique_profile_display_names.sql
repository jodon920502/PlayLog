CREATE UNIQUE INDEX IF NOT EXISTS profiles_display_name_normalized_key
ON profiles (lower(btrim(display_name)));
