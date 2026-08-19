import type { Request, Response, Router } from "express";
import type { InteractionService } from "./interaction.service";
import { authGuard } from "../app/middlewares/authGuard";
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

export class MeController {
  constructor(private readonly interactions: InteractionService) {}

  register(router: Router) {
    router.use(authGuard);

    router.get("/likers", this.likersHandler);
    router.get("/visits", this.visitsHandler);
    router.get("/blocks", this.blocksHandler);
  }

  private likersHandler = async (req: Request, res: Response) => {
    const { userId } = getSession(req);
    const limit = clampInt(req.query.limit, DEFAULT_LIMIT, 1, MAX_LIMIT);
    const offset = clampInt(req.query.offset, 0, 0, Number.MAX_SAFE_INTEGER);
    res
      .status(200)
      .json(await this.interactions.whoLikedMe(userId, limit, offset));
  };

  private visitsHandler = async (req: Request, res: Response) => {
    const { userId } = getSession(req);
    const limit = clampInt(req.query.limit, DEFAULT_LIMIT, 1, MAX_LIMIT);
    const offset = clampInt(req.query.offset, 0, 0, Number.MAX_SAFE_INTEGER);
    res
      .status(200)
      .json(await this.interactions.whoViewedMe(userId, limit, offset));
  };

  private blocksHandler = async (req: Request, res: Response) => {
    const { userId } = getSession(req);
    const limit = clampInt(req.query.limit, DEFAULT_LIMIT, 1, MAX_LIMIT);
    const offset = clampInt(req.query.offset, 0, 0, Number.MAX_SAFE_INTEGER);
    res
      .status(200)
      .json(await this.interactions.whoIBlocked(userId, limit, offset));
  };
}
