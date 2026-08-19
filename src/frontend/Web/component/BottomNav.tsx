import { NavLink } from "react-router-dom";
import { Compass, Search, MessageCircle, Bell, User } from "lucide-react";
import { WebRoutes } from "@web/routes";
import { $notifUnread, $chatUnread, $use } from "@web/observables/observables";
import { cn } from "@shadcn/lib/utils";

const items = [
  {
    to: WebRoutes.Chat,
    icon: MessageCircle,
    label: "Chat",
    badge: "chat" as const,
  },
  { to: WebRoutes.Search, icon: Search, label: "Search", badge: null },
  { to: WebRoutes.Browse, icon: Compass, label: "Browse", badge: null },
  {
    to: WebRoutes.Notifications,
    icon: Bell,
    label: "Alerts",
    badge: "notif" as const,
  },
  { to: WebRoutes.Profile, icon: User, label: "Profile", badge: null },
];

export function BottomNav() {
  const notifUnread = $use($notifUnread);
  const chatUnread = $use($chatUnread);

  function count(badge: "chat" | "notif" | null): number {
    if (badge === "chat") return chatUnread;
    if (badge === "notif") return notifUnread;
    return 0;
  }

  return (
    <footer className="shrink-0 border-t">
      <nav className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map(({ to, icon: Icon, label, badge }) => {
          const n = count(badge);
          return (
            <NavLink
              key={to}
              to={to}
              end={to === WebRoutes.Browse}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              <span className="relative">
                <Icon className="size-5" />
                {n > 0 && (
                  <span className="bg-destructive absolute -top-1.5 -right-2 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium text-white">
                    {n > 99 ? "99+" : n}
                  </span>
                )}
              </span>
              {label}
            </NavLink>
          );
        })}
      </nav>
    </footer>
  );
}
