import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Routes } from "@common/routes/routes";

import { env } from "./app/config/env";
import { createSqlClient } from "./database/client";
import { errorMiddleware, notFoundMiddleware } from "./app/middlewares/error";
import { TransformersService } from "./app/services/transformers.service";
import { ControllerHealthModule } from "./health/health.module";


async function main() {
  // Dépendances PARTAGÉES : créées ici une seule fois, puis injectées aux modules.
  const sql = createSqlClient();
  const transformers = new TransformersService();

  const app = express();

  app.use(helmet()); // en-têtes de sécurité (XSS, clickjacking…)
  app.use(cors({ origin: env.appUrl, credentials: true })); // credentials → cookies de session
  app.use(cookieParser()); // parse les cookies httpOnly (auth, plus tard)
  app.use(express.json()); // parse les corps JSON

  // Chaque domaine renvoie un Router, monté sur son chemin partagé (src/common/routes).
  app.use(Routes.Health, ControllerHealthModule({ sql, transformers }));

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  app.listen(env.port, () => {
    console.log(`[api] listen on ${env.port}`);
  });
}

main().catch((err) => {
  console.error("[api] wont start:", err);
  process.exit(1);
});
