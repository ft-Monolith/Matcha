import type { Sql } from "../client";
import type { TagEntity } from "../entities/tag.entity";

export class TagRepository {
  constructor(private readonly sql: Sql) {}

  async findByUserId(userId: string): Promise<TagEntity[]> {
    return this.sql<TagEntity[]>`
      SELECT t.id, t.name
      FROM tags t
      JOIN user_tags ut ON ut.tag_id = t.id
      WHERE ut.user_id = ${userId}
      ORDER BY t.name
    `;
  }

  async setUserTags(userId: string, names: string[]): Promise<void> {
    await this.sql.begin(async (tx) => {
      await tx`DELETE FROM user_tags WHERE user_id = ${userId}`;

      if (names.length === 0) return;

      const tags = await tx<{ id: string }[]>`
        SELECT id FROM tags WHERE name = ANY(${names}::citext[])
      `;

      const rows = tags.map((t) => ({ user_id: userId, tag_id: t.id }));
      await tx`INSERT INTO user_tags ${tx(rows, "user_id", "tag_id")}`;
    });
  }
}
