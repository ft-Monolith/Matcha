import { createServer } from "node:http";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Routes } from "@common/routes/routes";

import { env, isProd } from "./app/config/env";
import { createSqlClient } from "./database/client";
import { runMigrations } from "./database/migrator";
import { seedTags } from "./database/seed";
import { errorMiddleware, notFoundMiddleware } from "./app/middlewares/error";
import { authGuard } from "./app/middlewares/authGuard";
import { getSession } from "./app/session";
import { TransformersService } from "./app/services/transformers.service";
import { setupRealtime } from "./app/realtime/setup";
import { UserRepository } from "./database/repositories/user.repository";
import { ControllerHealthModule } from "./health/health.module";
import { ControllerAuthModule } from "./auth/auth.module";
import { ControllerProfileModule } from "./profile/profile.module";


async function main() {
  const sql = createSqlClient();
  const transformers = new TransformersService();

  // Applique les migrations SQL AVANT de servir la moindre requête
  await runMigrations(sql);
  await seedTags(sql);

  const app = express();

  app.use(helmet()); // en-têtes de sécurité
  app.use(cors({ origin: env.appUrl, credentials: true })); // credentials → cookies de session
  app.use(cookieParser()); // parse les cookies httpOnly (auth, plus tard)
  app.use(express.json({ limit: "10mb" })); // parse les corps JSON (10mb : photos en base64)

  // Serveur HTTP explicite : partagé entre Express et socket.io (même port)
  const server = createServer(app);
  const { realtime } = setupRealtime(server, new UserRepository(sql));

  app.use(Routes.Health, ControllerHealthModule({ sql, transformers }));
  app.use(Routes.Auth.Base, ControllerAuthModule({ sql, transformers }));
  app.use(Routes.Profile.Base, ControllerProfileModule({ sql, transformers }));

  if (!isProd) {
    app.post("/api/debug/emit", authGuard, (req, res) => {
      realtime.emitToUser(getSession(req).userId, "test", {
        at: Date.now(),
        message: "hello from server",
      });
      res.json({ ok: true });
    });
  }

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  server.listen(env.port, () => {
    console.log(`[api] listen on ${env.port}`);
  });
}

main().catch((err) => {
  console.error("[api] wont start:", err);
  process.exit(1);
});
