import type { RequestParamHandler } from "express";
import { HttpError } from "../http-error";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function uuidParam(): RequestParamHandler {
  return (_req, _res, next, value) => {
    if (typeof value !== "string" || !UUID_RE.test(value)) {
      next(new HttpError(404, "Not found"));
      return;
    }
    next();
  };
}
