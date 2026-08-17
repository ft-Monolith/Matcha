-- Migration 0007 — flag d'onboarding 

ALTER TABLE users ADD COLUMN onboarded boolean NOT NULL DEFAULT false;
