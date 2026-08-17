import { NavLink } from "react-router-dom";
import { Compass, Search, MessageCircle, Bell, User } from "lucide-react";
import { WebRoutes } from "@web/routes";
import { cn } from "@shadcn/lib/utils";

const items = [
  { to: WebRoutes.Chat, icon: MessageCircle, label: "Chat" },
  { to: WebRoutes.Search, icon: Search, label: "Search" },
  { to: WebRoutes.Browse, icon: Compass, label: "Browse" },
  { to: WebRoutes.Notifications, icon: Bell, label: "Alerts" },
  { to: WebRoutes.Profile, icon: User, label: "Profile" },
];

export function BottomNav() {
  return (
    <footer className="shrink-0 border-t">
      <nav className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === WebRoutes.Browse}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </footer>
  );
}
