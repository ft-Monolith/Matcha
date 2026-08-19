import type { Request } from "express";
import { HttpError } from "./http-error";

export interface AppSession {
  userId: string;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      session?: AppSession;
    }
  }
}

export function getSession(req: Request): AppSession {
  if (!req.session) {
    throw new HttpError(401, "Not authenticated");
  }
  return req.session;
}
