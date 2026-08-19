import { Router } from "express";
import type { Sql } from "../database/client";
import type { TransformersService } from "../app/services/transformers.service";
import { UserRepository } from "../database/repositories/user.repository";
import { EmailVerificationTokenRepository } from "../database/repositories/emailVerificationToken.repository";
import { PasswordResetTokenRepository } from "../database/repositories/passwordResetToken.repository";
import { MailerService } from "../app/services/mailer.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

export interface AuthDeps {
  sql: Sql;
  transformers: TransformersService;
}

export function ControllerAuthModule(deps: AuthDeps): Router {
  const users = new UserRepository(deps.sql);
  const tokens = new EmailVerificationTokenRepository(deps.sql);
  const resetTokens = new PasswordResetTokenRepository(deps.sql);
  const mailer = new MailerService();

  const service = new AuthService(
    users,
    tokens,
    resetTokens,
    mailer,
    deps.transformers,
  );
  const controller = new AuthController(service);

  const router = Router();
  controller.register(router);
  return router;
}
