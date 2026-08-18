CREATE TABLE IF NOT EXISTS blocks (
  blocker_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_id);

CREATE TABLE IF NOT EXISTS reports (
  reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason      text NOT NULL DEFAULT 'fake_account',
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (reporter_id, reported_id),
  CHECK (reporter_id <> reported_id)
);
