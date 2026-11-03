"use client";

import "highlight.js/styles/github-dark.css";
import { useEffect, useRef } from "react";
import hljs from "highlight.js";
import { cn } from "@/lib/utils";

interface HtmlRendererProps {
  content: string;
  className?: string;
}

// 文章排版样式，编辑器内容区复用同一套，保证编辑与查看一致
export const articleProseClassName = cn(
  "prose prose-zinc dark:prose-invert max-w-none [overflow-wrap:anywhere]",
  "prose-headings:scroll-mt-14",
  // 收紧段落、图片间距（prose 默认段距 1.25em，回车换段显得空）
  "prose-p:my-1 prose-img:my-4",
  "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
  "prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
  "prose-pre:bg-muted prose-pre:border"
);

export function HtmlRenderer({ content, className }: HtmlRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    // 旧文章（Quill）：<pre data-language="xx">
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
    // 新文章（Tiptap）：<pre><code class="language-xx">
    containerRef.current
      .querySelectorAll<HTMLElement>('pre > code[class*="language-"]')
      .forEach((code) => {
        const lang = code.className.match(/language-([\w-]+)/)?.[1];
        if (!lang || lang === "plaintext" || !hljs.getLanguage(lang)) return;
        code.innerHTML = hljs.highlight(code.textContent || "", { language: lang }).value;
        code.classList.add("hljs");
      });
  }, [content]);

  return (
    <div
      ref={containerRef}
      className={cn(articleProseClassName, className)}
      dangerouslySetInnerHTML={{ __html: content || "" }}
    />
  );
}
