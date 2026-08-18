import type { InteractionStateDTO } from "@common/dto/interaction.dto";
import type { ProfilePreviewDTO } from "@common/dto/profile.dto";
import type { Paginated } from "@common/dto/pagination.dto";
import { HttpError } from "../app/http-error";
import type { TransformersService } from "../app/services/transformers.service";
import type { PresenceService } from "../app/realtime/presence.service";
import type { NotificationService } from "../notification/notification.service";
import type { UserRepository } from "../database/repositories/user.repository";
import type { LikeRepository } from "../database/repositories/like.repository";
import type { VisitRepository } from "../database/repositories/visit.repository";
import type { BlockRepository } from "../database/repositories/block.repository";
import type { ReportRepository } from "../database/repositories/report.repository";
import type { PictureRepository } from "../database/repositories/picture.repository";

export class InteractionService {
  constructor(
    private readonly users: UserRepository,
    private readonly likes: LikeRepository,
    private readonly visits: VisitRepository,
    private readonly blocks: BlockRepository,
    private readonly reports: ReportRepository,
    private readonly pictures: PictureRepository,
    private readonly transformers: TransformersService,
    private readonly presence: PresenceService,
    private readonly notifications: NotificationService,
  ) {}

  isBlocked(a: string, b: string): Promise<boolean> {
    return this.blocks.isBlockedEither(a, b);
  }

  async like(likerId: string, targetId: string): Promise<InteractionStateDTO> {
    if (likerId === targetId) throw new HttpError(400, "You cannot like yourself");

    const target = await this.users.findById(targetId);
    if (!target || !target.onboarded) throw new HttpError(404, "Profile not found");
    if (await this.blocks.isBlockedEither(likerId, targetId)) {
      throw new HttpError(403, "Interaction not allowed");
    }
    if ((await this.pictures.countByUserId(likerId)) === 0) {
      throw new HttpError(403, "You need a profile picture to like others");
    }

    const inserted = await this.likes.add(likerId, targetId);
    const likesMe = await this.likes.exists(targetId, likerId);

    if (inserted) {
      await this.notifications.create(targetId, "like", likerId);
      if (likesMe) {
        await this.notifications.create(targetId, "match", likerId);
        await this.notifications.create(likerId, "match", targetId);
      }
    }

    return { likedByMe: true, likesMe };
  }

  async unlike(likerId: string, targetId: string): Promise<InteractionStateDTO> {
    const wasMatched =
      (await this.likes.exists(likerId, targetId)) &&
      (await this.likes.exists(targetId, likerId));

    const removed = await this.likes.remove(likerId, targetId);
    const likesMe = await this.likes.exists(targetId, likerId);

    if (removed && wasMatched) {
      await this.notifications.create(targetId, "unlike", likerId);
    }

    return { likedByMe: false, likesMe };
  }

  async whoLikedMe(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<Paginated<ProfilePreviewDTO>> {
    const [rows, totalCount] = await Promise.all([
      this.likes.listLikers(userId, limit, offset),
      this.likes.countLikers(userId),
    ]);

    const items = rows.map((r) =>
      this.transformers.profilePreviewToDTO(r, this.presence.isOnline(r.user_id)),
    );

    return { items, totalCount, hasNextPage: offset + rows.length < totalCount };
  }

  async recordVisit(visitorId: string, visitedId: string): Promise<void> {
    if (visitorId === visitedId) return;
    if (await this.blocks.isBlockedEither(visitorId, visitedId)) return;
    const firstVisit = await this.visits.record(visitorId, visitedId);
    if (firstVisit) {
      await this.notifications.create(visitedId, "visit", visitorId);
    }
  }

  async whoViewedMe(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<Paginated<ProfilePreviewDTO>> {
    const [rows, totalCount] = await Promise.all([
      this.visits.listVisitors(userId, limit, offset),
      this.visits.countVisitors(userId),
    ]);

    const items = rows.map((r) =>
      this.transformers.profilePreviewToDTO(r, this.presence.isOnline(r.user_id)),
    );

    return { items, totalCount, hasNextPage: offset + rows.length < totalCount };
  }

  async block(blockerId: string, targetId: string): Promise<void> {
    if (blockerId === targetId) throw new HttpError(400, "You cannot block yourself");
    const target = await this.users.findById(targetId);
    if (!target) throw new HttpError(404, "Profile not found");

    await this.blocks.add(blockerId, targetId);
    await this.likes.remove(blockerId, targetId);
    await this.likes.remove(targetId, blockerId);
  }

  async unblock(blockerId: string, targetId: string): Promise<void> {
    await this.blocks.remove(blockerId, targetId);
  }

  async report(reporterId: string, targetId: string): Promise<void> {
    if (reporterId === targetId) throw new HttpError(400, "You cannot report yourself");
    const target = await this.users.findById(targetId);
    if (!target) throw new HttpError(404, "Profile not found");
    await this.reports.add(reporterId, targetId, "fake_account");
  }

  async whoIBlocked(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<Paginated<ProfilePreviewDTO>> {
    const [rows, totalCount] = await Promise.all([
      this.blocks.listBlocked(userId, limit, offset),
      this.blocks.countBlocked(userId),
    ]);

    const items = rows.map((r) =>
      this.transformers.profilePreviewToDTO(r, this.presence.isOnline(r.user_id)),
    );

    return { items, totalCount, hasNextPage: offset + rows.length < totalCount };
  }
}
