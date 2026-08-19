import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { ProfileDTO } from "@common/dto/profile.dto";
import { API } from "@web/API/api";
import { loadingWrapper } from "@web/utils/loadingWrapper";
import { ProfileCard } from "@web/component/ProfileCard";
import { LikeButton } from "@web/component/LikeButton";
import { ProfileModeration } from "@web/component/ProfileModeration";
import { Dialog, DialogContent } from "@shadcn/ui/dialog";
import { Skeleton } from "@shadcn/ui/skeleton";

interface ProfileDialogProps {
  userId: string | null;
  onClose: () => void;
  onBlocked?: (userId: string) => void;
  actions?: (profile: ProfileDTO) => ReactNode;
}

export function ProfileDialog({ userId, onClose, onBlocked, actions }: ProfileDialogProps) {
  const [profile, setProfile] = useState<ProfileDTO | null>(null);
  const [loading, setLoading] = useState(false);
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

  return (
    <Dialog open={userId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto overscroll-contain bg-white">
        {error && <p className="text-destructive text-center text-sm">{error}</p>}
        {(loading || !profile) && !error && <Skeleton className="h-96 w-full rounded-xl" />}
        {profile && (
          <ProfileCard
            profile={profile}
            floatingAction={
              <LikeButton
                round
                profile={profile}
                onChange={(state) => setProfile({ ...profile, ...state })}
              />
            }
            actions={
              <>
                {actions?.(profile)}
                <ProfileModeration
                  userId={profile.userId}
                  onBlocked={(id) => {
                    onBlocked?.(id);
                    onClose();
                  }}
                />
              </>
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
