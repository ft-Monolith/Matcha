import { useEffect, useState } from "react";
import type { MyProfileDTO } from "@common/dto/profile.dto";
import { API } from "@web/API/api";
import { loadingWrapper } from "@web/utils/loadingWrapper";
import { ProfileCard } from "@web/component/ProfileCard";
import { EditProfileDialog } from "@web/component/EditProfileDialog";
import { Skeleton } from "@shadcn/ui/skeleton";

export function ProfileView() {
  const [profile, setProfile] = useState<MyProfileDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadingWrapper(setLoading, () =>
      API.profile.getMe().then((r) => {
        if (r.error) return setError(String(r.data));
        setProfile(r.data);
      }),
    );
  }, []);

  if (error)
    return <p className="text-destructive text-center text-sm">{error}</p>;

  if (loading || !profile) {
    return (
      <div className="mx-auto w-full max-w-md">
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <ProfileCard
      profile={profile}
      actions={<EditProfileDialog profile={profile} onChange={setProfile} />}
    />
  );
}
