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
  const { data } = useFetch<InsightData>(url, [restaurantId]);

  const d = data;
  const selected = d?.restaurants.find((r) => r.id === restaurantId) ?? null;
  const best = d ? [...d.restaurants].sort((a, b) => b.revenue - a.revenue)[0] : undefined;
  const avgOrder =
    d && d.stats.orderCount > 0 ? d.stats.revenue / d.stats.orderCount : 0;

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
            {(d?.restaurants ?? []).map((r) => (
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
          {d ? (
            <p className="mt-2 font-display text-3xl font-semibold text-zinc-50">
              {formatCurrency(d.stats.revenue)}
            </p>
          ) : (
            <Skeleton className="mt-2.5 h-8 w-32" />
          )}
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Avg order value</p>
            <ShoppingBag className="h-4 w-4 text-zinc-400" />
          </div>
          {d ? (
            <p className="mt-2 font-display text-3xl font-semibold text-zinc-50">
              {formatCurrency(avgOrder)}
            </p>
          ) : (
            <Skeleton className="mt-2.5 h-8 w-32" />
          )}
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Orders</p>
            <ShoppingBag className="h-4 w-4 text-zinc-400" />
          </div>
          {d ? (
            <p className="mt-2 font-display text-3xl font-semibold text-zinc-50">
              {d.stats.orderCount}
            </p>
          ) : (
            <Skeleton className="mt-2.5 h-8 w-16" />
          )}
        </Card>
        <Card className="border-emerald-500/20">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-emerald-300">
              {selected ? "Selected venue" : "Top venue"}
            </p>
            <Crown className="h-4 w-4 text-emerald-300" />
          </div>
          {d ? (
            <>
              <p className="mt-2 truncate font-display text-2xl font-semibold text-zinc-50">
                {(selected ?? best)?.name ?? "—"}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {(selected ?? best)
                  ? `${formatCurrency((selected ?? best)!.revenue)} · ${(selected ?? best)!.orders} orders`
                  : "No data"}
              </p>
            </>
          ) : (
            <>
              <Skeleton className="mt-2.5 h-7 w-40" />
              <Skeleton className="mt-2 h-3.5 w-28" />
            </>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {d ? (
            <TrendChart labels={d.trend.labels} values={d.trend.revenue} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Loading…</CardTitle>
              </CardHeader>
              <div className="flex h-44 items-end gap-2 sm:gap-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="flex-1 rounded-t-lg" style={{ height: `${40 + (i % 3) * 25}%` }} />
                ))}
              </div>
            </Card>
          )}
        </div>
        {d ? (
          <StatusBreakdown
            data={d.ordersByStatus.map((x) => ({ status: x.status, count: x._count }))}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Loading…</CardTitle>
            </CardHeader>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-5" />
              ))}
            </div>
          </Card>
        )}
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
              {!d
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-5 py-2.5">
                        <Skeleton className="h-7" />
                      </td>
                    </tr>
                  ))
                : d.restaurants.map((r) => (
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
              {d && d.restaurants.length === 0 && (
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
            <Store className="h-4 w-4 text-gold-light" />{" "}
            {d ? `${d.stats.restaurantCount} restaurants managed` : <Skeleton className="h-4 w-36" />}
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Users className="h-4 w-4 text-gold-light" />{" "}
            {d ? `${d.stats.userCount} system users` : <Skeleton className="h-4 w-32" />}
          </div>
        </Card>
      </div>
    </div>
  );
}
