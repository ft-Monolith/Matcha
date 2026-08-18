import type { Sql } from "../client";
import type { ProfileEntity } from "../entities/profile.entity";
import type { Gender, SexualPref } from "@common/dto/profile.dto";
import type { SortField, SortOrder } from "@common/dto/search.dto";

export interface SearchInput {
  viewerId: string;
  gender: Gender | null;
  pref: SexualPref;
  lat: number | null;
  lng: number | null;
  ageMin: number | null;
  ageMax: number | null;
  fameMin: number | null;
  fameMax: number | null;
  maxDistance: number | null;
  tags: string[] | null;
  sort: SortField;
  order: SortOrder;
  limit: number;
  offset: number;
}

const SORT_COLUMNS: Record<Exclude<SortField, "suggestion">, string> = {
  age: "age_years",
  fame: "fame",
  distance: "distance_km",
  tags: "common_tags",
};

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
  distance_km?: number | null; // renseigné seulement par la recherche
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

  async search(input: SearchInput): Promise<{ rows: ProfilePreviewRow[]; total: number }> {
    const dir = input.order === "asc" ? this.sql`ASC` : this.sql`DESC`;

    const orderBy =
      input.sort === "suggestion"
        ? this.sql`
            (CASE
               WHEN distance_km IS NULL THEN 5
               WHEN distance_km < 5   THEN 0
               WHEN distance_km < 20  THEN 1
               WHEN distance_km < 50  THEN 2
               WHEN distance_km < 100 THEN 3
               ELSE 4
             END) ASC,
            common_tags DESC, fame DESC, user_id`
        : this.sql`${this.sql(SORT_COLUMNS[input.sort])} ${dir} NULLS LAST, user_id`;

    const rows = await this.sql<(ProfilePreviewRow & { total_count: number })[]>`
      WITH base AS (
        SELECT
          u.id         AS user_id,
          u.first_name AS first_name,
          p.birthdate  AS birthdate,
          (
            SELECT pic.filename FROM pictures pic
            WHERE pic.user_id = u.id AND pic.is_profile = true LIMIT 1
          ) AS photo,
          (SELECT count(*)::int FROM likes  li WHERE li.liked_id   = u.id) AS likes_count,
          (SELECT count(*)::int FROM visits vi WHERE vi.visited_id = u.id) AS visits_count,
          date_part('year', age(p.birthdate))::int AS age_years,
          (4 * (SELECT count(*) FROM likes  li WHERE li.liked_id   = u.id)
             + (SELECT count(*) FROM visits vi WHERE vi.visited_id = u.id))::int AS fame,
          CASE
            WHEN ${input.lat}::float8 IS NULL OR ${input.lng}::float8 IS NULL
                 OR p.latitude IS NULL OR p.longitude IS NULL THEN NULL
            ELSE 6371 * acos(least(1, greatest(-1,
              cos(radians(${input.lat})) * cos(radians(p.latitude))
                * cos(radians(p.longitude) - radians(${input.lng}))
              + sin(radians(${input.lat})) * sin(radians(p.latitude))
            )))
          END AS distance_km,
          (
            SELECT count(*)::int FROM user_tags utv
            JOIN user_tags utc ON utc.tag_id = utv.tag_id
            WHERE utv.user_id = ${input.viewerId} AND utc.user_id = u.id
          ) AS common_tags
        FROM users u
        JOIN profiles p ON p.user_id = u.id
        WHERE u.id <> ${input.viewerId} AND u.onboarded = true
          AND NOT EXISTS (
            SELECT 1 FROM blocks bl
            WHERE (bl.blocker_id = ${input.viewerId} AND bl.blocked_id = u.id)
               OR (bl.blocker_id = u.id AND bl.blocked_id = ${input.viewerId})
          )
          -- Orientation mutuelle (ignorée si le viewer n'a pas de genre)
          AND (
            ${input.gender}::text IS NULL OR (
              ( ${input.pref} = 'bi'
                OR (${input.pref} = 'homo'   AND p.gender = ${input.gender})
                OR (${input.pref} = 'hetero' AND p.gender <> ${input.gender}) )
              AND
              ( p.sexual_pref = 'bi'
                OR (p.sexual_pref = 'homo'   AND p.gender = ${input.gender})
                OR (p.sexual_pref = 'hetero' AND p.gender <> ${input.gender}) )
            )
          )
          -- Filtre tags : au moins un tag en commun avec la recherche
          AND (
            ${input.tags}::text[] IS NULL OR EXISTS (
              SELECT 1 FROM user_tags ut JOIN tags t ON t.id = ut.tag_id
              WHERE ut.user_id = u.id AND t.name::text = ANY(${input.tags})
            )
          )
      )
      SELECT
        user_id, first_name, birthdate, photo, likes_count, visits_count, distance_km,
        count(*) OVER()::int AS total_count
      FROM base
      WHERE (${input.ageMin}::int   IS NULL OR age_years >= ${input.ageMin})
        AND (${input.ageMax}::int   IS NULL OR age_years <= ${input.ageMax})
        AND (${input.fameMin}::int  IS NULL OR fame >= ${input.fameMin})
        AND (${input.fameMax}::int  IS NULL OR fame <= ${input.fameMax})
        AND (${input.maxDistance}::float8 IS NULL
             OR (distance_km IS NOT NULL AND distance_km <= ${input.maxDistance}))
      ORDER BY ${orderBy}
      LIMIT ${input.limit} OFFSET ${input.offset}
    `;

    return { rows, total: rows[0]?.total_count ?? 0 };
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
