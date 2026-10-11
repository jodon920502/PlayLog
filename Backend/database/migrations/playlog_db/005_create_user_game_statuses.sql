CREATE TABLE IF NOT EXISTS user_game_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('wishlist', 'playing', 'completed', 'paused', 'dropped')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_game_statuses_user_game_unique UNIQUE (user_id, game_id)
);

CREATE INDEX IF NOT EXISTS user_game_statuses_user_updated_at_idx
  ON user_game_statuses (user_id, updated_at DESC);
