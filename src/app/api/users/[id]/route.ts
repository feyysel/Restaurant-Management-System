import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { requireRoles } from "@/lib/guard";
import { emitAdmin } from "@/lib/notify";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const guard = await requireRoles(req, ["ADMIN", "MANAGER"]);
  if ("response" in guard) return guard.response;
  const session = guard.session;
  const { id } = await ctx.params;

  try {
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (session.role === "MANAGER" && target.restaurantId !== session.restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (typeof body.name === "string") data.name = body.name;
    if (typeof body.phone === "string") data.phone = body.phone.trim();
    if (typeof body.password === "string" && body.password.length >= 6)
      data.passwordHash = await hashPassword(body.password);
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    if (typeof body.restaurantId === "string" && session.role === "ADMIN")
      data.restaurantId = body.restaurantId;

    const user = await prisma.user.update({ where: { id }, data });

    await emitAdmin("USER_UPDATED", { id: user.id, isActive: user.isActive });
    return NextResponse.json({ user });
  } catch (err) {
    console.error("update user error", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  const guard = await requireRoles(req, ["ADMIN", "MANAGER"]);
  if ("response" in guard) return guard.response;
  const session = guard.session;
  const { id } = await ctx.params;

  try {
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (target.role === "ADMIN") {
      return NextResponse.json({ error: "Cannot delete an admin account" }, { status: 400 });
    }
    if (session.role === "MANAGER" && target.restaurantId !== session.restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });
    await emitAdmin("USER_DELETED", { id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete user error", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
