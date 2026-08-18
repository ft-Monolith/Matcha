CREATE TABLE IF NOT EXISTS visits (
  visitor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  visited_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (visitor_id, visited_id),
  CHECK (visitor_id <> visited_id)
);

CREATE INDEX IF NOT EXISTS idx_visits_visited ON visits(visited_id);
