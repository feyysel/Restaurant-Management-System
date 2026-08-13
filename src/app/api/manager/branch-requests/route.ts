import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/guard";
import { emitAdmin } from "@/lib/notify";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const guard = await requireRoles(req, ["MANAGER"]);
  if ("response" in guard) return guard.response;
  const session = guard.session;

  if (!session.restaurantId) {
    return NextResponse.json(
      { error: "You are not assigned to a restaurant" },
      { status: 400 }
    );
  }

  try {
    const me = await prisma.restaurant.findUnique({
      where: { id: session.restaurantId },
      select: { id: true, parentId: true },
    });
    if (!me) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }
    const mainId = me.parentId ?? me.id;

    const { name, address, phone } = await req.json();
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Branch name is required" }, { status: 400 });
    }

    const request = await prisma.branchRequest.create({
      data: {
        name: name.trim(),
        address: typeof address === "string" ? address.trim() || null : null,
        phone: typeof phone === "string" ? phone.trim() || null : null,
        requestedById: session.id,
        parentRestaurantId: mainId,
      },
    });

    await emitAdmin("BRANCH_REQUEST_NEW", {
      id: request.id,
      name: request.name,
    });

    return NextResponse.json({ request }, { status: 201 });
  } catch (err) {
    console.error("create branch request error", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
