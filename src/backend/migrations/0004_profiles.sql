-- Migration 0004 — profil utilisateur

CREATE TABLE profiles (
  user_id      uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  gender       text CHECK (gender IN ('man', 'woman', 'other')),
  sexual_pref  text NOT NULL DEFAULT 'bi' CHECK (sexual_pref IN ('hetero', 'homo', 'bi')),

  biography    text,
  birthdate    date,

  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
