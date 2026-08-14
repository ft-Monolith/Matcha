import type { HealthDTO } from "@common/dto/health.dto";
import { Routes } from "@common/routes/routes";
import type { APIResponse } from "../fetchAPI";
import { IAPI, type APIOptions } from "../interface";

export class APIHealth extends IAPI {

  async getHealth<T extends HealthDTO>(options?: APIOptions): Promise<APIResponse<T>> {
    return this.fetch<T>("GET", Routes.Health, options);
  }
}
