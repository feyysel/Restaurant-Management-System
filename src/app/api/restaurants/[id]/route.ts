import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/guard";
import { emitAdmin } from "@/lib/notify";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const guard = await requireRoles(req, ["ADMIN"]);
  if ("response" in guard) return guard.response;
  const { id } = await ctx.params;

  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (typeof body.name === "string") data.name = body.name;
    if (typeof body.address === "string") data.address = body.address;
    if (typeof body.phone === "string") data.phone = body.phone;

    const restaurant = await prisma.restaurant.update({ where: { id }, data });
    emitAdmin("RESTAURANT_UPDATED", { id });
    return NextResponse.json({ restaurant });
  } catch (err) {
    console.error("update restaurant error", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  const guard = await requireRoles(req, ["ADMIN"]);
  if ("response" in guard) return guard.response;
  const { id } = await ctx.params;

  try {
    await prisma.restaurant.delete({ where: { id } });
    emitAdmin("RESTAURANT_DELETED", { id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete restaurant error", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
