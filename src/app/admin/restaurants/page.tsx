"use client";

import * as React from "react";
import { Store, Plus, Trash2, Pencil, Users, Grid3X3, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { useFetch } from "@/lib/use-fetch";

type Restaurant = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  createdAt: string;
  _count: { users: number; tables: number; menuItems: number };
};

export default function AdminRestaurants() {
  const { data, loading, refresh } = useFetch<{ restaurants: Restaurant[] }>(
    "/api/restaurants"
  );
  const [modal, setModal] = React.useState<null | { mode: "create" } | { mode: "edit"; r: Restaurant }>(null);
  const [deleting, setDeleting] = React.useState<Restaurant | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [phone, setPhone] = React.useState("");

  function openCreate() {
    setName("");
    setAddress("");
    setPhone("");
    setModal({ mode: "create" });
  }

  function openEdit(r: Restaurant) {
    setName(r.name);
    setAddress(r.address ?? "");
    setPhone(r.phone ?? "");
    setModal({ mode: "edit", r });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal?.mode === "create") {
        const res = await fetch("/api/restaurants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, address, phone }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? "Failed");
        toast.success("Restaurant created");
      } else if (modal?.mode === "edit") {
        const res = await fetch(`/api/restaurants/${modal.r.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, address, phone }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? "Failed");
        toast.success("Restaurant updated");
      }
      setModal(null);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      const res = await fetch(`/api/restaurants/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Restaurant deleted");
      setDeleting(null);
      refresh();
    } catch {
      toast.error("Failed to delete");
    }
  }

  return (
    <div>
      <PageHeader
        title="Restaurants"
        description="Every venue on the platform — create and manage restaurant spaces."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New restaurant
          </Button>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.restaurants.map((r) => (
            <Card key={r.id} className="group relative overflow-hidden transition-all hover:border-gold/30">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 text-gold-light ring-1 ring-gold/25">
                  <Store className="h-6 w-6" />
                </div>
                <Badge tone="emerald" className="opacity-0 transition-opacity group-hover:opacity-100">
                  Active
                </Badge>
              </div>
              <h3 className="font-display text-xl font-semibold text-zinc-50">{r.name}</h3>
              <p className="mt-1 line-clamp-1 text-sm text-zinc-500">
                {r.address ?? "No address"} {r.phone ? `· ${r.phone}` : ""}
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {[
                  { icon: Users, label: "Staff", value: r._count.users },
                  { icon: Grid3X3, label: "Tables", value: r._count.tables },
                  { icon: UtensilsCrossed, label: "Menu", value: r._count.menuItems },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl bg-white/[0.04] px-2.5 py-2.5 text-center">
                    <m.icon className="mx-auto mb-1 h-4 w-4 text-gold-light/70" />
                    <p className="text-sm font-semibold text-zinc-100">{m.value}</p>
                    <p className="text-[10px] uppercase tracking-wide text-zinc-500">{m.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
                <p className="text-xs text-zinc-500">
                  Since {formatDate(r.createdAt)}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(r)}
                    className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-gold-light"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleting(r)}
                    className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-rose-300"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
          {data?.restaurants.length === 0 && (
            <Card className="flex flex-col items-center justify-center py-16 text-center sm:col-span-2 lg:col-span-3">
              <Store className="mb-3 h-8 w-8 text-zinc-600" />
              <p className="text-sm text-zinc-400">No restaurants yet</p>
              <Button className="mt-4" onClick={openCreate} size="sm">
                <Plus className="h-4 w-4" /> Create your first
              </Button>
            </Card>
          )}
        </div>
      )}

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.mode === "create" ? "New restaurant" : "Edit restaurant"}
        description="Restaurant details shown across the platform."
      >
        <form onSubmit={save} className="space-y-4">
          <div>
            <Label htmlFor="r-name">Name</Label>
            <Input id="r-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="The Golden Fork" />
          </div>
          <div>
            <Label htmlFor="r-address">Address</Label>
            <Textarea id="r-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="42 Bistro Avenue" />
          </div>
          <div>
            <Label htmlFor="r-phone">Phone</Label>
            <Input id="r-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 012-3456" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete restaurant?"
        description={`This permanently deletes "${deleting?.name}" and all of its data. This cannot be undone.`}
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleting(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            <Trash2 className="h-4 w-4" /> Delete forever
          </Button>
        </div>
      </Modal>
    </div>
  );
}
