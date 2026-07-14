import { Router } from "express";
import type { Sql } from "../database/client";
import type { TransformersService } from "../app/services/transformers.service";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

/**
    ici on cable exepress avec le service et le controller et on s abonne

    Le module reçoit les dépendances PARTAGÉES (sql, transformers) créées une seule
    fois dans main.ts, et les distribue. C'est l'injection de dépendances, à la main.
 */
export interface HealthDeps {
  sql: Sql;
  transformers: TransformersService;
}

export function ControllerHealthModule(deps: HealthDeps): Router {
  const service = new HealthService(deps.sql, deps.transformers);
  const controller = new HealthController(service);

  const router = Router();
  controller.register(router);
  return router;
}
