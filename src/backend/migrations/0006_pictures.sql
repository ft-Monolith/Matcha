-- Migration 0006 — photos de profil
CREATE TABLE pictures (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  filename    text NOT NULL,
  is_profile  boolean NOT NULL DEFAULT false,
  position    smallint NOT NULL DEFAULT 0,

  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pictures_user_id ON pictures (user_id);

CREATE UNIQUE INDEX idx_pictures_one_profile
  ON pictures (user_id)
  WHERE is_profile;
