import { $presence, $use } from "@web/observables/observables";
import { cn } from "@shadcn/lib/utils";

export function usePresence(userId: string) {
  const all = $use($presence);
  return all[userId];
}

export function PresenceDot({
  userId,
  fallbackOnline,
  className,
}: {
  userId: string;
  fallbackOnline?: boolean;
  className?: string;
}) {
  const presence = usePresence(userId);
  const online = presence?.online ?? fallbackOnline ?? false;
  return (
    <span
      className={cn(
        "block size-3.5 rounded-full border-2 border-background",
        online ? "bg-green-500" : "bg-muted-foreground/40",
        className,
      )}
      title={online ? "Online" : "Offline"}
    />
  );
}

export function PresenceText({
  userId,
  fallbackOnline,
  fallbackLastSeen,
}: {
  userId: string;
  fallbackOnline?: boolean;
  fallbackLastSeen?: string | null;
}) {
  const presence = usePresence(userId);
  const online = presence?.online ?? fallbackOnline ?? false;
  const lastSeen = presence?.lastSeen ?? fallbackLastSeen ?? null;

  if (online) {
    return <span className="text-sm font-medium text-green-600">Online</span>;
  }
  if (lastSeen) {
    return (
      <span className="text-muted-foreground text-sm">
        Last seen {new Date(lastSeen).toLocaleString()}
      </span>
    );
  }
  return null;
}
