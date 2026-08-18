import type { ProfilePreviewDTO } from "@common/dto/profile.dto";
import type { Paginated } from "@common/dto/pagination.dto";
import { Routes } from "@common/routes/routes";
import type { APIResponse } from "../fetchAPI";
import { IAPI } from "../interface";

export class APIMe extends IAPI {
  likers(limit: number, offset: number): Promise<APIResponse<Paginated<ProfilePreviewDTO>>> {
    return this.fetch<Paginated<ProfilePreviewDTO>>("GET", Routes.Me.Likers, {
      query: { limit, offset },
    });
  }

  visits(limit: number, offset: number): Promise<APIResponse<Paginated<ProfilePreviewDTO>>> {
    return this.fetch<Paginated<ProfilePreviewDTO>>("GET", Routes.Me.Visits, {
      query: { limit, offset },
    });
  }

  blocked(limit: number, offset: number): Promise<APIResponse<Paginated<ProfilePreviewDTO>>> {
    return this.fetch<Paginated<ProfilePreviewDTO>>("GET", Routes.Me.Blocks, {
      query: { limit, offset },
    });
  }
}
