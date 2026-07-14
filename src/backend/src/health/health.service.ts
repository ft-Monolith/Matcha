import type { HealthDTO } from "@common/dto/health.dto";
import type { Sql } from "../database/client";

/**
  dans les fichier service, pas d import de express, pas de req/res, pas de router, pas de middleware
  juste des fonctions qui font le boulot, et qui retournent des données (ou des erreurs)
*/
export class HealthService {
  constructor(private readonly sql: Sql) {}

  async check(): Promise<HealthDTO> {
    const dbUp = await this.pingDatabase();

    return {
      status: dbUp ? "ok" : "degraded",
      db: dbUp ? "up" : "down",
      uptime: Math.floor(process.uptime()),
    };
  }

  private async pingDatabase(): Promise<boolean> {
    try {
      await this.sql`SELECT 1`;
      return true;
    } catch (err) {
      console.error("[health] postgres unreachable :", err);
      return false;
    }
  }
}
