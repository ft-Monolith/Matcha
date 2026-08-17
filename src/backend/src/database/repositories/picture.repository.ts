import type { Sql } from "../client";
import type { PictureEntity } from "../entities/picture.entity";

export interface CreatePictureInput {
  user_id: string;
  filename: string;
  is_profile: boolean;
  position: number;
}

export class PictureRepository {
  constructor(private readonly sql: Sql) {}

  async findByUserId(userId: string): Promise<PictureEntity[]> {
    return this.sql<PictureEntity[]>`
      SELECT * FROM pictures
      WHERE user_id = ${userId}
      ORDER BY position, created_at
    `;
  }

  async countByUserId(userId: string): Promise<number> {
    const [row] = await this.sql<{ count: number }[]>`
      SELECT COUNT(*)::int AS count FROM pictures WHERE user_id = ${userId}
    `;
    return row.count;
  }

  async findById(id: string): Promise<PictureEntity | null> {
    const [picture] = await this.sql<PictureEntity[]>`
      SELECT * FROM pictures WHERE id = ${id}
    `;
    return picture ?? null;
  }

  async create(input: CreatePictureInput): Promise<PictureEntity> {
    const [picture] = await this.sql<PictureEntity[]>`
      INSERT INTO pictures (user_id, filename, is_profile, position)
      VALUES (${input.user_id}, ${input.filename}, ${input.is_profile}, ${input.position})
      RETURNING *
    `;
    return picture;
  }

  async delete(id: string): Promise<void> {
    await this.sql`DELETE FROM pictures WHERE id = ${id}`;
  }

  async setProfile(userId: string, pictureId: string): Promise<void> {
    await this.sql.begin(async (tx) => {
      await tx`UPDATE pictures SET is_profile = false WHERE user_id = ${userId}`;
      await tx`UPDATE pictures SET is_profile = true WHERE id = ${pictureId}`;
    });
  }
}
