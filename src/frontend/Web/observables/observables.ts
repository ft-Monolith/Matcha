import { observable, type Observable } from "@legendapp/state";
import { useSelector } from "@legendapp/state/react";
import type { UserDTO } from "@common/dto/user.dto";


export const $user = observable<UserDTO | null>(null);
export const $authReady = observable(false);

export interface Presence {
  online: boolean;
  lastSeen: string | null;
}
export const $presence = observable<Record<string, Presence>>({});

export const $notifUnread = observable(0);
export const $chatUnread = observable(0);

export const $openChatUser = observable<string | null>(null);

export function $use<T>(o: Observable<T>): T {
  return useSelector(() => o.get());
}
