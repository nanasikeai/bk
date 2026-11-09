"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowUpRight } from "lucide-react";

export function SearchInput() {
  const [query, setQuery] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (!dialogRef.current?.open) dialogRef.current?.showModal();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    dialogRef.current?.close();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <>
      <button
        type="button"
        className="journal-icon-button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label="搜索文章"
        title="搜索文章（Ctrl / ⌘ K）"
      >
        <Search aria-hidden="true" />
      </button>
      <dialog
        ref={dialogRef}
        className="journal-search-dialog"
        aria-labelledby="search-dialog-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const rect = event.currentTarget.getBoundingClientRect();
            if (event.clientX < rect.left || event.clientX > rect.right ||
                event.clientY < rect.top || event.clientY > rect.bottom) {
              event.currentTarget.close();
            }
          }
        }}
      >
        <div className="journal-search-top">
          <h2 id="search-dialog-title">在文字里找一找</h2>
          <button type="button" className="journal-icon-button" onClick={() => dialogRef.current?.close()} aria-label="关闭搜索">
            <X aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={handleSearch} className="journal-search-form">
          <label htmlFor="site-search" className="sr-only">搜索文章关键词</label>
          <Search className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />
          <input
            id="site-search"
            name="q"
            type="search"
            placeholder="文章标题、内容，或一点灵感…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            required
          />
          <button type="submit" className="journal-icon-button" aria-label="提交搜索" disabled={!query.trim()}>
            <ArrowUpRight aria-hidden="true" />
          </button>
        </form>
        <p className="journal-search-hint">输入关键词，按 Enter 搜索 · Esc 关闭</p>
      </dialog>
    </>
  );
}
