import type { Sql } from "../client";
import type { ProfilePreviewRow } from "./profile.repository";

export class BlockRepository {
  constructor(private readonly sql: Sql) {}

  async add(blockerId: string, blockedId: string): Promise<boolean> {
    const rows = await this.sql`
      INSERT INTO blocks (blocker_id, blocked_id)
      VALUES (${blockerId}, ${blockedId})
      ON CONFLICT DO NOTHING
      RETURNING blocker_id
    `;
    return rows.length > 0;
  }

  async remove(blockerId: string, blockedId: string): Promise<boolean> {
    const rows = await this.sql`
      DELETE FROM blocks
      WHERE blocker_id = ${blockerId} AND blocked_id = ${blockedId}
      RETURNING blocker_id
    `;
    return rows.length > 0;
  }

  async isBlockedEither(a: string, b: string): Promise<boolean> {
    const rows = await this.sql`
      SELECT 1 FROM blocks
      WHERE (blocker_id = ${a} AND blocked_id = ${b})
         OR (blocker_id = ${b} AND blocked_id = ${a})
    `;
    return rows.length > 0;
  }

  async listBlocked(userId: string, limit: number, offset: number): Promise<ProfilePreviewRow[]> {
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
        (SELECT count(*)::int FROM visits vi WHERE vi.visited_id = u.id) AS visits_count,
        (SELECT count(*)::int FROM reports rp WHERE rp.reported_id = u.id) AS reports_count
      FROM blocks b
      JOIN users u    ON u.id = b.blocked_id
      JOIN profiles p ON p.user_id = u.id
      WHERE b.blocker_id = ${userId}
      ORDER BY b.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  async countBlocked(userId: string): Promise<number> {
    const [row] = await this.sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM blocks WHERE blocker_id = ${userId}
    `;
    return row?.count ?? 0;
  }
}
