import type { Sql } from "../client";

export interface MessageRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: Date;
  read_at: Date | null;
}

export interface ConversationRow {
  user_id: string;
  first_name: string;
  birthdate: Date | null;
  photo: string | null;
  likes_count: number;
  visits_count: number;
  reports_count: number;
  last_id: string | null;
  last_sender_id: string | null;
  last_content: string | null;
  last_created_at: Date | null;
  last_read_at: Date | null;
  unread: number;
}

export class MessageRepository {
  constructor(private readonly sql: Sql) {}

  async create(senderId: string, recipientId: string, content: string): Promise<MessageRow> {
    const [row] = await this.sql<MessageRow[]>`
      INSERT INTO messages (sender_id, recipient_id, content)
      VALUES (${senderId}, ${recipientId}, ${content})
      RETURNING *
    `;
    return row;
  }

  async history(a: string, b: string, limit: number, offset: number): Promise<MessageRow[]> {
    return this.sql<MessageRow[]>`
      SELECT * FROM messages
      WHERE (sender_id = ${a} AND recipient_id = ${b})
         OR (sender_id = ${b} AND recipient_id = ${a})
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  async markRead(recipientId: string, from: string): Promise<number> {
    const rows = await this.sql`
      UPDATE messages SET read_at = now()
      WHERE recipient_id = ${recipientId} AND sender_id = ${from} AND read_at IS NULL
      RETURNING id
    `;
    return rows.length;
  }

  async conversations(userId: string): Promise<ConversationRow[]> {
    return this.sql<ConversationRow[]>`
      WITH matches AS (
        SELECT l1.liked_id AS other_id
        FROM likes l1
        JOIN likes l2 ON l2.liker_id = l1.liked_id AND l2.liked_id = l1.liker_id
        WHERE l1.liker_id = ${userId}
          AND NOT EXISTS (
            SELECT 1 FROM blocks bl
            WHERE (bl.blocker_id = ${userId} AND bl.blocked_id = l1.liked_id)
               OR (bl.blocker_id = l1.liked_id AND bl.blocked_id = ${userId})
          )
      )
      SELECT
        u.id         AS user_id,
        u.first_name AS first_name,
        p.birthdate  AS birthdate,
        (SELECT pic.filename FROM pictures pic
           WHERE pic.user_id = u.id AND pic.is_profile = true LIMIT 1) AS photo,
        (SELECT count(*)::int FROM likes  li WHERE li.liked_id   = u.id) AS likes_count,
        (SELECT count(*)::int FROM visits vi WHERE vi.visited_id = u.id) AS visits_count,
        (SELECT count(*)::int FROM reports rp WHERE rp.reported_id = u.id) AS reports_count,
        lm.id         AS last_id,
        lm.sender_id  AS last_sender_id,
        lm.content    AS last_content,
        lm.created_at AS last_created_at,
        lm.read_at    AS last_read_at,
        (SELECT count(*)::int FROM messages m
           WHERE m.sender_id = u.id AND m.recipient_id = ${userId} AND m.read_at IS NULL) AS unread
      FROM matches
      JOIN users u    ON u.id = matches.other_id
      JOIN profiles p ON p.user_id = u.id
      LEFT JOIN LATERAL (
        SELECT * FROM messages m
        WHERE (m.sender_id = ${userId} AND m.recipient_id = u.id)
           OR (m.sender_id = u.id AND m.recipient_id = ${userId})
        ORDER BY m.created_at DESC LIMIT 1
      ) lm ON true
      ORDER BY COALESCE(lm.created_at, 'epoch'::timestamptz) DESC, u.first_name
    `;
  }
}
