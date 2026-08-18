import { useCallback, useEffect, useRef, useState } from "react";
import type { ProfilePreviewDTO } from "@common/dto/profile.dto";
import type { Paginated } from "@common/dto/pagination.dto";
import type { APIResponse } from "@web/API/fetchAPI";
import { loadingWrapper } from "@web/utils/loadingWrapper";
import { CompactProfileCard } from "@web/component/CompactProfileCard";
import { NextObserver } from "@web/component/NextObserver";
import { ProfileDialog } from "@web/component/ProfileDialog";
import { Skeleton } from "@shadcn/ui/skeleton";

const PAGE_SIZE = 20;

interface ProfileListProps {
  // Charge une page ; réutilisé par Search (/profiles), Likes (/me/likers), Visits…
  fetchPage: (limit: number, offset: number) => Promise<APIResponse<Paginated<ProfilePreviewDTO>>>;
  emptyMessage?: string;
}

// Grille paginée de cartes compactes + infinite scroll + dialog de consultation
export function ProfileList({ fetchPage, emptyMessage }: ProfileListProps) {
  const [items, setItems] = useState<ProfilePreviewDTO[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const offsetRef = useRef(0);
  const inFlightRef = useRef(false);

  const loadPage = useCallback(async () => {
    // Garde anti-concurrence : évite qu'un 2e appel (StrictMode / scroll) recharge la même page
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const r = await fetchPage(PAGE_SIZE, offsetRef.current);
      if (r.error) return;
      setItems((prev) => [...prev, ...r.data.items]);
      offsetRef.current += r.data.items.length;
      setHasNext(r.data.hasNextPage);
    } finally {
      inFlightRef.current = false;
    }
  }, [fetchPage]);

  useEffect(() => {
    loadingWrapper(setInitialLoading, loadPage);
  }, [loadPage]);

  if (initialLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-center text-sm">
        {emptyMessage ?? "Nothing to show yet."}
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((p) => (
          <CompactProfileCard key={p.userId} profile={p} onClick={() => setSelected(p.userId)} />
        ))}
      </div>

      <NextObserver hasNext={hasNext} onNext={loadPage} />

      <ProfileDialog
        userId={selected}
        onClose={() => setSelected(null)}
        onBlocked={(id) => setItems((prev) => prev.filter((p) => p.userId !== id))}
      />
    </div>
  );
}
