import { useState } from "react";
import { Outlet } from "react-router-dom";
import { API } from "@web/API/api";
import { $user, $use } from "@web/observables/observables";
import { loadingWrapper } from "@web/utils/loadingWrapper";
import { Button } from "@shadcn/ui/button";
import { Toaster } from "@shadcn/ui/sonner";
import { BottomNav } from "@web/component/BottomNav";

export function AppLayout() {
  const user = $use($user);
  const [loggingOut, setLoggingOut] = useState(false);

  function logout() {
    return loadingWrapper(setLoggingOut, () =>
      API.auth.logout().then(() => $user.set(null)),
    );
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <span className="text-lg font-semibold">Matcha</span>
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-muted-foreground text-sm">
              @{user.username}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={loggingOut}
            onClick={logout}
          >
            {loggingOut ? "…" : "Log out"}
          </Button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6">
        <Outlet />
      </main>

      <BottomNav />

      <Toaster position="top-right" />
    </div>
  );
}
