import { createServer } from "node:http";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Routes } from "@common/routes/routes";

import { env } from "./app/config/env";
import { createSqlClient } from "./database/client";
import { runMigrations } from "./database/migrator";
import { seedTags } from "./database/seed";
import { errorMiddleware, notFoundMiddleware } from "./app/middlewares/error";
import { TransformersService } from "./app/services/transformers.service";
import { setupRealtime } from "./app/realtime/setup";
import { UserRepository } from "./database/repositories/user.repository";
import { ControllerHealthModule } from "./health/health.module";
import { ControllerAuthModule } from "./auth/auth.module";
import { ControllerProfileModule } from "./profile/profile.module";
import { ControllerProfilesModule } from "./profile/profiles.module";
import { ControllerMeModule } from "./interaction/me.module";
import { ControllerChatModule } from "./chat/chat.module";
import { ControllerNotificationsModule } from "./notification/notification.module";
import { NotificationService } from "./notification/notification.service";
import { NotificationRepository } from "./database/repositories/notification.repository";


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
  const { realtime, presence } = setupRealtime(server, new UserRepository(sql));

  const notifications = new NotificationService(
    new NotificationRepository(sql),
    realtime,
    transformers,
  );

  app.use(Routes.Health, ControllerHealthModule({ sql, transformers }));
  app.use(Routes.Auth.Base, ControllerAuthModule({ sql, transformers }));
  app.use(Routes.Profile.Base, ControllerProfileModule({ sql, transformers, presence }));
  app.use(Routes.Profiles.Base, ControllerProfilesModule({ sql, transformers, presence, notifications }));
  app.use(Routes.Me.Base, ControllerMeModule({ sql, transformers, presence, notifications }));
  app.use(Routes.Chat.Base, ControllerChatModule({ sql, transformers, presence, realtime }));
  app.use(Routes.Notifications.Base, ControllerNotificationsModule(notifications));

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
