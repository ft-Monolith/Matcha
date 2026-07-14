import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../http-error";
import { isProd } from "../config/env";

/**
 * 404 — toute route non montée. À placer JUSTE AVANT le middleware d'erreurs.
 */
export function notFoundMiddleware(_req: Request, res: Response) {
  res.status(404).json({ error: "Route introuvable" });
}

/**
 * Middleware d'ERREURS — le filet de sécurité final. DOIT être le DERNIER `app.use()`.
 *
 * Express le reconnaît à sa signature à 4 arguments (err en premier) : c'est pour ça
 * que `_next` doit rester présent même s'il n'est pas utilisé.
 *
 * ⚡ Express 5 : les rejets de promesse dans un handler `async` arrivent ICI
 * automatiquement. Pas besoin d'un `asyncHandler` maison comme en Express 4.
 */
export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Erreur métier attendue → on renvoie son statut et son message.
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }

  // Erreur inattendue (bug) → on log côté serveur, et on ne fuite RIEN en prod.
  console.error("[error]", err);
  res.status(500).json({
    error: "Erreur interne",
    ...(isProd ? {} : { details: err instanceof Error ? err.message : String(err) }),
  });
}
