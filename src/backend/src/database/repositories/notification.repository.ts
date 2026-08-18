import type { Sql } from "../client";
import type { NotificationType } from "@common/dto/notification.dto";

export interface NotificationRow {
  id: string;
  type: NotificationType;
  actor_id: string;
  actor_first_name: string;
  actor_photo: string | null;
  read_at: Date | null;
  created_at: Date;
}

export class NotificationRepository {
  constructor(private readonly sql: Sql) {}

  async create(userId: string, type: NotificationType, actorId: string): Promise<NotificationRow> {
    const [row] = await this.sql<NotificationRow[]>`
      WITH inserted AS (
        INSERT INTO notifications (user_id, type, actor_id)
        VALUES (${userId}, ${type}, ${actorId})
        RETURNING id, type, actor_id, read_at, created_at
      )
      SELECT
        i.id, i.type, i.actor_id, i.read_at, i.created_at,
        a.first_name AS actor_first_name,
        (SELECT filename FROM pictures WHERE user_id = i.actor_id AND is_profile = true LIMIT 1)
          AS actor_photo
      FROM inserted i
      JOIN users a ON a.id = i.actor_id
    `;
    return row;
  }

  async list(userId: string, limit: number, offset: number): Promise<NotificationRow[]> {
    return this.sql<NotificationRow[]>`
      SELECT
        n.id, n.type, n.actor_id, n.read_at, n.created_at,
        a.first_name AS actor_first_name,
        (SELECT filename FROM pictures WHERE user_id = n.actor_id AND is_profile = true LIMIT 1)
          AS actor_photo
      FROM notifications n
      JOIN users a ON a.id = n.actor_id
      WHERE n.user_id = ${userId}
      ORDER BY n.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  async unreadCount(userId: string): Promise<number> {
    const [row] = await this.sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM notifications WHERE user_id = ${userId} AND read_at IS NULL
    `;
    return row?.count ?? 0;
  }

  async markAllRead(userId: string): Promise<void> {
    await this.sql`
      UPDATE notifications SET read_at = now()
      WHERE user_id = ${userId} AND read_at IS NULL
    `;
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.sql`
      DELETE FROM notifications WHERE id = ${id} AND user_id = ${userId}
    `;
  }
}
