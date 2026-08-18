import type { ProfilePreviewDTO } from "@common/dto/profile.dto";
import { Avatar, AvatarImage, AvatarFallback } from "@shadcn/ui/avatar";
import { Card } from "@shadcn/ui/card";
import { PresenceDot } from "@web/component/PresenceIndicator";

interface CompactProfileCardProps {
  profile: ProfilePreviewDTO;
  onClick?: () => void;
}

export function CompactProfileCard({ profile, onClick }: CompactProfileCardProps) {
  const { firstName, age, photo, userId, online, fame } = profile;
  const initials = firstName[0]?.toUpperCase() ?? "?";

  return (
    <Card
      onClick={onClick}
      className="flex cursor-pointer flex-col items-center gap-2 p-4 transition-colors hover:bg-accent"
    >
      <div className="relative">
        <Avatar className="size-20">
          {photo && <AvatarImage src={photo} alt={firstName} />}
          <AvatarFallback className="text-xl">{initials}</AvatarFallback>
        </Avatar>
        <PresenceDot
          userId={userId}
          fallbackOnline={online}
          className="absolute right-0 bottom-0 size-4"
        />
      </div>
      <p className="text-sm font-medium">
        {firstName}
        {age !== null && <span className="text-muted-foreground">, {age}</span>}
      </p>
      <p className="text-muted-foreground text-xs">⭐ {fame}</p>
    </Card>
  );
}
