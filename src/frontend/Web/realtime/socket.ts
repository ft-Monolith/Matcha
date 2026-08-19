import { io, type Socket } from "socket.io-client";
import { API } from "@web/API/api";

export const socket: Socket = io({
  autoConnect: false,
  withCredentials: true,
});


let triedRefresh = false;

socket.on("connect", () => {
  triedRefresh = false;
});

socket.on("connect_error", async (err) => {
  if (err?.message !== "unauthorized" || triedRefresh) return;
  triedRefresh = true;
  const r = await API.auth.refresh();
  if (!r.error) {
    socket.connect();
  } else {
    socket.disconnect();
  }
});

export function connectSocket(): void {
  if (!socket.connected) socket.connect();
}

export function disconnectSocket(): void {
  if (socket.connected) socket.disconnect();
}
