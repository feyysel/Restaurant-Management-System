"use client";

import * as React from "react";
import { Users, Plus, Trash2, UserRound, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Skeleton, Avatar } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { roleLabel } from "@/lib/constants";
import { useFetch } from "@/lib/use-fetch";

type User = {
  id: string;
  name: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  restaurantId: string | null;
  restaurantName: string | null;
};

type Restaurant = {
  id: string;
  name: string;
};

const ROLE_TONE: Record<string, "gold" | "sky" | "violet" | "emerald"> = {
  ADMIN: "gold",
  MANAGER: "sky",
  KITCHEN: "violet",
  WAITER: "emerald",
};

export default function AdminUsers() {
  const { data, loading, refresh } = useFetch<{ users: User[] }>("/api/users");
  const restaurants = useFetch<{ restaurants: Restaurant[] }>("/api/restaurants");

  const [modal, setModal] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState("WAITER");
  const [restaurantId, setRestaurantId] = React.useState("");
  const [passwordModal, setPasswordModal] = React.useState<User | null>(null);
  const [newPassword, setNewPassword] = React.useState("");
  const [deleting, setDeleting] = React.useState<User | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          password,
          role,
          restaurantId: role === "ADMIN" ? undefined : restaurantId,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      toast.success("Account created");
      setModal(false);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u: User) {
    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(u.isActive ? "Account deactivated" : "Account activated");
      refresh();
    } catch {
      toast.error("Failed to update");
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordModal || newPassword.length < 6) return;
    try {
      const res = await fetch(`/api/users/${passwordModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Password updated");
      setPasswordModal(null);
      setNewPassword("");
    } catch {
      toast.error("Failed to update password");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      const res = await fetch(`/api/users/${deleting.id}`, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      toast.success("User deleted");
      setDeleting(null);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  const staffRestaurants = restaurants.data?.restaurants ?? [];

  return (
    <div>
      <PageHeader
        title="System Users"
        description="Every account across every restaurant — admins, managers, kitchen and waiters."
        action={
          <Button onClick={() => setModal(true)}>
            <Plus className="h-4 w-4" />
            New user
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="divide-y divide-white/[0.05]">
            {data?.users.map((u) => (
              <div
                key={u.id}
                className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-white/[0.02]"
              >
                <Avatar name={u.name} className="h-10 w-10 text-xs" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-zinc-100">{u.name}</p>
                    {!u.isActive && (
                      <Badge tone="rose" className="text-[10px]">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-zinc-500">{u.phone}</p>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm text-zinc-300">{u.restaurantName ?? "—"}</p>
                  <p className="text-xs text-zinc-500">Restaurant</p>
                </div>
                <Badge tone={ROLE_TONE[u.role] ?? "zinc"}>{roleLabel(u.role)}</Badge>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setPasswordModal(u)}
                    className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-gold-light"
                    title="Reset password"
                  >
                    <KeyRound className="h-4 w-4" />
                  </button>
                  <Switch
                    checked={u.isActive}
                    onCheckedChange={() => toggleActive(u)}
                  />
                  <button
                    onClick={() => setDeleting(u)}
                    className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-rose-300"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {data?.users.length === 0 && (
              <div className="flex flex-col items-center py-16 text-center">
                <Users className="mb-3 h-8 w-8 text-zinc-600" />
                <p className="text-sm text-zinc-400">No users yet</p>
              </div>
            )}
          </div>
        </Card>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Create account"
        description="Add a user to the system. Managers can also be created here."
      >
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="u-name">Full name</Label>
              <Input id="u-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div>
              <Label htmlFor="u-phone">Phone number</Label>
              <Input id="u-phone" type="tel" inputMode="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09171234567" />
            </div>
          </div>
          <div>
            <Label htmlFor="u-password">Temporary password</Label>
            <Input id="u-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min. 6 characters" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="u-role">Role</Label>
              <Select id="u-role" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="MANAGER">Restaurant Manager</option>
                <option value="KITCHEN">Kitchen</option>
                <option value="WAITER">Waiter</option>
                <option value="ADMIN">System Admin</option>
              </Select>
            </div>
            {role === "MANAGER" || role === "KITCHEN" || role === "WAITER" ? (
              <div>
                <Label htmlFor="u-rest">Restaurant</Label>
                <Select id="u-rest" value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)} required>
                  <option value="" disabled>
                    Select…
                  </option>
                  {staffRestaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <div className="flex items-end pb-1 text-xs text-zinc-500">
                <UserRound className="mr-1.5 h-4 w-4" />
                System admins govern everything.
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create account"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={passwordModal !== null}
        onClose={() => setPasswordModal(null)}
        title={`Reset password · ${passwordModal?.name ?? ""}`}
        description="Set a new password for this account."
      >
        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <Label htmlFor="np">New password</Label>
            <Input id="np" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="min. 6 characters" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setPasswordModal(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={newPassword.length < 6}>
              Update password
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete user?"
        description={`This permanently deletes "${deleting?.name}" and all of their records.`}
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleting(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
