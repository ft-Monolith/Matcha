import { useState } from "react";
import { useProfilePagination, type FetchProfilePage } from "@web/hook/useProfilePagination";
import { CompactProfileCard } from "@web/component/CompactProfileCard";
import { NextObserver } from "@web/component/NextObserver";
import { ProfileDialog } from "@web/component/ProfileDialog";
import { Skeleton } from "@shadcn/ui/skeleton";

interface ProfileListProps {
  fetchPage: FetchProfilePage;
  emptyMessage?: string;
}

export function ProfileList({ fetchPage, emptyMessage }: ProfileListProps) {
  const { items, hasNext, initialLoading, loadPage, removeItem } = useProfilePagination(fetchPage);
  const [selected, setSelected] = useState<string | null>(null);

  if (initialLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-3/4 w-full rounded-xl" />
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
        onBlocked={removeItem}
      />
    </div>
  );
}
