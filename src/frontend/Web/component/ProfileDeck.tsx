import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type TransitionEvent,
} from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import type { ProfileDTO } from "@common/dto/profile.dto";
import { API } from "@web/API/api";
import { loadingWrapper } from "@web/utils/loadingWrapper";
import { useProfilePagination, type FetchProfilePage } from "@web/hook/useProfilePagination";
import { ProfileCard } from "@web/component/ProfileCard";
import { LikeButton } from "@web/component/LikeButton";
import { ProfileModeration } from "@web/component/ProfileModeration";
import { Button } from "@shadcn/ui/button";
import { Skeleton } from "@shadcn/ui/skeleton";
import { cn } from "@shadcn/lib/utils";

const PREFETCH_BEFORE = 3;

interface ProfileDeckProps {
  fetchPage: FetchProfilePage;
  emptyMessage?: string;
}

export function ProfileDeck({ fetchPage, emptyMessage }: ProfileDeckProps) {
  const { items, hasNext, initialLoading, loadPage, reload } = useProfilePagination(fetchPage);

  const [index, setIndex] = useState(0);
  const [profile, setProfile] = useState<ProfileDTO | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exit, setExit] = useState<"like" | "next" | null>(null);

  const cacheRef = useRef(new Map<string, ProfileDTO>());

  useEffect(() => {
    setIndex(0);
    cacheRef.current.clear();
  }, [fetchPage]);

  const currentId = items[index]?.userId ?? null;
  const nextId = items[index + 1]?.userId ?? null;

  useLayoutEffect(() => {
    if (!currentId) {
      setProfile(null);
      return;
    }
    const cached = cacheRef.current.get(currentId);
    if (cached) {
      setProfile(cached);
      setError(null);
    }
  }, [currentId]);

  useEffect(() => {
    if (!currentId || cacheRef.current.has(currentId)) return;
    setProfile(null);
    setError(null);
    loadingWrapper(setCardLoading, () =>
      API.profiles.getById(currentId).then((r) => {
        if (r.error) return setError(String(r.data));
        cacheRef.current.set(currentId, r.data);
        setProfile(r.data);
      }),
    );
  }, [currentId]);

  useEffect(() => {
    if (!nextId || cacheRef.current.has(nextId)) return;
    API.profiles.getById(nextId).then((r) => {
      if (!r.error) cacheRef.current.set(nextId, r.data);
    });
  }, [nextId]);

  useEffect(() => {
    if (hasNext && items.length - index <= PREFETCH_BEFORE) loadPage();
  }, [hasNext, items.length, index, loadPage]);

  function next() {
    setIndex((i) => i + 1);
  }

  function advance(kind: "like" | "next") {
    if (exit) return;
    setExit(kind);
  }

  function handleExited(e: TransitionEvent<HTMLDivElement>) {
    if (!exit) return;
    if (e.propertyName !== "opacity" || e.target !== e.currentTarget) return;
    setExit(null);
    next();
  }

  function restart() {
    setIndex(0);
    cacheRef.current.clear();
    reload();
  }

  if (initialLoading) return <DeckSkeleton />;

  if (items.length === 0) {
    return <DeckMessage>{emptyMessage ?? "Nothing to show yet."}</DeckMessage>;
  }

  if (index >= items.length && !hasNext) {
    return (
      <DeckMessage
        action={
          <Button variant="outline" onClick={restart}>
            <RotateCcw className="size-4" />
            Start over
          </Button>
        }
      >
        You&apos;ve seen everyone for now. Come back later or widen your filters.
      </DeckMessage>
    );
  }

  if (error) {
    return (
      <DeckMessage
        tone="error"
        action={
          <Button variant="outline" onClick={next}>
            Skip this profile
          </Button>
        }
      >
        {error}
      </DeckMessage>
    );
  }

  if (cardLoading || !profile) return <DeckSkeleton />;

  return (
    <div className="mx-auto h-full w-full max-w-md overflow-hidden">
      <div
        key={profile.userId}
        className={cn(
          "h-full transition-all duration-200 ease-out",
          exit === "like" && "translate-x-[115%] rotate-3 opacity-0",
          exit === "next" && "-translate-x-[115%] -rotate-3 opacity-0",
        )}
        onTransitionEnd={handleExited}
      >
        <div className="animate-in fade-in zoom-in-95 h-full duration-200">
          <ProfileCard
            fill
            profile={profile}
            actions={
              <>
                <DeckActions
                  profile={profile}
                  disabled={exit !== null}
                  onNext={() => advance("next")}
                  onLiked={(updated, liked) => {
                    cacheRef.current.set(updated.userId, updated);
                    setProfile(updated);
                    advance(liked ? "like" : "next");
                  }}
                />
                <ProfileModeration
                  userId={profile.userId}
                  disabled={exit !== null}
                  onBlocked={() => advance("next")}
                />
              </>
            }
          />
        </div>
      </div>
    </div>
  );
}

interface DeckActionsProps {
  profile: ProfileDTO;
  disabled: boolean;
  onNext: () => void;
  onLiked: (updated: ProfileDTO, liked: boolean) => void;
}

function DeckActions({ profile, disabled, onNext, onLiked }: DeckActionsProps) {
  return (
    <div className="flex items-center justify-center gap-8 pt-1">
      <Button
        size="icon"
        variant="outline"
        onClick={onNext}
        disabled={disabled}
        title="Next profile"
        aria-label="Next profile"
        className="size-14 rounded-full border-2 shadow-sm transition-transform hover:scale-105 active:scale-95"
      >
        <ArrowLeft className="size-6" />
      </Button>

      <LikeButton
        round
        profile={profile}
        onChange={(state) => onLiked({ ...profile, ...state }, state.likedByMe)}
      />
    </div>
  );
}

function DeckMessage({
  children,
  action,
  tone,
}: {
  children: ReactNode;
  action?: ReactNode;
  tone?: "error";
}) {
  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center gap-4 text-center">
      <p className={cn("text-sm", tone === "error" ? "text-destructive" : "text-muted-foreground")}>
        {children}
      </p>
      {action}
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
