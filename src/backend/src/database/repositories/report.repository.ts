import type { Sql } from "../client";

export class ReportRepository {
  constructor(private readonly sql: Sql) {}

  async add(
    reporterId: string,
    reportedId: string,
    reason: string,
  ): Promise<boolean> {
    const rows = await this.sql`
      INSERT INTO reports (reporter_id, reported_id, reason)
      VALUES (${reporterId}, ${reportedId}, ${reason})
      ON CONFLICT DO NOTHING
      RETURNING reporter_id
    `;
    return rows.length > 0;
  }

  async countReceived(userId: string): Promise<number> {
    const [row] = await this.sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM reports WHERE reported_id = ${userId}
    `;
    return row?.count ?? 0;
  }
}
