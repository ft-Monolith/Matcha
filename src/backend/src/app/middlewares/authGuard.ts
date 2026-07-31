import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../jwt";
import { ACCESS_COOKIE } from "../cookies";
import { HttpError } from "../http-error";

export function authGuard(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[ACCESS_COOKIE] as string | undefined;
  if (!token) {
    next(new HttpError(401, "Not authenticated"));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.session = { userId: payload.sub, username: payload.username };
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired session"));
  }
}
