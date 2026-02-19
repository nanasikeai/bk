"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Folder, Tag, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "仪表盘", icon: Home, iconColor: "text-blue-500" },
  { href: "/admin/posts", label: "文章管理", icon: FileText, iconColor: "text-emerald-500" },
  { href: "/admin/categories", label: "分类管理", icon: Folder, iconColor: "text-amber-500" },
  { href: "/admin/tags", label: "标签管理", icon: Tag, iconColor: "text-violet-500" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
              isActive
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon
              className={cn(
                "h-4 w-4 shrink-0",
                isActive ? "text-blue-600 dark:text-blue-400" : item.iconColor
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
