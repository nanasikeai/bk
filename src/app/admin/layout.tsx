import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { LogoutButton } from "@/components/logout-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/login?redirect=" + encodeURIComponent("/admin"));
  }

  return (
    <div className="min-h-screen flex">
      <aside className="relative w-64 shrink-0 flex flex-col border-r bg-muted/30 px-6 py-6">
        <div className="mb-8">
          <h2 className="font-bold text-xl">管理后台</h2>
        </div>
        <AdminNav />
        <div className="mt-auto pt-6 space-y-2">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors block"
          >
            查看网站
          </Link>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="px-8 lg:px-12 py-8 lg:py-10 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
