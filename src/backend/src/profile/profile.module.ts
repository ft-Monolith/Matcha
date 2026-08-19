import { Router } from "express";
import type { Sql } from "../database/client";
import type { TransformersService } from "../app/services/transformers.service";
import type { PresenceService } from "../app/realtime/presence.service";
import { UserRepository } from "../database/repositories/user.repository";
import { ProfileRepository } from "../database/repositories/profile.repository";
import { TagRepository } from "../database/repositories/tag.repository";
import { PictureRepository } from "../database/repositories/picture.repository";
import { LikeRepository } from "../database/repositories/like.repository";
import { VisitRepository } from "../database/repositories/visit.repository";
import { ReportRepository } from "../database/repositories/report.repository";
import { ProfileController } from "./profile.controller";
import { ProfileService } from "./profile.service";

export interface ProfileDeps {
  sql: Sql;
  transformers: TransformersService;
  presence: PresenceService;
}

export function buildProfileService(deps: ProfileDeps): ProfileService {
  const users = new UserRepository(deps.sql);
  const profiles = new ProfileRepository(deps.sql);
  const tags = new TagRepository(deps.sql);
  const pictures = new PictureRepository(deps.sql);
  const likes = new LikeRepository(deps.sql);
  const visits = new VisitRepository(deps.sql);
  const reports = new ReportRepository(deps.sql);
  return new ProfileService(
    users,
    profiles,
    tags,
    pictures,
    likes,
    visits,
    reports,
    deps.transformers,
    deps.presence,
  );
}

export function ControllerProfileModule(deps: ProfileDeps): Router {
  const controller = new ProfileController(buildProfileService(deps));

  const router = Router();
  controller.register(router);
  return router;
}
