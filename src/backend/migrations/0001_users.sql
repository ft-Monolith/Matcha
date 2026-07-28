-- Migration 0001 — user tqble

-- CITEXT = type unique text who is case-insensitive (PostgreSQL extension)
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  email           citext NOT NULL UNIQUE,
  username        citext NOT NULL UNIQUE,
  last_name       text   NOT NULL,
  first_name      text   NOT NULL,

  password_hash   text   NOT NULL,

  email_verified  boolean NOT NULL DEFAULT false,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
