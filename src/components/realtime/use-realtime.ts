"use client";

import * as React from "react";

export type RealtimeChannel =
  | { scope: "restaurant"; id: string }
  | { scope: "user"; id: string }
  | { scope: "table"; code: string }
  | { scope: "admin" };

export type RealtimeEvent<T = unknown> = {
  id: string;
  channel: RealtimeChannel;
  type: string;
  payload: T;
  createdAt: number;
};

export function useRealtime(
  channels: RealtimeChannel[],
  onEvent?: (event: RealtimeEvent) => void
) {
  const [connected, setConnected] = React.useState(false);
  const [lastEvent, setLastEvent] = React.useState<RealtimeEvent | null>(null);
  const handlerRef = React.useRef(onEvent);

  React.useEffect(() => {
    handlerRef.current = onEvent;
  });

  const channelKey = channels
    .map((c) =>
      c.scope === "restaurant" || c.scope === "user"
        ? `${c.scope}:${c.id}`
        : c.scope === "table"
          ? `table:${c.code}`
          : "admin"
    )
    .join("|");

  React.useEffect(() => {
    const params = new URLSearchParams();
    const scopes = new Set(channels.map((c) => c.scope));
    if (scopes.has("admin")) params.set("admin", "1");
    if (scopes.has("table")) {
      const code = channels.find((c) => c.scope === "table")?.code;
      if (code) params.set("table", code);
    }
    if (scopes.has("user")) {
      const id = channels.find((c) => c.scope === "user")?.id;
      if (id) params.set("user", id);
    }
    if (scopes.has("restaurant")) {
      const id = channels.find((c) => c.scope === "restaurant")?.id;
      if (id) params.set("restaurant", id);
    }

    const es = new EventSource(`/api/events?${params.toString()}`);
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (msg) => {
      try {
        const evt = JSON.parse(msg.data) as RealtimeEvent;
        setLastEvent(evt);
        handlerRef.current?.(evt);
      } catch {
        /* ignore malformed */
      }
    };
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelKey]);

  return { connected, lastEvent };
}
