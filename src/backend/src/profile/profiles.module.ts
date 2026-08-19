import { Router } from "express";
import { buildProfileService } from "./profile.module";
import {
  buildInteractionService,
  type InteractionDeps,
} from "../interaction/interaction.module";
import { ProfilesController } from "./profiles.controller";

export function ControllerProfilesModule(deps: InteractionDeps): Router {
  const controller = new ProfilesController(
    buildProfileService(deps),
    buildInteractionService(deps),
  );

  const router = Router();
  controller.register(router);
  return router;
}
