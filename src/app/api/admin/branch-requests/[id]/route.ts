import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/guard";
import { notify, emitAdmin } from "@/lib/notify";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const guard = await requireRoles(req, ["ADMIN"]);
  if ("response" in guard) return guard.response;
  const session = guard.session;
  const { id } = await ctx.params;

  try {
    const { action } = await req.json();
    const request = await prisma.branchRequest.findUnique({ where: { id } });
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    if (request.status !== "PENDING") {
      return NextResponse.json({ error: "Request already reviewed" }, { status: 400 });
    }

    if (action === "approve") {
      const { restaurant, request: updated } = await prisma.$transaction(async (tx) => {
        const restaurant = await tx.restaurant.create({
          data: {
            name: request.name,
            address: request.address,
            phone: request.phone,
            parentId: request.parentRestaurantId,
          },
        });
        const updated = await tx.branchRequest.update({
          where: { id },
          data: {
            status: "APPROVED",
            branchId: restaurant.id,
            reviewedById: session.id,
            reviewedAt: new Date(),
          },
        });
        return { restaurant, request: updated };
      });

      await notify({
        userId: request.requestedById,
        restaurantId: request.parentRestaurantId,
        type: "BRANCH_APPROVED",
        title: "Branch approved",
        body: `Your branch "${request.name}" was approved and is ready to manage.`,
      });
      await emitAdmin("BRANCH_REQUEST_RESOLVED", { id, status: "APPROVED" });

      return NextResponse.json({ restaurant, request: updated });
    }

    if (action === "reject") {
      const updated = await prisma.branchRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          reviewedById: session.id,
          reviewedAt: new Date(),
        },
      });

      await notify({
        userId: request.requestedById,
        restaurantId: request.parentRestaurantId,
        type: "BRANCH_REJECTED",
        title: "Branch request declined",
        body: `Your branch request "${request.name}" was not approved by the administrator.`,
      });
      await emitAdmin("BRANCH_REQUEST_RESOLVED", { id, status: "REJECTED" });

      return NextResponse.json({ request: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("review branch request error", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
