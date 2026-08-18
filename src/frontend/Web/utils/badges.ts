import { API } from "@web/API/api";
import { $notifUnread, $chatUnread } from "@web/observables/observables";

export async function refreshNotifUnread(): Promise<void> {
  const r = await API.notifications.list(1, 0);
  if (!r.error) $notifUnread.set(r.data.unread);
}

export async function refreshChatUnread(): Promise<void> {
  const r = await API.chat.conversations();
  if (!r.error) $chatUnread.set(r.data.reduce((sum, c) => sum + c.unread, 0));
}
