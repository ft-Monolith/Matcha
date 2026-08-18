import { Router } from "express";
import type { Sql } from "../database/client";
import type { TransformersService } from "../app/services/transformers.service";
import type { PresenceService } from "../app/realtime/presence.service";
import type { RealtimeService } from "../app/realtime/realtime.service";
import { UserRepository } from "../database/repositories/user.repository";
import { LikeRepository } from "../database/repositories/like.repository";
import { BlockRepository } from "../database/repositories/block.repository";
import { MessageRepository } from "../database/repositories/message.repository";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";

export interface ChatDeps {
  sql: Sql;
  transformers: TransformersService;
  presence: PresenceService;
  realtime: RealtimeService;
}

export function ControllerChatModule(deps: ChatDeps): Router {
  const service = new ChatService(
    new UserRepository(deps.sql),
    new LikeRepository(deps.sql),
    new BlockRepository(deps.sql),
    new MessageRepository(deps.sql),
    deps.transformers,
    deps.presence,
    deps.realtime,
  );
  const controller = new ChatController(service);

  const router = Router();
  controller.register(router);
  return router;
}
