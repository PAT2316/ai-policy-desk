import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/session";
import { getOrgContext } from "@/lib/orgContext";
import { prisma } from "@/lib/prisma";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/ai-tools", label: "Outils d'IA" },
  { href: "/use-cases", label: "Cas d'usage" },
  { href: "/policies", label: "Politiques" },
  { href: "/documents", label: "Documents" },
  { href: "/training", label: "Formations" },
  { href: "/incidents", label: "Incidents" },
  { href: "/actions", label: "Actions" },
  { href: "/reports", label: "Rapports" },
  { href: "/admin/organization", label: "Administration" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Si l'utilisateur n'appartient encore à aucune organisation, direction l'onboarding
  // plutôt qu'une page cassée (cf. Phase 4 §8 — parcours d'onboarding).
  let orgName = "";
  try {
    const ctx = await getOrgContext();
    const org = await prisma.organization.findUnique({ where: { id: ctx.organizationId } });
    orgName = org?.name ?? "";
  } catch {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="px-5 py-5 border-b">
          <p className="font-semibold text-sm">AI Policy Desk</p>
          <p className="text-xs text-gray-500 truncate">{orgName}</p>
        </div>
        <nav className="flex-1 py-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-5 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t text-xs text-gray-500">
          Connecté en tant que <span className="font-medium">{session.user.name}</span>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
