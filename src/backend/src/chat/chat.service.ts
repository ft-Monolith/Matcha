import type { ConversationDTO, MessageDTO } from "@common/dto/chat.dto";
import type { Paginated } from "@common/dto/pagination.dto";
import { HttpError } from "../app/http-error";
import type { TransformersService } from "../app/services/transformers.service";
import type { PresenceService } from "../app/realtime/presence.service";
import type { RealtimeService } from "../app/realtime/realtime.service";
import type { UserRepository } from "../database/repositories/user.repository";
import type { LikeRepository } from "../database/repositories/like.repository";
import type { BlockRepository } from "../database/repositories/block.repository";
import type { MessageRepository } from "../database/repositories/message.repository";

export class ChatService {
  constructor(
    private readonly users: UserRepository,
    private readonly likes: LikeRepository,
    private readonly blocks: BlockRepository,
    private readonly messages: MessageRepository,
    private readonly transformers: TransformersService,
    private readonly presence: PresenceService,
    private readonly realtime: RealtimeService,
  ) {}

  private async assertConnected(userId: string, otherId: string): Promise<void> {
    if (userId === otherId) throw new HttpError(400, "Invalid conversation");
    const other = await this.users.findById(otherId);
    if (!other || !other.onboarded) throw new HttpError(404, "Profile not found");
    if (await this.blocks.isBlockedEither(userId, otherId)) {
      throw new HttpError(403, "You are not connected with this user");
    }
    const connected =
      (await this.likes.exists(userId, otherId)) && (await this.likes.exists(otherId, userId));
    if (!connected) throw new HttpError(403, "You are not connected with this user");
  }

  async conversations(userId: string): Promise<ConversationDTO[]> {
    const rows = await this.messages.conversations(userId);
    return rows.map((r) =>
      this.transformers.conversationToDTO(r, this.presence.isOnline(r.user_id)),
    );
  }

  async history(
    userId: string,
    otherId: string,
    limit: number,
    offset: number,
  ): Promise<Paginated<MessageDTO>> {
    await this.assertConnected(userId, otherId);
    const rows = await this.messages.history(userId, otherId, limit, offset);
    await this.messages.markRead(userId, otherId);
    const items = rows
      .slice()
      .reverse()
      .map((m) => this.transformers.messageToDTO(m));
    return { items, totalCount: items.length, hasNextPage: rows.length === limit };
  }

  async send(userId: string, otherId: string, content: string): Promise<MessageDTO> {
    await this.assertConnected(userId, otherId);
    const trimmed = content.trim();
    if (trimmed === "") throw new HttpError(400, "Message cannot be empty");

    const sender = await this.users.findById(userId);
    const fromName = sender?.first_name ?? "";

    const row = await this.messages.create(userId, otherId, trimmed);
    const message = this.transformers.messageToDTO(row);

    this.realtime.emitToUser(otherId, "message", { message, with: userId, fromName });
    this.realtime.emitToUser(userId, "message", { message, with: otherId, fromName });

    return message;
  }

  async markRead(userId: string, otherId: string): Promise<void> {
    await this.messages.markRead(userId, otherId);
  }
}
