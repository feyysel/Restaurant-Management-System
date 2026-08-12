import { prisma } from "@/lib/prisma";

export type Channel =
  | { scope: "restaurant"; restaurantId: string }
  | { scope: "user"; userId: string }
  | { scope: "table"; code: string }
  | { scope: "admin" };

function scopeIdFor(channel: Channel): string | null {
  switch (channel.scope) {
    case "restaurant":
      return channel.restaurantId;
    case "user":
      return channel.userId;
    case "table":
      return channel.code;
    case "admin":
      return null;
  }
}

export async function persistEvent(
  channel: Channel,
  type: string,
  payload: unknown
) {
  try {
    await prisma.eventLog.create({
      data: {
        scope: channel.scope,
        scopeId: scopeIdFor(channel),
        type,
        ...(payload == null ? {} : { payload: payload as object }),
      },
    });
  } catch (err) {
    console.error("persistEvent failed", err);
  }
}
