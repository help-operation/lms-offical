import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

let socket: Socket | null = null;

export function getRevenueSocket(): Socket {
  if (!socket) {
    socket = io(`${API_URL}/revenue`, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
  }
  return socket;
}
