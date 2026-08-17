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
