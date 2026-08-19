import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  Sparkles,
  Eye,
  HeartCrack,
  MessageCircle,
  ChevronRight,
  BellOff,
  type LucideIcon,
} from "lucide-react";
import type {
  NotificationDTO,
  NotificationType,
} from "@common/dto/notification.dto";
import { API } from "@web/API/api";
import { $notifUnread } from "@web/observables/observables";
import { socket } from "@web/realtime/socket";
import { WebRoutes } from "@web/routes";
import { loadingWrapper } from "@web/utils/loadingWrapper";
import { notificationText } from "@web/utils/notificationText";
import { ProfileDialog } from "@web/component/ProfileDialog";
import { NextObserver } from "@web/component/NextObserver";
import { Avatar, AvatarFallback, AvatarImage } from "@shadcn/ui/avatar";
import { Skeleton } from "@shadcn/ui/skeleton";
import { cn } from "@shadcn/lib/utils";

const PAGE_SIZE = 20;

const TYPE_META: Record<
  NotificationType,
  { icon: LucideIcon; className: string }
> = {
  match: { icon: Sparkles, className: "bg-green-600" },
  like: { icon: Heart, className: "bg-rose-500" },
  visit: { icon: Eye, className: "bg-sky-500" },
  unlike: { icon: HeartCrack, className: "bg-muted-foreground" },
  message: { icon: MessageCircle, className: "bg-violet-500" },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

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

  useEffect(() => {
    const onNotif = (n: NotificationDTO) => {
      setItems((prev) => {
        if (prev.some((x) => x.id === n.id)) return prev;
        offsetRef.current += 1;
        return [{ ...n, read: true }, ...prev];
      });
      $notifUnread.set(0);
      API.notifications.markAllRead();
    };
    socket.on("notification", onNotif);
    return () => {
      socket.off("notification", onNotif);
    };
  }, []);

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
      <div className="mx-auto w-full max-w-md space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-2.5">
            <Skeleton className="size-11 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/4 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-3 py-16 text-center">
        <BellOff className="size-10 opacity-40" />
        <p className="text-sm">No notifications yet.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-1">
      <ul className="space-y-1">
        {items.map((n) => {
          const { icon: Icon, className: badgeClass } = TYPE_META[n.type];
          const actionable = n.type !== "unlike";
          return (
            <li key={n.id}>
              <button
                className="group flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
                onClick={() => onClick(n)}
              >
                <div className="relative shrink-0">
                  <Avatar className="size-11">
                    {n.actor.photo && (
                      <AvatarImage
                        src={n.actor.photo}
                        alt={n.actor.firstName}
                      />
                    )}
                    <AvatarFallback>
                      {n.actor.firstName[0]?.toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      "ring-background absolute -right-0.5 -bottom-0.5 grid size-5 place-items-center rounded-full ring-2",
                      badgeClass,
                    )}
                  >
                    <Icon className="size-3 text-white" />
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">{notificationText(n)}</p>
                  <p className="text-muted-foreground text-xs">
                    {relativeTime(n.createdAt)}
                  </p>
                </div>

                {!n.read && (
                  <span className="bg-primary size-2 shrink-0 rounded-full" />
                )}
                {actionable && (
                  <ChevronRight className="text-muted-foreground/40 group-hover:text-muted-foreground size-4 shrink-0 transition-colors" />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <NextObserver hasNext={hasNext} onNext={loadPage} />

      <ProfileDialog userId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
