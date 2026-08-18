import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import type { ProfileDTO } from "@common/dto/profile.dto";
import { API } from "@web/API/api";
import { loadingWrapper } from "@web/utils/loadingWrapper";
import { ProfileCard } from "@web/component/ProfileCard";
import { LikeButton } from "@web/component/LikeButton";
import { Dialog, DialogContent } from "@shadcn/ui/dialog";
import { Button } from "@shadcn/ui/button";
import { Skeleton } from "@shadcn/ui/skeleton";

interface ProfileDialogProps {
  userId: string | null; // id du profil à afficher ; null = fermé
  onClose: () => void;
  // Retire le profil de la liste appelante après un block (disparition immédiate)
  onBlocked?: (userId: string) => void;
  // actions contextuelles supplémentaires
  actions?: (profile: ProfileDTO) => ReactNode;
}

export function ProfileDialog({ userId, onClose, onBlocked, actions }: ProfileDialogProps) {
  const [profile, setProfile] = useState<ProfileDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setProfile(null);
    setError(null);
    loadingWrapper(setLoading, () =>
      API.profiles.getById(userId).then((r) => {
        if (r.error) return setError(String(r.data));
        setProfile(r.data);
      }),
    );
  }, [userId]);

  function block(id: string) {
    return loadingWrapper(setBusy, async () => {
      const r = await API.profiles.block(id);
      if (r.error) return toast.error(String(r.data));
      toast.success("Profile blocked");
      onBlocked?.(id);
      onClose();
    });
  }

  function report(id: string) {
    return loadingWrapper(setBusy, async () => {
      const r = await API.profiles.report(id);
      if (r.error) return toast.error(String(r.data));
      toast.success("Profile reported as fake");
    });
  }

  return (
    <Dialog open={userId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-white">
        {error && <p className="text-destructive text-center text-sm">{error}</p>}
        {(loading || !profile) && !error && <Skeleton className="h-96 w-full rounded-xl" />}
        {profile && (
          <ProfileCard
            profile={profile}
            actions={
              <>
                <LikeButton
                  profile={profile}
                  onChange={(state) => setProfile({ ...profile, ...state })}
                />
                {actions?.(profile)}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={busy}
                    onClick={() => report(profile.userId)}
                  >
                    Report
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={busy}
                    onClick={() => block(profile.userId)}
                  >
                    Block
                  </Button>
                </div>
              </>
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
