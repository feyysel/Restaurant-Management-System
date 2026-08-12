import type { Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { emit } from "@/lib/realtime";

type NotifyInput = {
  userId?: string;
  role?: Role;
  restaurantId: string;
  type: string;
  title: string;
  body: string;
  orderId?: string;
  tableId?: string;
};

export async function notify(input: NotifyInput) {
  const { userId, role, restaurantId, ...rest } = input;

  const notif = await prisma.notification.create({
    data: {
      userId: userId ?? null,
      role: role ?? null,
      restaurantId,
      ...rest,
    },
  });

  const channel = userId
    ? ({ scope: "user", userId } as const)
    : role
      ? ({ scope: "restaurant", restaurantId } as const)
      : ({ scope: "restaurant", restaurantId } as const);

  emit(channel, input.type, {
    id: notif.id,
    title: notif.title,
    body: notif.body,
    type: notif.type,
    orderId: notif.orderId ?? null,
    tableId: notif.tableId ?? null,
    createdAt: notif.createdAt.toISOString(),
  });

  return notif;
}

export function emitToTable(
  code: string,
  type: string,
  payload: unknown
) {
  emit({ scope: "table", code }, type, payload);
}

export function emitAdmin(type: string, payload: unknown) {
  emit({ scope: "admin" }, type, payload);
}
