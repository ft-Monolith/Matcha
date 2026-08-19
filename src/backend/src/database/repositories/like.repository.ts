import type { Sql } from "../client";
import type { ProfilePreviewRow } from "./profile.repository";

export class LikeRepository {
  constructor(private readonly sql: Sql) {}

  async add(likerId: string, likedId: string): Promise<boolean> {
    const rows = await this.sql`
      INSERT INTO likes (liker_id, liked_id)
      VALUES (${likerId}, ${likedId})
      ON CONFLICT DO NOTHING
      RETURNING liker_id
    `;
    return rows.length > 0;
  }

  async remove(likerId: string, likedId: string): Promise<boolean> {
    const rows = await this.sql`
      DELETE FROM likes
      WHERE liker_id = ${likerId} AND liked_id = ${likedId}
      RETURNING liker_id
    `;
    return rows.length > 0;
  }

  async countReceived(userId: string): Promise<number> {
    const [row] = await this.sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM likes WHERE liked_id = ${userId}
    `;
    return row?.count ?? 0;
  }

  async exists(likerId: string, likedId: string): Promise<boolean> {
    const rows = await this.sql`
      SELECT 1 FROM likes WHERE liker_id = ${likerId} AND liked_id = ${likedId}
    `;
    return rows.length > 0;
  }

  async listLikers(userId: string, limit: number, offset: number): Promise<ProfilePreviewRow[]> {
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
      FROM likes l
      JOIN users u    ON u.id = l.liker_id
      JOIN profiles p ON p.user_id = u.id
      WHERE l.liked_id = ${userId}
        AND NOT EXISTS (
          SELECT 1 FROM blocks bl
          WHERE (bl.blocker_id = ${userId} AND bl.blocked_id = u.id)
             OR (bl.blocker_id = u.id AND bl.blocked_id = ${userId})
        )
      ORDER BY l.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  async countLikers(userId: string): Promise<number> {
    const [row] = await this.sql<{ count: number }[]>`
      SELECT count(*)::int AS count
      FROM likes l
      WHERE l.liked_id = ${userId}
        AND NOT EXISTS (
          SELECT 1 FROM blocks bl
          WHERE (bl.blocker_id = ${userId} AND bl.blocked_id = l.liker_id)
             OR (bl.blocker_id = l.liker_id AND bl.blocked_id = ${userId})
        )
    `;
    return row?.count ?? 0;
  }
}
