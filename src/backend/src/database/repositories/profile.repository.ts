import type { Sql } from "../client";
import type { ProfileEntity } from "../entities/profile.entity";
import type { Gender, SexualPref } from "@common/dto/profile.dto";

export interface UpsertProfileInput {
  gender: Gender | null;
  sexual_pref: SexualPref;
  biography: string | null;
  birthdate: string | null;
}

export interface UpdateLocationInput {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  location_consent: boolean;
}

export interface ProfilePreviewRow {
  user_id: string;
  first_name: string;
  birthdate: Date | null;
  photo: string | null;
  likes_count: number; 
  visits_count: number;
}

export class ProfileRepository {
  constructor(private readonly sql: Sql) {}

  async findByUserId(userId: string): Promise<ProfileEntity | null> {
    const [profile] = await this.sql<ProfileEntity[]>`
      SELECT * FROM profiles WHERE user_id = ${userId}
    `;
    return profile ?? null;
  }

  async upsert(userId: string, input: UpsertProfileInput): Promise<ProfileEntity> {
    const [profile] = await this.sql<ProfileEntity[]>`
      INSERT INTO profiles (user_id, gender, sexual_pref, biography, birthdate)
      VALUES (
        ${userId},
        ${input.gender},
        ${input.sexual_pref},
        ${input.biography},
        ${input.birthdate}
      )
      ON CONFLICT (user_id) DO UPDATE SET
        gender      = EXCLUDED.gender,
        sexual_pref = EXCLUDED.sexual_pref,
        biography   = EXCLUDED.biography,
        birthdate   = EXCLUDED.birthdate,
        updated_at  = now()
      RETURNING *
    `;
    return profile;
  }

  async listOthers(viewerId: string, limit: number, offset: number): Promise<ProfilePreviewRow[]> {
    return this.sql<ProfilePreviewRow[]>`
      SELECT
        u.id         AS user_id,
        u.first_name AS first_name,
        p.birthdate  AS birthdate,
        (
          SELECT pic.filename
          FROM pictures pic
          WHERE pic.user_id = u.id AND pic.is_profile = true
          LIMIT 1
        )            AS photo,
        (SELECT count(*)::int FROM likes  li WHERE li.liked_id   = u.id) AS likes_count,
        (SELECT count(*)::int FROM visits vi WHERE vi.visited_id = u.id) AS visits_count
      FROM users u
      JOIN profiles p ON p.user_id = u.id
      WHERE u.id <> ${viewerId} AND u.onboarded = true
        AND NOT EXISTS (
          SELECT 1 FROM blocks bl
          WHERE (bl.blocker_id = ${viewerId} AND bl.blocked_id = u.id)
             OR (bl.blocker_id = u.id AND bl.blocked_id = ${viewerId})
        )
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  async countOthers(viewerId: string): Promise<number> {
    const [row] = await this.sql<{ count: number }[]>`
      SELECT count(*)::int AS count
      FROM users u
      JOIN profiles p ON p.user_id = u.id
      WHERE u.id <> ${viewerId} AND u.onboarded = true
        AND NOT EXISTS (
          SELECT 1 FROM blocks bl
          WHERE (bl.blocker_id = ${viewerId} AND bl.blocked_id = u.id)
             OR (bl.blocker_id = u.id AND bl.blocked_id = ${viewerId})
        )
    `;
    return row?.count ?? 0;
  }

  async updateLocation(userId: string, input: UpdateLocationInput): Promise<ProfileEntity> {
    const [profile] = await this.sql<ProfileEntity[]>`
      INSERT INTO profiles (user_id, latitude, longitude, city, location_consent)
      VALUES (
        ${userId},
        ${input.latitude},
        ${input.longitude},
        ${input.city},
        ${input.location_consent}
      )
      ON CONFLICT (user_id) DO UPDATE SET
        latitude         = EXCLUDED.latitude,
        longitude        = EXCLUDED.longitude,
        city             = EXCLUDED.city,
        location_consent = EXCLUDED.location_consent,
        updated_at       = now()
      RETURNING *
    `;
    return profile;
  }
}
