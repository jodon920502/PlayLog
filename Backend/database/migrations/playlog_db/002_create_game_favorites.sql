CREATE TABLE IF NOT EXISTS game_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT game_favorites_user_game_unique UNIQUE (user_id, game_id)
);

CREATE INDEX IF NOT EXISTS game_favorites_user_created_at_idx
  ON game_favorites (user_id, created_at DESC);
