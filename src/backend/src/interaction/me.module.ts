import { Router } from "express";
import {
  buildInteractionService,
  type InteractionDeps,
} from "./interaction.module";
import { MeController } from "./me.controller";

export function ControllerMeModule(deps: InteractionDeps): Router {
  const controller = new MeController(buildInteractionService(deps));

  const router = Router();
  controller.register(router);
  return router;
}
