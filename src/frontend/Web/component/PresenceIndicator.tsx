import { $presence, $use } from "@web/observables/observables";
import { cn } from "@shadcn/lib/utils";

export function usePresence(userId: string) {
  const all = $use($presence);
  return all[userId];
}

export function PresenceDot({ userId, className }: { userId: string; className?: string }) {
  const presence = usePresence(userId);
  const online = presence?.online ?? false;
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

export function PresenceText({ userId }: { userId: string }) {
  const presence = usePresence(userId);
  if (presence?.online) {
    return <span className="text-sm font-medium text-green-600">Online</span>;
  }
  if (presence?.lastSeen) {
    return (
      <span className="text-muted-foreground text-sm">
        Last seen {new Date(presence.lastSeen).toLocaleString()}
      </span>
    );
  }
  return null;
}
