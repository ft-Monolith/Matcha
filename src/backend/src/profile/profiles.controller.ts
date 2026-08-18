import type { Request, Response, Router } from "express";
import type { ProfileService } from "./profile.service";
import type { InteractionService } from "../interaction/interaction.service";
import { authGuard } from "../app/middlewares/authGuard";
import { getSession } from "../app/session";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function clampInt(value: unknown, def: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return def;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

export class ProfilesController {
  constructor(
    private readonly service: ProfileService,
    private readonly interactions: InteractionService,
  ) {}

  register(router: Router) {
    router.use(authGuard);

    router.get("/", this.listHandler);
    router.get("/:id", this.getByIdHandler);
    router.post("/:id/like", this.likeHandler);
    router.delete("/:id/like", this.unlikeHandler);
    router.post("/:id/block", this.blockHandler);
    router.delete("/:id/block", this.unblockHandler);
    router.post("/:id/report", this.reportHandler);
  }

  private listHandler = async (req: Request, res: Response) => {
    const { userId } = getSession(req);
    const limit = clampInt(req.query.limit, DEFAULT_LIMIT, 1, MAX_LIMIT);
    const offset = clampInt(req.query.offset, 0, 0, Number.MAX_SAFE_INTEGER);
    res.status(200).json(await this.service.listOthers(userId, limit, offset));
  };

  private getByIdHandler = async (req: Request, res: Response) => {
    const { userId } = getSession(req);
    const targetId = String(req.params.id);
    if (await this.interactions.isBlocked(userId, targetId)) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    const profile = await this.service.getPublicProfile(userId, targetId);
    await this.interactions.recordVisit(userId, targetId);
    res.status(200).json(profile);
  };

  private likeHandler = async (req: Request, res: Response) => {
    const { userId } = getSession(req);
    res.status(200).json(await this.interactions.like(userId, String(req.params.id)));
  };

  private unlikeHandler = async (req: Request, res: Response) => {
    const { userId } = getSession(req);
    res.status(200).json(await this.interactions.unlike(userId, String(req.params.id)));
  };

  private blockHandler = async (req: Request, res: Response) => {
    const { userId } = getSession(req);
    await this.interactions.block(userId, String(req.params.id));
    res.status(204).end();
  };

  private unblockHandler = async (req: Request, res: Response) => {
    const { userId } = getSession(req);
    await this.interactions.unblock(userId, String(req.params.id));
    res.status(204).end();
  };

  private reportHandler = async (req: Request, res: Response) => {
    const { userId } = getSession(req);
    await this.interactions.report(userId, String(req.params.id));
    res.status(204).end();
  };
}
