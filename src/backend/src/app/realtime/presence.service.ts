import type { Server } from "socket.io";
import type { UserRepository } from "../../database/repositories/user.repository";

export class PresenceService {
  private readonly counts = new Map<string, number>();

  constructor(
    private readonly io: Server,
    private readonly users: UserRepository,
  ) {}

  isOnline(userId: string): boolean {
    return (this.counts.get(userId) ?? 0) > 0;
  }

  onConnect(userId: string): void {
    const next = (this.counts.get(userId) ?? 0) + 1;
    this.counts.set(userId, next);
    if (next === 1) this.broadcast(userId, true, null);
  }

  async onDisconnect(userId: string): Promise<void> {
    const next = (this.counts.get(userId) ?? 1) - 1;
    if (next > 0) {
      this.counts.set(userId, next);
      return;
    }
    this.counts.delete(userId);
    const lastSeen = await this.users.touchLastSeen(userId);
    this.broadcast(
      userId,
      false,
      lastSeen ? lastSeen.toISOString() : new Date().toISOString(),
    );
  }

  private broadcast(
    userId: string,
    online: boolean,
    lastSeen: string | null,
  ): void {
    this.io.emit("presence", { userId, online, lastSeen });
  }
}
