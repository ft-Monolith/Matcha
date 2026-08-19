import { useState } from "react";
import { toast } from "sonner";
import { Heart, HeartCrack } from "lucide-react";
import type { ProfileDTO } from "@common/dto/profile.dto";
import type { InteractionStateDTO } from "@common/dto/interaction.dto";
import { API } from "@web/API/api";
import { loadingWrapper } from "@web/utils/loadingWrapper";
import { Button } from "@shadcn/ui/button";
import { cn } from "@shadcn/lib/utils";

interface LikeButtonProps {
  profile: ProfileDTO;
  onChange: (state: InteractionStateDTO) => void;
  round?: boolean;
}

export function LikeButton({ profile, onChange, round }: LikeButtonProps) {
  const [busy, setBusy] = useState(false);
  const matched = profile.likedByMe && profile.likesMe;
  const liked = profile.likedByMe;
  const Icon = liked ? HeartCrack : Heart;

  function toggle() {
    return loadingWrapper(setBusy, async () => {
      const r = liked
        ? await API.profiles.unlike(profile.userId)
        : await API.profiles.like(profile.userId);
      if (r.error) return toast.error(String(r.data));
      onChange(r.data);
    });
  }

  if (round) {
    const title = matched ? "Matched · click to unlike" : liked ? "Click to unlike" : "Like";
    return (
      <Button
        size="icon"
        onClick={toggle}
        disabled={busy}
        title={title}
        aria-label={title}
        className={cn(
          "group size-14 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95",
          matched
            ? "bg-green-600 text-white hover:bg-green-600"
            : liked
              ? "bg-white text-rose-600 hover:bg-white"
              : "bg-rose-500 text-white hover:bg-rose-500",
        )}
      >
        <Icon
          className={cn(
            "size-6 transition-transform group-hover:scale-110",
            !liked && "fill-current",
            matched && "fill-white",
          )}
        />
      </Button>
    );
  }

  const label = matched
    ? "It's a match"
    : liked
      ? "Liked"
      : profile.likesMe
        ? "Like back"
        : "Like";

  return (
    <Button
      onClick={toggle}
      disabled={busy}
      title={liked ? "Click to unlike" : undefined}
      className={cn(
        "group h-11 rounded-xl text-base font-semibold shadow-sm transition-colors",
        matched
          ? "bg-green-600 text-white hover:bg-green-700"
          : liked
            ? "border border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-300 hover:bg-rose-100"
            : "bg-rose-500 text-white hover:bg-rose-600",
      )}
    >
      <Icon
        className={cn(
          "size-5 transition-transform group-hover:scale-110",
          !liked && "fill-current",
          matched && "fill-white",
        )}
      />
      <span className={liked ? "group-hover:hidden" : undefined}>{label}</span>
      {liked && <span className="hidden group-hover:inline">Unlike</span>}
    </Button>
  );
}
