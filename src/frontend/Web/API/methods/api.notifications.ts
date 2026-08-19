import type { NotificationListDTO } from "@common/dto/notification.dto";
import { Routes } from "@common/routes/routes";
import type { APIResponse } from "../fetchAPI";
import { IAPI } from "../interface";

export class APINotifications extends IAPI {
  list(
    limit: number,
    offset: number,
  ): Promise<APIResponse<NotificationListDTO>> {
    return this.fetch<NotificationListDTO>("GET", Routes.Notifications.List, {
      query: { limit, offset },
    });
  }

  markAllRead(): Promise<APIResponse<void>> {
    return this.fetch<void>("POST", Routes.Notifications.Read);
  }

  remove(id: string): Promise<APIResponse<void>> {
    return this.fetch<void>(
      "DELETE",
      Routes.Notifications.ById.replace(":id", id),
    );
  }
}
