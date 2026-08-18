import type { Request, Response, Router } from "express";
import { SendMessageDTO } from "@common/dto/chat.dto";
import type { ChatService } from "./chat.service";
import { authGuard } from "../app/middlewares/authGuard";
import { validate } from "../app/middlewares/validate";
import { getSession } from "../app/session";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 50;

function clampInt(value: unknown, def: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return def;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

export class ChatController {
  constructor(private readonly service: ChatService) {}

  register(router: Router) {
    router.use(authGuard);

    router.get("/", this.conversationsHandler);
    router.get("/:id", this.historyHandler);
    router.post("/:id", validate(SendMessageDTO), this.sendHandler);
    router.post("/:id/read", this.readHandler);
  }

  private conversationsHandler = async (req: Request, res: Response) => {
    const { userId } = getSession(req);
    res.status(200).json(await this.service.conversations(userId));
  };

  private historyHandler = async (req: Request, res: Response) => {
    const { userId } = getSession(req);
    const limit = clampInt(req.query.limit, DEFAULT_LIMIT, 1, MAX_LIMIT);
    const offset = clampInt(req.query.offset, 0, 0, Number.MAX_SAFE_INTEGER);
    res.status(200).json(await this.service.history(userId, String(req.params.id), limit, offset));
  };

  private sendHandler = async (req: Request, res: Response) => {
    const { userId } = getSession(req);
    const { content } = req.body as SendMessageDTO;
    res.status(201).json(await this.service.send(userId, String(req.params.id), content));
  };

  private readHandler = async (req: Request, res: Response) => {
    const { userId } = getSession(req);
    await this.service.markRead(userId, String(req.params.id));
    res.status(204).end();
  };
}
