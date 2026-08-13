import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/guard";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRoles(req, ["MANAGER"]);
  if ("response" in guard) return guard.response;
  const session = guard.session;

  if (!session.restaurantId) {
    return NextResponse.json(
      { error: "You are not assigned to a restaurant" },
      { status: 400 }
    );
  }

  const me = await prisma.restaurant.findUnique({
    where: { id: session.restaurantId },
    select: { id: true, parentId: true },
  });
  if (!me) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const mainId = me.parentId ?? me.id;

  const restaurants = await prisma.restaurant.findMany({
    where: {
      OR: [{ id: mainId }, { parentId: mainId }],
    },
    include: {
      _count: { select: { tables: true, menuItems: true, users: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const requests = await prisma.branchRequest.findMany({
    where: { parentRestaurantId: mainId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      status: true,
      branchId: true,
      createdAt: true,
      reviewedAt: true,
    },
  });

  return NextResponse.json({ restaurants, requests, activeRestaurantId: session.restaurantId });
}
