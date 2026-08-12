import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { requireRoles } from "@/lib/guard";
import { emitAdmin } from "@/lib/notify";

export const runtime = "nodejs";

const ROLES: Record<string, string> = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  KITCHEN: "KITCHEN",
  WAITER: "WAITER",
};

export async function POST(req: Request) {
  const guard = await requireRoles(req, ["ADMIN", "MANAGER"]);
  if ("response" in guard) return guard.response;
  const session = guard.session;

  try {
    const { name, phone, password, role, restaurantId } = await req.json();

    if (!name || !phone || !password || !ROLES[role]) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (role === "MANAGER" && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can create managers" }, { status: 403 });
    }

    let targetRestaurantId: string | null;
    if (role === "ADMIN") {
      targetRestaurantId = null;
    } else if (role === "MANAGER") {
      targetRestaurantId = restaurantId ?? null;
    } else {
      targetRestaurantId = restaurantId ?? session.restaurantId;
      if (!targetRestaurantId) {
        return NextResponse.json({ error: "restaurantId is required" }, { status: 400 });
      }
    }

    const exists = await prisma.user.findUnique({
      where: { phone: phone.trim() },
    });
    if (exists) {
      return NextResponse.json({ error: "Phone number already in use" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        name,
        phone: phone.trim(),
        passwordHash: await hashPassword(password),
        role,
        restaurantId: targetRestaurantId,
      },
    });

    await emitAdmin("USER_CREATED", { id: user.id, name: user.name, role: user.role });

    return NextResponse.json({ user });
  } catch (err) {
    console.error("create user error", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const guard = await requireRoles(req, ["ADMIN", "MANAGER"]);
  if ("response" in guard) return guard.response;
  const session = guard.session;

  const users = await prisma.user.findMany({
    where: session.role === "MANAGER" ? { restaurantId: session.restaurantId } : {},
    include: { restaurant: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      restaurantId: u.restaurantId,
      restaurantName: u.restaurant?.name ?? null,
    })),
  });
}
