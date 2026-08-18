import type { ReactNode } from "react";
import type { ProfileDTO } from "@common/dto/profile.dto";
import { Avatar, AvatarImage, AvatarFallback } from "@shadcn/ui/avatar";
import { Badge } from "@shadcn/ui/badge";
import { Card, CardContent } from "@shadcn/ui/card";
import { Separator } from "@shadcn/ui/separator";
import { GENDER_LABEL, PREF_LABEL } from "@web/component/fields/labels";
import { PresenceDot, PresenceText } from "@web/component/PresenceIndicator";

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
  // bouton contextuel surtout pour le cas edit
  actions?: ReactNode;
}

export function ProfileCard({ profile, actions }: ProfileCardProps) {
  const { firstName, lastName, username, gender, sexualPref, biography, birthdate, city, tags, pictures } =
    profile;

  const profilePhoto = pictures.find((p) => p.isProfile) ?? pictures[0];
  const gallery = pictures.filter((p) => p.id !== profilePhoto?.id);
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardContent className="flex flex-col items-center gap-4 pt-6">
        <div className="relative">
          <Avatar className="size-28">
            {profilePhoto && <AvatarImage src={profilePhoto.url} alt={username} />}
            <AvatarFallback className="text-2xl">{initials || "?"}</AvatarFallback>
          </Avatar>
          <PresenceDot userId={profile.userId} className="absolute right-1 bottom-1 size-5" />
        </div>

        <div className="text-center">
          <h1 className="text-xl font-semibold">
            {firstName} {lastName}
            {birthdate && <span className="text-muted-foreground">, {ageFrom(birthdate)}</span>}
          </h1>
          <p className="text-muted-foreground text-sm">@{username}</p>
          <PresenceText userId={profile.userId} />
          {city && <p className="text-muted-foreground text-sm">📍 {city}</p>}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {gender && <Badge variant="secondary">{GENDER_LABEL[gender]}</Badge>}
          <Badge variant="secondary">{PREF_LABEL[sexualPref]}</Badge>
        </div>

        {biography && (
          <>
            <Separator />
            <p className="text-center text-sm whitespace-pre-wrap">{biography}</p>
          </>
        )}

        {tags.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-wrap justify-center gap-2">
              {tags.map((t) => (
                <Badge key={t.id} variant="outline">
                  #{t.name}
                </Badge>
              ))}
            </div>
          </>
        )}

        {gallery.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-wrap justify-center gap-2">
              {gallery.map((p) => (
                <img
                  key={p.id}
                  src={p.url}
                  alt=""
                  className="size-20 rounded-md object-cover"
                />
              ))}
            </div>
          </>
        )}

        {actions && <div className="flex w-full flex-col gap-2 pt-2">{actions}</div>}
      </CardContent>
    </Card>
  );
}
