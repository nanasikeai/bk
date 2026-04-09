"use client";

import "highlight.js/styles/github-dark.css";
import { useEffect, useRef } from "react";
import hljs from "highlight.js";
import { cn } from "@/lib/utils";

interface HtmlRendererProps {
  content: string;
  className?: string;
}

export function HtmlRenderer({ content, className }: HtmlRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const blocks = containerRef.current.querySelectorAll("pre[data-language]");
    blocks.forEach((block) => {
      const lang = block.getAttribute("data-language") || "";
      if (lang && lang !== "plain") {
        block.classList.add("hljs");
        try {
          const result = hljs.highlight(block.textContent || "", {
            language: lang,
          });
          block.innerHTML = result.value;
        } catch {
          hljs.highlightElement(block as HTMLElement);
        }
      }
    });
  }, [content]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "prose prose-zinc dark:prose-invert max-w-none",
        "prose-headings:scroll-mt-14",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        "prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
        "prose-pre:bg-muted prose-pre:border",
        className
      )}
      dangerouslySetInnerHTML={{ __html: content || "" }}
    />
  );
}
