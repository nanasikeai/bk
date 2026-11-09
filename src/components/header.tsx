import Link from "next/link";
import { Box } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { SearchInput } from "./search-input";
import { HeaderNav } from "./header-nav";

export function Header() {
  return (
    <header className="journal-masthead">
      <div className="journal-shell journal-header-inner">
        <Link href="/" className="journal-brand" aria-label="boxboxs 首页">
          <Box aria-hidden="true" />
          <span>boxboxs<span className="text-primary">.</span></span>
        </Link>
        <HeaderNav />
        <div className="journal-header-actions">
          <SearchInput />
          <span className="journal-header-divider" aria-hidden="true" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
