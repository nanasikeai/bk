import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const buildPageUrl = (page: number) => `${basePath}${basePath.includes("?") ? "&" : "?"}page=${page}`;
  const pages = Array.from(new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages]))
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
  const linkClass = "inline-flex size-8 shrink-0 items-center justify-center rounded-sm text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2";

  return (
    <nav className="flex flex-wrap items-center justify-center gap-1.5 py-9" aria-label="文章分页">
      {currentPage > 1 ? <Link href={buildPageUrl(currentPage - 1)} className={linkClass} aria-label="上一页"><ChevronLeft className="size-4" /></Link> : <span className={`${linkClass} opacity-30`} aria-hidden="true"><ChevronLeft className="size-4" /></span>}
      {pages.map((page, index) => (
        <span key={page} className="inline-flex items-center gap-1.5">
          {index > 0 && page - pages[index - 1] > 1 && <span className="text-xs text-muted-foreground px-1" aria-hidden="true">…</span>}
          {page === currentPage ? <span className={`${linkClass} bg-muted text-primary`} aria-current="page" aria-label={`第 ${page} 页`}>{page}</span> : <Link href={buildPageUrl(page)} className={linkClass} aria-label={`第 ${page} 页`}>{page}</Link>}
        </span>
      ))}
      {currentPage < totalPages ? <Link href={buildPageUrl(currentPage + 1)} className={linkClass} aria-label="下一页"><ChevronRight className="size-4" /></Link> : <span className={`${linkClass} opacity-30`} aria-hidden="true"><ChevronRight className="size-4" /></span>}
    </nav>
  );
}
