"use client";

import "react-quill-new/dist/quill.snow.css";
import "highlight.js/styles/github-dark.css";
import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ComponentProps,
  type ForwardRefExoticComponent,
  type RefAttributes,
} from "react";
import type ReactQuillType from "react-quill-new";
import hljs from "highlight.js";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import { cn } from "@/lib/utils";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
}) as ForwardRefExoticComponent<
  ComponentProps<typeof ReactQuillType> & RefAttributes<ReactQuillType>
>;

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("css", css);

if (typeof window !== "undefined") {
  (window as Window & { hljs?: typeof hljs }).hljs = hljs;
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload/image", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "上传失败");
  }
  const data = await res.json();
  return data.url;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "在此编写内容，支持富文本和图片…",
  className,
  minHeight = 400,
}: RichTextEditorProps) {
  const editorRef = useRef<ReactQuillType | null>(null);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["blockquote", "code-block", "link", "image"],
          ["clean"],
        ],
      },
      syntax: { hljs },
      clipboard: {
        matchVisual: false,
      },
    }),
    []
  );

  const formats = useMemo(
    () => [
      "header",
      "bold",
      "italic",
      "underline",
      "strike",
      "list",
      "blockquote",
      "code-block",
      "code-token",
      "link",
      "image",
    ],
    []
  );

  const insertImage = useCallback(async (file: File) => {
    const quill = editorRef.current?.getEditor?.();
    if (!quill) return;
    const range = quill.getSelection(true);
    try {
      const url = await uploadImage(file);
      const insertAt = range?.index ?? quill.getLength();
      quill.insertEmbed(insertAt, "image", url, "user");
      quill.setSelection(insertAt + 1, 0, "user");
    } catch {
      alert("图片上传失败");
    }
  }, []);

  const handleSelectImage = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/jpeg,image/png,image/gif,image/webp");
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      await insertImage(file);
    };
    input.click();
  }, [insertImage]);

  useEffect(() => {
    const quill = editorRef.current?.getEditor?.();
    if (!quill) return;
    const toolbar = quill.getModule("toolbar") as {
      addHandler?: (name: string, handler: () => void) => void;
    };
    toolbar.addHandler?.("image", handleSelectImage);
    toolbar.addHandler?.("code-block", () => {
      const current = quill.getFormat();
      if (current["code-block"]) {
        quill.format("code-block", false, "user");
        return;
      }
      quill.format("code-block", "javascript", "user");
    });
    const root = quill.root as HTMLElement;

    // 代码块末尾空行按回车 → 退出代码块，插入普通段落
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const range = quill.getSelection();
      if (!range) return;
      const [line] = quill.getLine(range.index);
      if (!line) return;
      const format = quill.getFormat(range.index);
      if (!format["code-block"]) return;
      const lineText = line.domNode?.textContent ?? "";
      if (lineText !== "") return;
      e.preventDefault();
      const lineIndex = quill.getIndex(line);
      quill.deleteText(lineIndex, 1, "user");
      quill.insertText(lineIndex, "\n", { "code-block": false }, "user");
      quill.setSelection(lineIndex + 1, 0, "user");
      quill.format("code-block", false, "user");
    };
    root.addEventListener("keydown", onKeyDown);

    const onPaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const fileItem = Array.from(items).find(
        (item) => item.kind === "file" && item.type.startsWith("image/")
      );
      if (!fileItem) return;
      const file = fileItem.getAsFile();
      if (!file) return;
      e.preventDefault();
      await insertImage(file);
    };
    root.addEventListener("paste", onPaste);
    return () => {
      root.removeEventListener("keydown", onKeyDown);
      root.removeEventListener("paste", onPaste);
    };
  }, [handleSelectImage, insertImage]);

  return (
    <div
      className={cn(
        "rounded-md border border-input bg-background overflow-hidden",
        "[&_.ql-toolbar]:border-x-0 [&_.ql-toolbar]:border-t-0 [&_.ql-toolbar]:border-b",
        "[&_.ql-container]:border-0 [&_.ql-container]:h-auto [&_.ql-editor]:max-w-none",
        "[&_.ql-editor]:min-h-[var(--editor-min-height)] [&_.ql-editor_img]:max-w-full [&_.ql-editor_img]:h-auto [&_.ql-editor_img]:rounded",
        className
      )}
    >
      <ReactQuill
        ref={editorRef}
        theme="snow"
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        style={{ ["--editor-min-height" as string]: `${minHeight}px` }}
      />
    </div>
  );
}
