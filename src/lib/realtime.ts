import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";

export type Channel =
  | { scope: "restaurant"; restaurantId: string }
  | { scope: "user"; userId: string }
  | { scope: "table"; code: string }
  | { scope: "admin" };

export type RealtimeEvent = {
  id: string;
  channel: Channel;
  type: string;
  payload: unknown;
  createdAt: number;
};

const bus = new EventEmitter();
bus.setMaxListeners(0);

export function emit(channel: Channel, type: string, payload: unknown) {
  const event: RealtimeEvent = {
    id: randomUUID(),
    channel,
    type,
    payload,
    createdAt: Date.now(),
  };
  bus.emit("event", event);
  return event;
}

export function subscribe(listener: (event: RealtimeEvent) => void) {
  bus.on("event", listener);
  return () => bus.off("event", listener);
}

export function eventMatches(event: RealtimeEvent, channels: Channel[]) {
  return channels.some((c) => {
    if (c.scope === "restaurant" && event.channel.scope === "restaurant")
      return event.channel.restaurantId === c.restaurantId;
    if (c.scope === "user" && event.channel.scope === "user")
      return event.channel.userId === c.userId;
    if (c.scope === "table" && event.channel.scope === "table")
      return event.channel.code === c.code;
    if (c.scope === "admin" && event.channel.scope === "admin") return true;
    return false;
  });
}
