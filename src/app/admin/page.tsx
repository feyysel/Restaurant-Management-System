"use client";

import * as React from "react";
import {
  Store,
  Users,
  Banknote,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { StatCard, PageHeader } from "@/components/ui/stat-card";
import { TrendChart } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { useRealtime } from "@/components/realtime/use-realtime";
import { useDebouncedCallback } from "@/lib/use-debounced";

type AdminStats = {
  stats: {
    restaurantCount: number;
    userCount: number;
    revenue: number;
  };
  restaurants: {
    id: string;
    name: string;
    users: number;
    tables: number;
    menuItems: number;
    revenue: number;
    createdAt: string;
  }[];
  trend: { labels: string[]; revenue: number[] };
};

export default function AdminOverview() {
  const [data, setData] = React.useState<AdminStats | null>(null);

  async function refreshNow() {
    const res = await fetch("/api/admin/stats");
    if (res.ok) setData(await res.json());
  }
  const refresh = useDebouncedCallback(refreshNow, 250);

  useRealtime([{ scope: "admin" }], () => {
    refresh();
  });

  React.useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const todayRevenue = data.trend.revenue[data.trend.revenue.length - 1] ?? 0;
  const yesterdayRevenue = data.trend.revenue[data.trend.revenue.length - 2] ?? 0;
  const delta =
    yesterdayRevenue > 0
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
      : 0;

  return (
    <div>
      <PageHeader
        title="System Overview"
        description="A live pulse across every restaurant on the platform."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Restaurants"
          value={data.stats.restaurantCount}
          sub="active venues"
          icon={Store}
          tone="gold"
          delay={0}
        />
        <StatCard
          label="Users"
          value={data.stats.userCount}
          sub="across all roles"
          icon={Users}
          tone="sky"
          delay={0.06}
        />
        <StatCard
          label="Revenue"
          value={formatCurrency(data.stats.revenue)}
          sub={
            <span className="inline-flex items-center gap-1">
              {delta >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 text-rose-400" />
              )}
              {Math.abs(delta).toFixed(1)}% vs yesterday
            </span>
          }
          icon={Banknote}
          tone="emerald"
          delay={0.18}
        />
      </div>

      <div className="mt-4">
        <TrendChart labels={data.trend.labels} values={data.trend.revenue} />
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-gold-light" />
              Top restaurants
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {data.restaurants.map((r, i) => (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/[0.03]"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs font-bold text-gold-light">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-100">{r.name}</p>
                  <p className="text-xs text-zinc-500">
                    {r.tables} tables · {r.menuItems} items · {r.users} staff
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-zinc-100">
                    {formatCurrency(r.revenue)}
                  </p>
                </div>
              </div>
            ))}
            {data.restaurants.length === 0 && (
              <p className="py-6 text-center text-sm text-zinc-500">
                No restaurants yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
