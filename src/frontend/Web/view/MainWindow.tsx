import { useState } from "react";
import type { HealthDTO } from "@common/dto/health.dto";
import { API } from "@web/API/api";
import { $user, $use } from "@web/observables/observables";
import { loadingWrapper } from "@web/utils/loadingWrapper";
import { Button } from "@shadcn/ui/button";
import { Badge } from "@shadcn/ui/badge";

export function MainWindow() {
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState<HealthDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const user = $use($user);

  function logout() {
    return API.auth.logout().then(() => $user.set(null));
  }

  function checkHealth() {
    return loadingWrapper(setLoading, () =>
      API.health.getHealth().then((r) => {
        if (r.error) {
          setHealth(null);
          setError(String(r.data));
          return;
        }

        setError(null);
        setHealth(r.data);
      }),
    )}

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-lg font-semibold">Matcha</span>
        <div className="flex items-center gap-3">
          {user && <span className="text-sm text-muted-foreground">@{user.username}</span>}
          <Button variant="outline" size="sm" onClick={logout}>
            Log out
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4">
          <Button onClick={checkHealth} disabled={loading}>
            {loading ? "Checking…" : "Test API"}
          </Button>

          {health && (
            <div className="flex items-center gap-2">
              <Badge variant={health.db === "up" ? "default" : "destructive"}>
                db : {health.db}
              </Badge>
              <span className="text-muted-foreground text-sm">
                {health.status} · uptime {health.uptime}s
              </span>
            </div>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>
      </main>

      <footer className="border-t px-4 py-3 text-center text-xs text-neutral-500">
        Matcha
      </footer>
    </div>
  );
}
