import type { Server } from "socket.io";

export class RealtimeService {
  constructor(private readonly io: Server) {}

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.io.to(userId).emit(event, payload);
  }
}
