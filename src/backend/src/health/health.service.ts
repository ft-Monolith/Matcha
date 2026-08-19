import type { HealthDTO } from "@common/dto/health.dto";
import type { Sql } from "../database/client";
import type { TransformersService } from "../app/services/transformers.service";

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
