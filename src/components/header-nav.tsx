"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/posts", label: "文章" },
  { href: "/categories", label: "分类" },
  { href: "/tags", label: "标签" },
];

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "transition-colors",
              isActive
                ? "text-blue-600 dark:text-blue-400 font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
