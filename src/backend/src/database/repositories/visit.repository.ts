import type { Sql } from "../client";
import type { ProfilePreviewRow } from "./profile.repository";

export class VisitRepository {
  constructor(private readonly sql: Sql) {}

  async record(visitorId: string, visitedId: string): Promise<boolean> {
    const [row] = await this.sql<{ inserted: boolean }[]>`
      INSERT INTO visits (visitor_id, visited_id)
      VALUES (${visitorId}, ${visitedId})
      ON CONFLICT (visitor_id, visited_id) DO UPDATE SET created_at = now()
      RETURNING (xmax = 0) AS inserted
    `;
    return row?.inserted ?? false;
  }

  async listVisitors(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<ProfilePreviewRow[]> {
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
      FROM visits v
      JOIN users u    ON u.id = v.visitor_id
      JOIN profiles p ON p.user_id = u.id
      WHERE v.visited_id = ${userId}
        AND NOT EXISTS (
          SELECT 1 FROM blocks bl
          WHERE (bl.blocker_id = ${userId} AND bl.blocked_id = u.id)
             OR (bl.blocker_id = u.id AND bl.blocked_id = ${userId})
        )
      ORDER BY v.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  async countReceived(userId: string): Promise<number> {
    const [row] = await this.sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM visits WHERE visited_id = ${userId}
    `;
    return row?.count ?? 0;
  }

  async countVisitors(userId: string): Promise<number> {
    const [row] = await this.sql<{ count: number }[]>`
      SELECT count(*)::int AS count
      FROM visits v
      WHERE v.visited_id = ${userId}
        AND NOT EXISTS (
          SELECT 1 FROM blocks bl
          WHERE (bl.blocker_id = ${userId} AND bl.blocked_id = v.visitor_id)
             OR (bl.blocker_id = v.visitor_id AND bl.blocked_id = ${userId})
        )
    `;
    return row?.count ?? 0;
  }
}
