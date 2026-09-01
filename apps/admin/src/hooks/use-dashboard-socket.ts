"use client";

import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { getDashboardSocket } from "@/lib/dashboard-socket";

export type DashboardUpdateType =
  | "enrollment_created"
  | "enrollment_status_changed"
  | "order_paid"
  | "order_created"
  | "support_ticket_created"
  | "support_ticket_resolved"
  | "lead_created"
  | "student_registered"
  | "payment_completed"
  | "certificate_issued"
  | "site_visit_recorded";

export interface DashboardUpdateEvent {
  type: DashboardUpdateType;
  meta?: Record<string, unknown>;
}

interface UseDashboardSocketOptions {
  onDashboardUpdate: (event: DashboardUpdateEvent) => void;
  enabled?: boolean;
}

export function useDashboardSocket({
  onDashboardUpdate,
  enabled = true,
}: UseDashboardSocketOptions) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const callbackRef = useRef(onDashboardUpdate);
  callbackRef.current = onDashboardUpdate;

  useEffect(() => {
    if (!enabled) return;

    const socket = getDashboardSocket();
    socketRef.current = socket;

    function handleUpdate(event: DashboardUpdateEvent) {
      callbackRef.current(event);
    }

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("dashboard:update", handleUpdate);

    socket.connect();

    return () => {
      socket.off("dashboard:update", handleUpdate);
      socket.off("connect");
      socket.off("disconnect");
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [enabled]);

  return { connected };
}
