import { useState } from "react";
import { toast } from "sonner";
import type { ProfileDTO } from "@common/dto/profile.dto";
import type { InteractionStateDTO } from "@common/dto/interaction.dto";
import { API } from "@web/API/api";
import { loadingWrapper } from "@web/utils/loadingWrapper";
import { Button } from "@shadcn/ui/button";

interface LikeButtonProps {
  profile: ProfileDTO;
  onChange: (state: InteractionStateDTO) => void;
}

export function LikeButton({ profile, onChange }: LikeButtonProps) {
  const [busy, setBusy] = useState(false);
  const matched = profile.likedByMe && profile.likesMe;

  function toggle() {
    return loadingWrapper(setBusy, async () => {
      const r = profile.likedByMe
        ? await API.profiles.unlike(profile.userId)
        : await API.profiles.like(profile.userId);
      if (r.error) return toast.error(String(r.data));
      if (!profile.likedByMe && r.data.likesMe) toast.success("It's a match!");
      onChange(r.data);
    });
  }

  const label = profile.likedByMe
    ? matched
      ? "Matched · Unlike"
      : "Unlike"
    : profile.likesMe
      ? "Like back"
      : "Like";

  return (
    <Button variant={profile.likedByMe ? "outline" : "default"} disabled={busy} onClick={toggle}>
      {label}
    </Button>
  );
}
