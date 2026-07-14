import type { HealthDTO } from "@common/dto/health.dto";
import type { Sql } from "../database/client";
import type { TransformersService } from "../app/services/transformers.service";

/**
  dans les fichier service, pas d import de express, pas de req/res, pas de router, pas de middleware
  juste des fonctions qui font le boulot, et qui retournent des données (ou des erreurs)

  Le service NE CONSTRUIT PAS le DTO lui-même : il produit la matière première
  (le snapshot), et c'est le TransformersService qui lui donne sa forme de sortie.
*/
export class HealthService {
  constructor(
    private readonly sql: Sql,
    private readonly transformers: TransformersService,
  ) {}

  async check(): Promise<HealthDTO> {
    const dbUp = await this.pingDatabase();

    return this.transformers.healthToDTO({
      dbUp,
      uptimeSeconds: process.uptime(),
    });
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
