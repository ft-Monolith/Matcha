import type { Sql } from "../database/client";
import type { TransformersService } from "../app/services/transformers.service";
import type { PresenceService } from "../app/realtime/presence.service";
import type { NotificationService } from "../notification/notification.service";
import { UserRepository } from "../database/repositories/user.repository";
import { LikeRepository } from "../database/repositories/like.repository";
import { VisitRepository } from "../database/repositories/visit.repository";
import { BlockRepository } from "../database/repositories/block.repository";
import { ReportRepository } from "../database/repositories/report.repository";
import { PictureRepository } from "../database/repositories/picture.repository";
import { InteractionService } from "./interaction.service";

export interface InteractionDeps {
  sql: Sql;
  transformers: TransformersService;
  presence: PresenceService;
  notifications: NotificationService;
}

export function buildInteractionService(deps: InteractionDeps): InteractionService {
  const users = new UserRepository(deps.sql);
  const likes = new LikeRepository(deps.sql);
  const visits = new VisitRepository(deps.sql);
  const blocks = new BlockRepository(deps.sql);
  const reports = new ReportRepository(deps.sql);
  const pictures = new PictureRepository(deps.sql);
  return new InteractionService(
    users,
    likes,
    visits,
    blocks,
    reports,
    pictures,
    deps.transformers,
    deps.presence,
    deps.notifications,
  );
}
