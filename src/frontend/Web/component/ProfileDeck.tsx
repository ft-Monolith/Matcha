import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Flag, Ban, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { ProfileDTO, ProfilePreviewDTO } from "@common/dto/profile.dto";
import type { Paginated } from "@common/dto/pagination.dto";
import type { APIResponse } from "@web/API/fetchAPI";
import { API } from "@web/API/api";
import { loadingWrapper } from "@web/utils/loadingWrapper";
import { ProfileCard } from "@web/component/ProfileCard";
import { LikeButton } from "@web/component/LikeButton";
import { Button } from "@shadcn/ui/button";
import { Skeleton } from "@shadcn/ui/skeleton";

const PAGE_SIZE = 20;
/** On recharge une page dès qu'il reste moins de cartes que ça devant nous. */
const PREFETCH_BEFORE = 3;

interface ProfileDeckProps {
  /** Même signature que ProfileList : les deux sont interchangeables. */
  fetchPage: (limit: number, offset: number) => Promise<APIResponse<Paginated<ProfilePreviewDTO>>>;
  emptyMessage?: string;
}

/**
 * Consultation une carte à la fois : on « passe » ou on « like », et la suivante arrive.
 * La file est paginée comme dans ProfileList ; seule la présentation change.
 *
 * Note : « passer » n'existe pas côté API — c'est purement local. Les profils passés
 * réapparaîtront au prochain chargement de la page.
 */
export function ProfileDeck({ fetchPage, emptyMessage }: ProfileDeckProps) {
  const [queue, setQueue] = useState<ProfilePreviewDTO[]>([]);
  const [index, setIndex] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [profile, setProfile] = useState<ProfileDTO | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const offsetRef = useRef(0);
  const inFlightRef = useRef(false);
  /** Profils complets déjà chargés, pour passer d'une carte à l'autre sans attente. */
  const cacheRef = useRef(new Map<string, ProfileDTO>());

  const loadPage = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const r = await fetchPage(PAGE_SIZE, offsetRef.current);
      if (r.error) return;
      setQueue((prev) => [...prev, ...r.data.items]);
      offsetRef.current += r.data.items.length;
      setHasNext(r.data.hasNextPage);
    } finally {
      inFlightRef.current = false;
    }
  }, [fetchPage]);

  const reload = useCallback(() => {
    cacheRef.current.clear();
    setQueue([]);
    setIndex(0);
    setHasNext(false);
    offsetRef.current = 0;
    setInitialLoading(true);
    return loadingWrapper(setInitialLoading, loadPage);
  }, [loadPage]);

  /** Les filtres ont changé (fetchPage change) → on repart de zéro. */
  useEffect(() => {
    reload();
  }, [reload]);

  // On dépend de l'ID (une chaîne), pas de l'objet : comparer des objets avec ===
  // relancerait l'effet à chaque rendu.
  const currentId = queue[index]?.userId ?? null;

  useEffect(() => {
    if (!currentId) {
      setProfile(null);
      return;
    }
    setError(null);

    // Déjà préchargé : on affiche sans passer par l'état de chargement,
    // sinon un squelette clignoterait à chaque carte.
    const cached = cacheRef.current.get(currentId);
    if (cached) {
      setProfile(cached);
      return;
    }

    setProfile(null);
    loadingWrapper(setCardLoading, () =>
      API.profiles.getById(currentId).then((r) => {
        if (r.error) return setError(String(r.data));
        cacheRef.current.set(currentId, r.data);
        setProfile(r.data);
      }),
    );
  }, [currentId]);

  /** Charge la carte suivante en fond pendant que l'utilisateur regarde l'actuelle. */
  const nextId = queue[index + 1]?.userId ?? null;

  useEffect(() => {
    if (!nextId || cacheRef.current.has(nextId)) return;
    API.profiles.getById(nextId).then((r) => {
      if (!r.error) cacheRef.current.set(nextId, r.data);
    });
  }, [nextId]);

  /** Précharge la page suivante avant d'arriver au bout de la file. */
  useEffect(() => {
    if (hasNext && queue.length - index <= PREFETCH_BEFORE) loadPage();
  }, [hasNext, queue.length, index, loadPage]);

  function next() {
    setIndex((i) => i + 1);
  }

  function block(id: string) {
    return loadingWrapper(setBusy, async () => {
      const r = await API.profiles.block(id);
      if (r.error) return toast.error(String(r.data));
      toast.success("Profile blocked");
      next();
    });
  }

  function report(id: string) {
    return loadingWrapper(setBusy, async () => {
      const r = await API.profiles.report(id);
      if (r.error) return toast.error(String(r.data));
      toast.success("Profile reported as fake");
    });
  }

  if (initialLoading) {
    return <DeckSkeleton />;
  }

  if (queue.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground text-center text-sm">
          {emptyMessage ?? "Nothing to show yet."}
        </p>
      </div>
    );
  }

  /** Fin de la pile : plus de carte devant, et plus rien à charger. */
  if (index >= queue.length && !hasNext) {
    return (
      <div className="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center gap-4 text-center">
        <p className="text-muted-foreground text-sm">
          You&apos;ve seen everyone for now. Come back later or widen your filters.
        </p>
        <Button variant="outline" onClick={reload}>
          <RotateCcw className="size-4" />
          Start over
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center gap-4 text-center">
        <p className="text-destructive text-sm">{error}</p>
        <Button variant="outline" onClick={next}>
          Skip this profile
        </Button>
      </div>
    );
  }

  if (cardLoading || !profile) {
    return <DeckSkeleton />;
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col">
      <ProfileCard
        fill
        profile={profile}
        actions={
          <>
            <div className="flex items-center justify-center gap-8 pt-1">
              <LikeButton
                round
                profile={profile}
                onChange={(state) => {
                  const updated = { ...profile, ...state };
                  cacheRef.current.set(profile.userId, updated);
                  setProfile(updated);
                  if (state.likedByMe) next();
                }}
              />

              <Button
                size="icon"
                variant="outline"
                onClick={next}
                disabled={busy}
                title="Next profile"
                aria-label="Next profile"
                className="size-14 rounded-full border-2 shadow-sm transition-transform hover:scale-105 active:scale-95"
              >
                <ArrowRight className="size-6" />
              </Button>
            </div>

            <div className="flex items-center justify-center gap-1 pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground gap-1.5"
                disabled={busy}
                onClick={() => report(profile.userId)}
              >
                <Flag className="size-4" />
                Report
              </Button>
              <span className="text-muted-foreground/40">·</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive gap-1.5"
                disabled={busy}
                onClick={() => block(profile.userId)}
              >
                <Ban className="size-4" />
                Block
              </Button>
            </div>
          </>
        }
      />
    </div>
  );
}

function DeckSkeleton() {
  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col gap-4">
      <Skeleton className="min-h-0 w-full flex-1 rounded-xl" />
      <Skeleton className="h-14 w-full shrink-0 rounded-xl" />
    </div>
  );
}
