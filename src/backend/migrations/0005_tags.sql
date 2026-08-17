-- Migration 0005 — tags
CREATE TABLE tags (
  id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name   citext NOT NULL UNIQUE
);

CREATE TABLE user_tags (
  user_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag_id   uuid NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,

  PRIMARY KEY (user_id, tag_id)
);

CREATE INDEX idx_user_tags_tag_id ON user_tags (tag_id);
