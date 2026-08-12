import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ROLE_HOME } from "@/lib/constants";
import { PortalShell, type NavItem } from "@/components/portal/portal-shell";

const NAV: NavItem[] = [
  { label: "Overview", href: "/admin", icon: "LayoutDashboard" },
  { label: "Restaurants", href: "/admin/restaurants", icon: "Store" },
  { label: "System Users", href: "/admin/users", icon: "Users" },
  { label: "Insights", href: "/admin/insights", icon: "BarChart3" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect(ROLE_HOME[session.role] ?? "/login");

  return (
    <PortalShell
      user={{
        id: session.id,
        name: session.name,
        phone: session.phone,
        role: session.role,
        restaurantId: session.restaurantId,
      }}
      restaurantName={null}
      nav={NAV}
    >
      {children}
    </PortalShell>
  );
}
