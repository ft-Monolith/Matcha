import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Routes } from "@common/routes/routes";

import { env } from "./app/config/env";
import { createSqlClient } from "./database/client";
import { errorMiddleware, notFoundMiddleware } from "./app/middlewares/error";
import { ControllerHealthModule } from "./health/health.module";


async function main() {
  const sql = createSqlClient();

  const app = express();

  app.use(helmet()); // en-têtes de sécurité (XSS, clickjacking…)
  app.use(cors({ origin: env.appUrl, credentials: true })); // credentials → cookies de session
  app.use(cookieParser()); // parse les cookies httpOnly (auth, plus tard)
  app.use(express.json()); // parse les corps JSON

  // Chaque domaine renvoie un Router, monté sur son chemin partagé (src/common/routes).
  app.use(Routes.Health, ControllerHealthModule({ sql }));

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
