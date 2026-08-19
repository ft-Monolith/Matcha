import { Star, MapPin } from "lucide-react";
import type { ProfilePreviewDTO } from "@common/dto/profile.dto";
import { usePresence } from "@web/component/PresenceIndicator";

interface CompactProfileCardProps {
  profile: ProfilePreviewDTO;
  onClick?: () => void;
}

export function CompactProfileCard({ profile, onClick }: CompactProfileCardProps) {
  const { firstName, age, photo, userId, online: fallbackOnline, fame, distance } = profile;
  const initials = firstName[0]?.toUpperCase() ?? "?";

  const presence = usePresence(userId);
  const online = presence?.online ?? fallbackOnline;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group bg-muted relative aspect-3/4 w-full overflow-hidden rounded-xl text-left shadow-sm transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {photo ? (
        <img
          src={photo}
          alt={firstName}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="text-muted-foreground flex h-full w-full items-center justify-center text-4xl font-semibold">
          {initials}
        </div>
      )}

      {online && (
        <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          <span className="size-1.5 rounded-full bg-green-400" />
          Online
        </span>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/25 to-transparent p-2.5 pt-8">
        <p className="truncate font-semibold text-white drop-shadow-sm">
          {firstName}
          {age !== null && <span className="font-normal text-white/85">, {age}</span>}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/85">
          <span className="flex items-center gap-0.5">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            {fame}
          </span>
          {distance !== null && (
            <span className="flex items-center gap-0.5">
              <MapPin className="size-3" />
              {distance} km
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
