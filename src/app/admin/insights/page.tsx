"use client";

import * as React from "react";
import { BarChart3, Banknote, ShoppingBag, Store, Users, Crown } from "lucide-react";
import { PageHeader } from "@/components/ui/stat-card";
import { TrendChart, StatusBreakdown } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useFetch } from "@/lib/use-fetch";

type InsightData = {
  stats: { restaurantCount: number; userCount: number; orderCount: number; revenue: number };
  ordersByStatus: { status: string; _count: number }[];
  restaurants: {
    id: string;
    name: string;
    parentId: string | null;
    parentName: string | null;
    users: number;
    tables: number;
    menuItems: number;
    orders: number;
    revenue: number;
    createdAt: string;
  }[];
  trend: { labels: string[]; revenue: number[] };
};

export default function AdminInsights() {
  const [restaurantId, setRestaurantId] = React.useState<string>("");
  const url = React.useMemo(
    () => `/api/admin/stats${restaurantId ? `?restaurantId=${encodeURIComponent(restaurantId)}` : ""}`,
    [restaurantId]
  );
  const { data, loading } = useFetch<InsightData>(url, [restaurantId]);

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  const selected = data.restaurants.find((r) => r.id === restaurantId) ?? null;
  const best = [...data.restaurants].sort((a, b) => b.revenue - a.revenue)[0];
  const avgOrder =
    data.stats.orderCount > 0 ? data.stats.revenue / data.stats.orderCount : 0;

  return (
    <div>
      <PageHeader
        title="System Insights"
        description={
          selected
            ? `Analytics for ${selected.name}.`
            : "Deep analytics across the entire platform."
        }
        action={
          <Select
            value={restaurantId}
            onChange={(e) => setRestaurantId(e.target.value)}
            className="w-64"
            aria-label="Filter by venue"
          >
            <option value="">All venues</option>
            {data.restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.parentId ? `Branch · ${r.name}` : `Main · ${r.name}`}
              </option>
            ))}
          </Select>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-gold/[0.14] to-transparent ring-1 ring-gold/20">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-gold-light">Lifetime revenue</p>
            <Banknote className="h-4 w-4 text-gold-light" />
          </div>
          <p className="mt-2 font-display text-3xl font-semibold text-zinc-50">
            {formatCurrency(data.stats.revenue)}
          </p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Avg order value</p>
            <ShoppingBag className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="mt-2 font-display text-3xl font-semibold text-zinc-50">
            {formatCurrency(avgOrder)}
          </p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Orders</p>
            <ShoppingBag className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="mt-2 font-display text-3xl font-semibold text-zinc-50">
            {data.stats.orderCount}
          </p>
        </Card>
        <Card className="border-emerald-500/20">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-emerald-300">
              {selected ? "Selected venue" : "Top venue"}
            </p>
            <Crown className="h-4 w-4 text-emerald-300" />
          </div>
          <p className="mt-2 truncate font-display text-2xl font-semibold text-zinc-50">
            {(selected ?? best)?.name ?? "—"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {(selected ?? best)
              ? `${formatCurrency((selected ?? best)!.revenue)} · ${(selected ?? best)!.orders} orders`
              : "No data"}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrendChart labels={data.trend.labels} values={data.trend.revenue} />
        </div>
        <StatusBreakdown
          data={data.ordersByStatus.map((d) => ({ status: d.status, count: d._count }))}
        />
      </div>

      <Card className="mt-4 overflow-hidden p-0">
        <CardHeader className="px-5 pt-5">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-gold-light" />
            Venue leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-5 py-3 font-medium">Venue</th>
                <th className="px-3 py-3 font-medium">Staff</th>
                <th className="px-3 py-3 font-medium">Tables</th>
                <th className="px-3 py-3 font-medium">Menu</th>
                <th className="px-3 py-3 font-medium">Orders</th>
                <th className="px-5 py-3 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.restaurants.map((r) => (
                <tr
                  key={r.id}
                  className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.02] ${
                    r.id === restaurantId ? "bg-gold/[0.06]" : ""
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-zinc-100">{r.name}</p>
                      {r.parentId && <Badge tone="violet">Branch</Badge>}
                      {!r.parentId && <Badge tone="gold">Main</Badge>}
                    </div>
                    {r.parentId && (
                      <p className="mt-0.5 text-xs text-zinc-500">under {r.parentName}</p>
                    )}
                  </td>
                  <td className="px-3 py-3.5 text-zinc-400">{r.users}</td>
                  <td className="px-3 py-3.5 text-zinc-400">{r.tables}</td>
                  <td className="px-3 py-3.5 text-zinc-400">{r.menuItems}</td>
                  <td className="px-3 py-3.5 text-zinc-400">{r.orders}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-gold-light">
                    {formatCurrency(r.revenue)}
                  </td>
                </tr>
              ))}
              {data.restaurants.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-zinc-500">
                    No venues yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Store className="h-4 w-4 text-gold-light" /> {data.stats.restaurantCount} restaurants managed
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Users className="h-4 w-4 text-gold-light" /> {data.stats.userCount} system users
          </div>
        </Card>
      </div>
    </div>
  );
}
