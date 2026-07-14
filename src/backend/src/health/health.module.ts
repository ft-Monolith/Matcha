import { Router } from "express";
import type { Sql } from "../database/client";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

/**
    ici on cable exepress avec le service et le controller et on s abonne 
 */
export function ControllerHealthModule(deps: { sql: Sql }): Router {
  const service = new HealthService(deps.sql);
  const controller = new HealthController(service);

  const router = Router();
  controller.register(router);
  return router;
}
