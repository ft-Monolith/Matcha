import type { Request, Response, Router } from "express";
import type { SearchParams, SortField, SortOrder } from "@common/dto/search.dto";
import type { ProfileService } from "./profile.service";
import type { InteractionService } from "../interaction/interaction.service";
import { authGuard } from "../app/middlewares/authGuard";
import { getSession } from "../app/session";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const SORT_FIELDS: SortField[] = ["age", "fame", "distance", "tags"];

function clampInt(value: unknown, def: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return def;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

function optNum(value: unknown): number | undefined {
  if (value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseSearchParams(query: Request["query"]): SearchParams {
  const sort = SORT_FIELDS.includes(query.sort as SortField)
    ? (query.sort as SortField)
    : undefined;
  const order: SortOrder | undefined =
    query.order === "asc" || query.order === "desc" ? query.order : undefined;
  const tags =
    typeof query.tags === "string" && query.tags.trim() !== ""
      ? query.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
      : undefined;

  return {
    ageMin: optNum(query.ageMin),
    ageMax: optNum(query.ageMax),
    fameMin: optNum(query.fameMin),
    fameMax: optNum(query.fameMax),
    maxDistance: optNum(query.maxDistance),
    tags,
    sort,
    order,
    limit: clampInt(query.limit, DEFAULT_LIMIT, 1, MAX_LIMIT),
    offset: clampInt(query.offset, 0, 0, Number.MAX_SAFE_INTEGER),
  };
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
    res.status(200).json(await this.service.search(userId, parseSearchParams(req.query)));
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
