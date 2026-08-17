-- Migration 0008 — localisation 

ALTER TABLE profiles ADD COLUMN latitude          double precision;
ALTER TABLE profiles ADD COLUMN longitude         double precision;
ALTER TABLE profiles ADD COLUMN city              text;
ALTER TABLE profiles ADD COLUMN location_consent  boolean NOT NULL DEFAULT false;