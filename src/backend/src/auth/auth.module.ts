import { Router } from "express";
import type { Sql } from "../database/client";
import type { TransformersService } from "../app/services/transformers.service";
import { UserRepository } from "../database/repositories/user.repository";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";


export interface AuthDeps {
  sql: Sql;
  transformers: TransformersService;
}

export function ControllerAuthModule(deps: AuthDeps): Router {
  const users = new UserRepository(deps.sql);
  const service = new AuthService(users, deps.transformers);
  const controller = new AuthController(service);

  const router = Router();
  controller.register(router);
  return router;
}
