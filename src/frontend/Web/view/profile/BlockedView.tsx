import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ProfilePreviewDTO } from "@common/dto/profile.dto";
import { API } from "@web/API/api";
import { loadingWrapper } from "@web/utils/loadingWrapper";
import { CompactProfileCard } from "@web/component/CompactProfileCard";
import { NextObserver } from "@web/component/NextObserver";
import { Button } from "@shadcn/ui/button";
import { Skeleton } from "@shadcn/ui/skeleton";

const PAGE_SIZE = 20;

export function BlockedView() {
  const [items, setItems] = useState<ProfilePreviewDTO[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const offsetRef = useRef(0);
  const inFlightRef = useRef(false);

  const loadPage = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const r = await API.me.blocked(PAGE_SIZE, offsetRef.current);
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
  }, [loadPage]);

  function unblock(id: string) {
    setBusyId(id);
    return API.profiles
      .unblock(id)
      .then((r) => {
        if (r.error) return toast.error(String(r.data));
        setItems((prev) => prev.filter((p) => p.userId !== id));
      })
      .finally(() => setBusyId(null));
  }

  if (initialLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="text-muted-foreground text-center text-sm">You haven't blocked anyone.</p>;
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        {items.map((p) => (
          <div key={p.userId} className="flex flex-col gap-2">
            <CompactProfileCard profile={p} />
            <Button
              variant="outline"
              size="sm"
              disabled={busyId === p.userId}
              onClick={() => unblock(p.userId)}
            >
              Unblock
            </Button>
          </div>
        ))}
      </div>

      <NextObserver hasNext={hasNext} onNext={loadPage} />
    </div>
  );
}
