CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL,
  rating NUMERIC(2, 1) NOT NULL,
  content VARCHAR(5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reviews_user_game_unique UNIQUE (user_id, game_id),
  CONSTRAINT reviews_rating_range CHECK (
    rating >= 0.5
    AND rating <= 5.0
    AND MOD(rating, 0.5) = 0
  )
);

CREATE INDEX IF NOT EXISTS reviews_game_created_at_idx
  ON reviews (game_id, created_at DESC);

CREATE INDEX IF NOT EXISTS reviews_game_rating_idx
  ON reviews (game_id, rating);
