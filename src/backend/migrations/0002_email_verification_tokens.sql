-- Migration 0002 — jetons de vérification d'e-mail
CREATE TABLE email_verification_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  token_hash  text NOT NULL UNIQUE,

  expires_at  timestamptz NOT NULL,

  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_evt_user_id ON email_verification_tokens (user_id);
