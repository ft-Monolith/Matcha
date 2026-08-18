import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { NotificationDTO } from "@common/dto/notification.dto";
import { API } from "@web/API/api";
import { $notifUnread } from "@web/observables/observables";
import { WebRoutes } from "@web/routes";
import { loadingWrapper } from "@web/utils/loadingWrapper";
import { notificationText } from "@web/utils/notificationText";
import { ProfileDialog } from "@web/component/ProfileDialog";
import { NextObserver } from "@web/component/NextObserver";
import { Avatar, AvatarFallback, AvatarImage } from "@shadcn/ui/avatar";
import { Skeleton } from "@shadcn/ui/skeleton";

const PAGE_SIZE = 20;

export function NotificationsView() {
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationDTO[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null); // profil ouvert (like/visit)
  const offsetRef = useRef(0);
  const inFlightRef = useRef(false);

  const loadPage = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const r = await API.notifications.list(PAGE_SIZE, offsetRef.current);
      if (r.error) return;
      setItems((prev) => [...prev, ...r.data.items]);
      offsetRef.current += r.data.items.length;
      setHasNext(r.data.hasNextPage);
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadingWrapper(setInitialLoading, loadPage);
    API.notifications.markAllRead().then((r) => {
      if (!r.error) $notifUnread.set(0);
    });
  }, [loadPage]);

  function remove(id: string) {
    setItems((prev) => prev.filter((n) => n.id !== id));
    offsetRef.current = Math.max(0, offsetRef.current - 1);
    API.notifications.remove(id);
  }

  function onClick(n: NotificationDTO) {
    switch (n.type) {
      case "match":
        remove(n.id);
        navigate(WebRoutes.Chat, { state: { openUserId: n.actor.userId } });
        break;
      case "like":
      case "visit":
        setSelected(n.actor.userId);
        remove(n.id);
        break;
      case "unlike":
        remove(n.id);
        break;
    }
  }

  if (initialLoading) {
    return (
      <div className="mx-auto w-full max-w-md space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="text-muted-foreground text-center text-sm">No notifications yet.</p>;
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <ul className="divide-y">
        {items.map((n) => (
          <li key={n.id}>
            <button
              className="hover:bg-accent flex w-full items-center gap-3 rounded-md py-3 text-left transition-colors"
              onClick={() => onClick(n)}
            >
              <Avatar className="size-9">
                {n.actor.photo && <AvatarImage src={n.actor.photo} alt={n.actor.firstName} />}
                <AvatarFallback>{n.actor.firstName[0]?.toUpperCase() ?? "?"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm">{notificationText(n)}</p>
                <p className="text-muted-foreground text-xs">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <NextObserver hasNext={hasNext} onNext={loadPage} />

      <ProfileDialog userId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
