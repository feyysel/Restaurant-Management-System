"use client";

import * as React from "react";
import { Check, X, Store, Clock, User } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { useFetch } from "@/lib/use-fetch";
import { useRealtime } from "@/components/realtime/use-realtime";
import { useDebouncedCallback } from "@/lib/use-debounced";

type AdminBranchRequest = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  reviewedAt: string | null;
  requestedBy: { id: string; name: string; phone: string };
  parentRestaurant: { id: string; name: string };
};

const STATUS_TONE: Record<string, "amber" | "emerald" | "rose" | "zinc"> = {
  PENDING: "amber",
  APPROVED: "emerald",
  REJECTED: "rose",
};

export default function AdminBranchRequests() {
  const { data, loading, refresh } = useFetch<{ requests: AdminBranchRequest[] }>(
    "/api/admin/branch-requests"
  );
  const [busy, setBusy] = React.useState<string | null>(null);
  const refreshDebounced = useDebouncedCallback(refresh, 250);

  useRealtime([{ scope: "admin" }], () => refreshDebounced());

  async function review(id: string, action: "approve" | "reject") {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/branch-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      toast.success(action === "approve" ? "Branch approved" : "Request rejected");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  const pending = data?.requests.filter((r) => r.status === "PENDING") ?? [];
  const reviewed = data?.requests.filter((r) => r.status !== "PENDING") ?? [];

  return (
    <div>
      <PageHeader
        title="Branch Requests"
        description="Managers request new branches — approve them to create the restaurant, or reject."
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          <h2 className="mb-3 font-display text-lg font-semibold text-zinc-100">
            Awaiting review
          </h2>
          <div className="space-y-3">
            {pending.map((r) => (
              <Card key={r.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/25">
                  <Store className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-zinc-100">{r.name}</p>
                    <Badge tone="amber">
                      <Clock className="h-3 w-3" /> Pending
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
                    {r.address ?? "No address"}
                    {r.phone ? ` · ${r.phone}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                    <span className="inline-flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-gold-light/70" />
                      {r.requestedBy.name} ({r.requestedBy.phone})
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Store className="h-3.5 w-3.5 text-gold-light/70" />
                      under {r.parentRestaurant.name}
                    </span>
                    <span>· {formatDate(r.createdAt)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => review(r.id, "approve")}
                    disabled={busy === r.id}
                  >
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => review(r.id, "reject")}
                    disabled={busy === r.id}
                  >
                    <X className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </Card>
            ))}
            {pending.length === 0 && (
              <Card className="flex flex-col items-center justify-center py-14 text-center">
                <Check className="mb-3 h-8 w-8 text-zinc-600" />
                <p className="text-sm text-zinc-400">No branch requests awaiting review</p>
              </Card>
            )}
          </div>

          <h2 className="mb-3 mt-8 font-display text-lg font-semibold text-zinc-100">
            History
          </h2>
          <div className="space-y-2">
            {reviewed.map((r) => (
              <Card key={r.id} className="flex items-center gap-4 px-5 py-4 opacity-80">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-200">{r.name}</p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {r.requestedBy.name} · under {r.parentRestaurant.name}
                    {r.reviewedAt ? ` · reviewed ${formatDate(r.reviewedAt)}` : ""}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[r.status] ?? "zinc"}>{r.status}</Badge>
              </Card>
            ))}
            {reviewed.length === 0 && (
              <p className="py-6 text-center text-sm text-zinc-500">No reviewed requests yet</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
