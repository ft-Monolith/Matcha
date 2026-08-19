import { Router } from "express";
import type { Sql } from "../database/client";
import type { TransformersService } from "../app/services/transformers.service";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

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
