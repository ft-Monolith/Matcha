import type { ReactNode } from "react";
import { MapPin, Star } from "lucide-react";
import type { ProfileDTO } from "@common/dto/profile.dto";
import { Badge } from "@shadcn/ui/badge";
import { Card, CardContent } from "@shadcn/ui/card";
import { cn } from "@shadcn/lib/utils";
import { GENDER_LABEL, PREF_LABEL } from "@web/component/fields/labels";
import { usePresence } from "@web/component/PresenceIndicator";
import { ImageCarousel } from "@web/component/ImageCarousel";

function ageFrom(birthdate: string): number {
  const birth = new Date(birthdate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

interface ProfileCardProps {
  profile: ProfileDTO;
  actions?: ReactNode;
  /** Action ronde flottante posée en bas-droite de l'image (ex. like en consultation). */
  floatingAction?: ReactNode;
  fill?: boolean;
}

export function ProfileCard({ profile, actions, floatingAction, fill }: ProfileCardProps) {
  const { firstName, lastName, username, gender, sexualPref, biography, birthdate, city, tags, pictures, fame } =
    profile;

  const profilePhoto = pictures.find((p) => p.isProfile);
  const ordered = profilePhoto
    ? [profilePhoto, ...pictures.filter((p) => p.id !== profilePhoto.id)]
    : pictures;
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  const presence = usePresence(profile.userId);
  const online = presence?.online ?? profile.online;

  return (
    <Card
      className={cn(
        "mx-auto w-full max-w-md gap-0 overflow-hidden border-0 p-0 pt-0 shadow-none",
        fill && "flex h-full flex-col",
      )}
    >
      <div className={cn("relative", fill && "min-h-0 flex-1")}>
        <ImageHero
          images={ordered}
          initials={initials}
          alt={username}
          online={online}
          connected={profile.likedByMe && profile.likesMe}
          likesYou={profile.likesMe}
          name={firstName}
          age={birthdate ? ageFrom(birthdate) : null}
          city={city}
          distance={profile.distance}
          gender={gender}
          sexualPref={sexualPref}
          fame={fame}
          fill={fill}
        />
        {floatingAction && (
          <div className="absolute right-4 -bottom-7 z-10 rounded-full ring-4 ring-white">
            {floatingAction}
          </div>
        )}
      </div>

      <CardContent
        className={cn(
          "flex flex-col gap-4 p-5",
          floatingAction && "pt-8",
          fill && "shrink-0 gap-3 py-4",
        )}
      >
        {biography && (
          <p
            className={cn(
              "text-sm leading-relaxed whitespace-pre-wrap",
              fill && "line-clamp-2",
            )}
          >
            {biography}
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <Badge key={t.id} variant="outline" className="font-normal">
                #{t.name}
              </Badge>
            ))}
          </div>
        )}

        {actions && <div className="flex w-full flex-col gap-2 pt-1">{actions}</div>}
      </CardContent>
    </Card>
  );
}

function OverlayBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/15 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
      {children}
    </span>
  );
}

interface ImageHeroProps {
  images: { id: string; url: string }[];
  initials: string;
  alt: string;
  online: boolean;
  connected: boolean;
  likesYou: boolean;
  name: string;
  age: number | null;
  city: string | null;
  distance: number | null;
  gender: ProfileDTO["gender"];
  sexualPref: ProfileDTO["sexualPref"];
  fame: number;
  fill?: boolean;
}

function ImageHero({
  images,
  initials,
  alt,
  online,
  connected,
  likesYou,
  name,
  age,
  city,
  distance,
  gender,
  sexualPref,
  fame,
  fill,
}: ImageHeroProps) {
  return (
    <ImageCarousel
      images={images}
      alt={alt}
      className={fill ? "aspect-auto h-full" : undefined}
      fallback={
        <span className="text-muted-foreground text-5xl font-semibold">{initials || "?"}</span>
      }
      overlay={
        <>
          {(connected || likesYou) && (
            <div className="absolute top-3 left-3">
              {connected ? (
                <Badge className="border-0 bg-green-600 text-white shadow-md hover:bg-green-600">
                  💚 Connected
                </Badge>
              ) : (
                <Badge className="border-0 bg-pink-500 text-white shadow-md hover:bg-pink-500">
                  Likes you
                </Badge>
              )}
            </div>
          )}

          <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <span
              className={
                "size-2 rounded-full " + (online ? "bg-green-400" : "bg-white/50")
              }
            />
            {online ? "Online" : "Offline"}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/30 to-transparent px-4 pt-14 pb-5">
            <h1 className="text-2xl font-bold text-white drop-shadow-sm">
              {name}
              {age != null && <span className="font-medium text-white/85">, {age}</span>}
            </h1>
            {(city || distance != null) && (
              <p className="mt-0.5 flex items-center gap-1 text-sm text-white/85">
                <MapPin className="size-3.5" />
                {city}
                {distance != null && (
                  <span className="text-white/70">
                    {city ? " · " : ""}
                    {distance} km away
                  </span>
                )}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {gender && <OverlayBadge>{GENDER_LABEL[gender]}</OverlayBadge>}
              <OverlayBadge>{PREF_LABEL[sexualPref]}</OverlayBadge>
              <OverlayBadge>
                <Star className="size-3 fill-amber-400 text-amber-400" />
                {fame}
              </OverlayBadge>
            </div>
          </div>
        </>
      }
    />
  );
}
