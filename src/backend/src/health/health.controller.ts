import type { Request, Response, Router } from "express";
import type { HealthService } from "./health.service";

/**
 ici c est la ou on recoit les call api en gros c est le miroir des call 
 frontend c est l entrypoint ensuite on passe le relai au service
 */
export class HealthController {
  constructor(private readonly service: HealthService) {}

  register(router: Router) {
    router.get("/", this.get);
  }

  private get = async (_req: Request, res: Response) => {
    const health = await this.service.check();
    res.status(health.db === "up" ? 200 : 503).json(health);
  };
}
