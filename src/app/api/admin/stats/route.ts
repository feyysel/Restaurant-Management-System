import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/guard";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRoles(req, ["ADMIN"]);
  if ("response" in guard) return guard.response;

  const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    restaurantCount,
    userCount,
    orderCount,
    revenueAgg,
    ordersByStatus,
    recentOrders,
    restaurants,
    revenueByRestaurant,
    trendOrders,
  ] = await Promise.all([
    prisma.restaurant.count(),
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { notIn: ["CANCELLED"] } },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { restaurant: { select: { name: true } }, items: true },
    }),
    prisma.restaurant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true, tables: true, menuItems: true, orders: true } },
      },
    }),
    prisma.order.groupBy({
      by: ["restaurantId"],
      where: { status: { notIn: ["CANCELLED"] } },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo }, status: { notIn: ["CANCELLED"] } },
      select: { createdAt: true, total: true },
    }),
  ]);

  const revenueByRestaurantMap = new Map(
    revenueByRestaurant.map((r) => [r.restaurantId, r._sum.total ?? 0])
  );

  const dayLabels: string[] = [];
  const dayRevenue: number[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    dayLabels.push(label);
    const dayTotal = trendOrders
      .filter((o) => new Date(o.createdAt).toDateString() === d.toDateString())
      .reduce((s, o) => s + o.total, 0);
    dayRevenue.push(Math.round(dayTotal * 100) / 100);
  }

  return NextResponse.json({
    stats: {
      restaurantCount,
      userCount,
      orderCount,
      revenue: revenueAgg._sum.total ?? 0,
    },
    ordersByStatus,
    recentOrders,
    restaurants: restaurants.map((r) => ({
      id: r.id,
      name: r.name,
      users: r._count.users,
      tables: r._count.tables,
      menuItems: r._count.menuItems,
      orders: r._count.orders,
      revenue: revenueByRestaurantMap.get(r.id) ?? 0,
      createdAt: r.createdAt,
    })),
    trend: { labels: dayLabels, revenue: dayRevenue },
  });
}
