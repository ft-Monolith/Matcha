import { useCallback, useEffect, useRef, useState } from "react";
import type { ProfilePreviewDTO } from "@common/dto/profile.dto";
import type { Paginated } from "@common/dto/pagination.dto";
import type { APIResponse } from "@web/API/fetchAPI";
import { loadingWrapper } from "@web/utils/loadingWrapper";

const PAGE_SIZE = 24;

export type FetchProfilePage = (
  limit: number,
  offset: number,
) => Promise<APIResponse<Paginated<ProfilePreviewDTO>>>;

export function useProfilePagination(fetchPage: FetchProfilePage) {
  const [items, setItems] = useState<ProfilePreviewDTO[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const offsetRef = useRef(0);
  const inFlightRef = useRef(false);

  const loadPage = useCallback(async () => {
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

  const reload = useCallback(() => {
    setItems([]);
    setHasNext(false);
    offsetRef.current = 0;
    setInitialLoading(true);
    return loadingWrapper(setInitialLoading, loadPage);
  }, [loadPage]);

  useEffect(() => {
    reload();
  }, [reload]);

  const removeItem = useCallback((userId: string) => {
    setItems((prev) => prev.filter((p) => p.userId !== userId));
  }, []);

  return { items, hasNext, initialLoading, loadPage, reload, removeItem };
}
