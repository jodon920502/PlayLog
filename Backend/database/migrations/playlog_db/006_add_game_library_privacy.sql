ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS game_library_public BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN profiles.game_library_public IS 'Whether this player allows others to view their game status library';
