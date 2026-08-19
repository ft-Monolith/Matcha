import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../http-error";
import { isProd } from "../config/env";

export function notFoundMiddleware(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }

  console.error("[error]", err);
  res.status(500).json({
    error: "Internal server error",
    ...(isProd
      ? {}
      : { details: err instanceof Error ? err.message : String(err) }),
  });
}
