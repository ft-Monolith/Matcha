import { Router } from "express";
import type { Sql } from "../database/client";
import type { TransformersService } from "../app/services/transformers.service";
import { UserRepository } from "../database/repositories/user.repository";
import { ProfileRepository } from "../database/repositories/profile.repository";
import { TagRepository } from "../database/repositories/tag.repository";
import { PictureRepository } from "../database/repositories/picture.repository";
import { ProfileController } from "./profile.controller";
import { ProfileService } from "./profile.service";

export interface ProfileDeps {
  sql: Sql;
  transformers: TransformersService;
}

export function ControllerProfileModule(deps: ProfileDeps): Router {
  const users = new UserRepository(deps.sql);
  const profiles = new ProfileRepository(deps.sql);
  const tags = new TagRepository(deps.sql);
  const pictures = new PictureRepository(deps.sql);

  const service = new ProfileService(users, profiles, tags, pictures, deps.transformers);
  const controller = new ProfileController(service);

  const router = Router();
  controller.register(router);
  return router;
}
