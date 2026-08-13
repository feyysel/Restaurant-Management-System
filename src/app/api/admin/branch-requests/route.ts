import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/guard";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRoles(req, ["ADMIN"]);
  if ("response" in guard) return guard.response;

  const requests = await prisma.branchRequest.findMany({
    include: {
      requestedBy: { select: { id: true, name: true, phone: true } },
      parentRestaurant: { select: { id: true, name: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ requests });
}
