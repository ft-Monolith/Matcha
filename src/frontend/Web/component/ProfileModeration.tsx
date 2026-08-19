import { useState } from "react";
import { Flag, Ban } from "lucide-react";
import { toast } from "sonner";
import { API } from "@web/API/api";
import { loadingWrapper } from "@web/utils/loadingWrapper";
import { Button } from "@shadcn/ui/button";

interface ProfileModerationProps {
  userId: string;
  onBlocked?: (userId: string) => void;
  disabled?: boolean;
}

export function ProfileModeration({ userId, onBlocked, disabled }: ProfileModerationProps) {
  const [busy, setBusy] = useState(false);
  const off = busy || disabled;

  function block() {
    return loadingWrapper(setBusy, async () => {
      const r = await API.profiles.block(userId);
      if (r.error) return toast.error(String(r.data));
      toast.success("Profile blocked");
      onBlocked?.(userId);
    });
  }

  function report() {
    return loadingWrapper(setBusy, async () => {
      const r = await API.profiles.report(userId);
      if (r.error) return toast.error(String(r.data));
      toast.success("Profile reported as fake");
    });
  }

  return (
    <div className="flex items-center justify-center gap-1 pt-1">
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground gap-1.5"
        disabled={off}
        onClick={report}
      >
        <Flag className="size-4" />
        Report
      </Button>
      <span className="text-muted-foreground/40">·</span>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-destructive gap-1.5"
        disabled={off}
        onClick={block}
      >
        <Ban className="size-4" />
        Block
      </Button>
    </div>
  );
}
