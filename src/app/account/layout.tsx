import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ROLE_HOME } from "@/lib/constants";
import { PortalShell, type NavItem } from "@/components/portal/portal-shell";

const NAV: NavItem[] = [{ label: "My workspace", href: "/", icon: "LayoutDashboard" }];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const nav = NAV.map((item) => ({
    ...item,
    href: ROLE_HOME[session.role] ?? item.href,
  }));

  let restaurantName: string | null = null;
  if (session.restaurantId) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: session.restaurantId },
      select: { name: true },
    });
    restaurantName = restaurant?.name ?? null;
  }

  return (
    <PortalShell
      user={{
        id: session.id,
        name: session.name,
        phone: session.phone,
        role: session.role,
        restaurantId: session.restaurantId,
      }}
      restaurantName={restaurantName}
      nav={nav}
    >
      {children}
    </PortalShell>
  );
}
