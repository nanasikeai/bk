"use client";

import { useEffect, useRef } from "react";

export function ArticleToc({ content }: { content: string }) {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    const article = nav?.closest(".journal-reader-layout")?.querySelector(".journal-reader-body");
    if (!nav || !article) return;

    const links = Array.from(article.querySelectorAll<HTMLElement>("h2, h3"))
      .filter((heading) => heading.textContent?.trim())
      .map((heading, index) => {
        if (!heading.id) {
          let id = `journal-section-${index + 1}`;
          while (document.getElementById(id)) id += "-heading";
          heading.id = id;
        }
        const link = document.createElement("a");
        link.href = `#${encodeURIComponent(heading.id)}`;
        link.textContent = heading.textContent;
        link.dataset.level = heading.tagName.slice(1);
        return link;
      });
    nav.replaceChildren(...links);
    return () => nav.replaceChildren();
  }, [content]);

  return (
    <aside className="journal-toc">
      <h2 id="article-toc-heading">这篇文章里</h2>
      <nav ref={navRef} className="flex flex-col gap-3.5" aria-labelledby="article-toc-heading" />
      <a href="#comments">读者评论</a>
      <span className="journal-note-label mt-3">慢慢读，不着急。</span>
    </aside>
  );
}
