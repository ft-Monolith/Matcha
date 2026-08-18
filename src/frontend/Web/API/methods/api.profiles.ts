import type { ProfileDTO, ProfilePreviewDTO } from "@common/dto/profile.dto";
import type { InteractionStateDTO } from "@common/dto/interaction.dto";
import type { Paginated } from "@common/dto/pagination.dto";
import type { SearchParams } from "@common/dto/search.dto";
import { Routes } from "@common/routes/routes";
import type { APIResponse } from "../fetchAPI";
import { IAPI } from "../interface";

export class APIProfiles extends IAPI {
  search(params: SearchParams): Promise<APIResponse<Paginated<ProfilePreviewDTO>>> {
    const { tags, ...rest } = params;
    return this.fetch<Paginated<ProfilePreviewDTO>>("GET", Routes.Profiles.List, {
      query: { ...rest, tags: tags && tags.length > 0 ? tags.join(",") : undefined },
    });
  }

  getById(id: string): Promise<APIResponse<ProfileDTO>> {
    return this.fetch<ProfileDTO>("GET", Routes.Profiles.ById.replace(":id", id));
  }

  like(id: string): Promise<APIResponse<InteractionStateDTO>> {
    return this.fetch<InteractionStateDTO>("POST", Routes.Profiles.Like.replace(":id", id));
  }

  unlike(id: string): Promise<APIResponse<InteractionStateDTO>> {
    return this.fetch<InteractionStateDTO>("DELETE", Routes.Profiles.Like.replace(":id", id));
  }

  block(id: string): Promise<APIResponse<void>> {
    return this.fetch<void>("POST", Routes.Profiles.Block.replace(":id", id));
  }

  unblock(id: string): Promise<APIResponse<void>> {
    return this.fetch<void>("DELETE", Routes.Profiles.Block.replace(":id", id));
  }

  report(id: string): Promise<APIResponse<void>> {
    return this.fetch<void>("POST", Routes.Profiles.Report.replace(":id", id));
  }
}
