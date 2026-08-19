import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "../config/env";
import { verifyAccessToken } from "../jwt";
import { ACCESS_COOKIE } from "../cookies";
import type { UserRepository } from "../../database/repositories/user.repository";
import { RealtimeService } from "./realtime.service";
import { PresenceService } from "./presence.service";

export interface Realtime {
  realtime: RealtimeService;
  presence: PresenceService;
}

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const val = part.slice(eq + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  }
  return out;
}

export function setupRealtime(
  httpServer: HttpServer,
  users: UserRepository,
): Realtime {
  const io = new Server(httpServer, {
    cors: { origin: env.appUrl, credentials: true },
  });

  const presence = new PresenceService(io, users);

  io.use((socket, next) => {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    const token = cookies[ACCESS_COOKIE];
    if (!token) return next(new Error("unauthorized"));
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    socket.join(userId);
    presence.onConnect(userId);
    console.log(`[ws] connect user=${userId} socket=${socket.id}`);

    socket.on("disconnect", (reason) => {
      void presence.onDisconnect(userId);
      console.log(
        `[ws] disconnect user=${userId} socket=${socket.id} (${reason})`,
      );
    });
  });

  return { realtime: new RealtimeService(io), presence };
}
