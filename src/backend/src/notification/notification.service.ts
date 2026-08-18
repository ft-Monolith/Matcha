import type { NotificationListDTO, NotificationType } from "@common/dto/notification.dto";
import type { RealtimeService } from "../app/realtime/realtime.service";
import type { TransformersService } from "../app/services/transformers.service";
import type { NotificationRepository } from "../database/repositories/notification.repository";

export class NotificationService {
  constructor(
    private readonly repo: NotificationRepository,
    private readonly realtime: RealtimeService,
    private readonly transformers: TransformersService,
  ) {}

  async create(userId: string, type: NotificationType, actorId: string): Promise<void> {
    const row = await this.repo.create(userId, type, actorId);
    this.realtime.emitToUser(userId, "notification", this.transformers.notificationToDTO(row));
  }

  async list(userId: string, limit: number, offset: number): Promise<NotificationListDTO> {
    const [rows, unread] = await Promise.all([
      this.repo.list(userId, limit, offset),
      this.repo.unreadCount(userId),
    ]);
    return {
      items: rows.map((r) => this.transformers.notificationToDTO(r)),
      unread,
      hasNextPage: rows.length === limit,
    };
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repo.markAllRead(userId);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.repo.remove(userId, id);
  }
}
