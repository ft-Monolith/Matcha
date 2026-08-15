import { Outlet } from "react-router-dom";
import { API } from "@web/API/api";
import { $user, $use } from "@web/observables/observables";
import { Button } from "@shadcn/ui/button";
import { BottomNav } from "@web/component/BottomNav";

export function AppLayout() {
  const user = $use($user);

  function logout() {
    return API.auth.logout().then(() => $user.set(null));
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-lg font-semibold">Matcha</span>
        <div className="flex items-center gap-3">
          {user && <span className="text-muted-foreground text-sm">@{user.username}</span>}
          <Button variant="outline" size="sm" onClick={logout}>
            Log out
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-4 py-6">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
