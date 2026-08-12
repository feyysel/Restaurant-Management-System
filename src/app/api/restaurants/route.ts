import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/guard";
import { emitAdmin } from "@/lib/notify";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRoles(req, ["ADMIN"]);
  if ("response" in guard) return guard.response;

  const restaurants = await prisma.restaurant.findMany({
    include: {
      _count: { select: { users: true, tables: true, menuItems: true, orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ restaurants });
}

export async function POST(req: Request) {
  const guard = await requireRoles(req, ["ADMIN"]);
  if ("response" in guard) return guard.response;

  try {
    const { name, address, phone } = await req.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const restaurant = await prisma.restaurant.create({
      data: { name, address: address ?? null, phone: phone ?? null },
    });

    emitAdmin("RESTAURANT_CREATED", { id: restaurant.id, name: restaurant.name });
    return NextResponse.json({ restaurant });
  } catch (err) {
    console.error("create restaurant error", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
