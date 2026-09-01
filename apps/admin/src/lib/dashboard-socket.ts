import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

let dashboardSocket: Socket | null = null;

export function getDashboardSocket(): Socket {
  if (!dashboardSocket) {
    dashboardSocket = io(`${API_URL}/dashboard`, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
  }
  return dashboardSocket;
}
