"use client";

import "@uiw/react-md-editor/markdown-editor.css";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor/nohighlight").then((mod) => mod.default),
  { ssr: false }
);

interface MarkdownEditorProps {
  value: string;
  onChange: (value?: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "在此编写 Markdown 内容...",
  className,
  minHeight = 400,
}: MarkdownEditorProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const colorMode = mounted && resolvedTheme === "dark" ? "dark" : "light";

  return (
    <div
      className={cn("[&_.w-md-editor]:min-h-[400px]", className)}
      data-color-mode={colorMode}
    >
      <MDEditor
        value={value}
        onChange={onChange}
        textareaProps={{ placeholder }}
        height={minHeight}
        preview="live"
        visibleDragbar={false}
      />
    </div>
  );
}
