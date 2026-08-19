import type { Request, Response, Router } from "express";
import type { NotificationService } from "./notification.service";
import { authGuard } from "../app/middlewares/authGuard";
import { uuidParam } from "../app/middlewares/uuidParam";
import { getSession } from "../app/session";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function clampInt(
  value: unknown,
  def: number,
  min: number,
  max: number,
): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return def;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  register(router: Router) {
    router.use(authGuard);
    router.param("id", uuidParam());

    router.get("/", this.listHandler);
    router.post("/read", this.readHandler);
    router.delete("/:id", this.removeHandler);
  }

  private listHandler = async (req: Request, res: Response) => {
    const { userId } = getSession(req);
    const limit = clampInt(req.query.limit, DEFAULT_LIMIT, 1, MAX_LIMIT);
    const offset = clampInt(req.query.offset, 0, 0, Number.MAX_SAFE_INTEGER);
    res.status(200).json(await this.service.list(userId, limit, offset));
  };

  private readHandler = async (req: Request, res: Response) => {
    const { userId } = getSession(req);
    await this.service.markAllRead(userId);
    res.status(204).end();
  };

  private removeHandler = async (req: Request, res: Response) => {
    const { userId } = getSession(req);
    await this.service.remove(userId, String(req.params.id));
    res.status(204).end();
  };
}
