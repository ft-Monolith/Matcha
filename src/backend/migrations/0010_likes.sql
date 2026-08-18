CREATE TABLE IF NOT EXISTS likes (
  liker_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  liked_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (liker_id, liked_id),
  CHECK (liker_id <> liked_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_liked ON likes(liked_id);
