import type { HealthDTO } from "@common/dto/health.dto";
import { Routes } from "@common/routes/routes";
import type { APIResponse } from "../fetchAPI";
import { IAPI, type APIOptions } from "../interface";

/**
 * Sous-API du domaine « health ». Une classe par domaine.
 */
export class APIHealth extends IAPI {
  /**
   * GET /api/health
   *
   * Renvoie l'état de l'API et de la base de données.
   * Pas de DTO à l'aller (GET sans body) — un DTO seulement au retour.
   */
  async getHealth<T extends HealthDTO>(options?: APIOptions): Promise<APIResponse<T>> {
    return this.fetch<T>("GET", Routes.Health, options);
  }
}
