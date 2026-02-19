import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { SearchInput } from "./search-input";
import { HeaderNav } from "./header-nav";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-6 lg:px-8">
        <Link href="/" className="mr-6 flex items-center space-x-2 shrink-0">
          <span className="font-bold text-xl">我的博客</span>
        </Link>
        <HeaderNav />
        <div className="flex items-center space-x-4 shrink-0 pl-4">
          <SearchInput />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
