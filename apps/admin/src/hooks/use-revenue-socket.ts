"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Socket } from "socket.io-client";
import { getRevenueSocket } from "@/lib/socket";

export interface RevenueUpdateEvent {
  type:
    | "order_created"
    | "order_paid"
    | "order_status_changed"
    | "live_enrollment_created"
    | "live_enrollment_paid";
  payload: {
    id: number;
    status: string;
    finalAmount: string;
    createdAt: string | null;
    userId: number | null;
    userFirstName: string;
    userLastName: string;
    userEmail: string | null;
  };
  source: "recorded" | "live";
}

interface UseRevenueSocketOptions {
  onRevenueUpdate: (event: RevenueUpdateEvent) => void;
  enabled?: boolean;
}

export function useRevenueSocket({
  onRevenueUpdate,
  enabled = true,
}: UseRevenueSocketOptions) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const callbackRef = useRef(onRevenueUpdate);
  callbackRef.current = onRevenueUpdate;

  useEffect(() => {
    if (!enabled) return;

    const socket = getRevenueSocket();
    socketRef.current = socket;

    function handleRevenueUpdate(event: RevenueUpdateEvent) {
      callbackRef.current(event);
    }

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("revenue:update", handleRevenueUpdate);

    socket.connect();

    return () => {
      socket.off("revenue:update", handleRevenueUpdate);
      socket.off("connect");
      socket.off("disconnect");
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [enabled]);

  return { connected };
}
