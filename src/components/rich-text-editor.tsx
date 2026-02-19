"use client";

import { useRef, useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Code,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "在此编写内容，支持 Markdown 粘贴导入…",
  className,
  minHeight = 400,
}: RichTextEditorProps) {
  const lastEmittedRef = useRef<string | undefined>(undefined);
  const [, setTick] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown.configure({ markedOptions: { gfm: true } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    contentType: "markdown",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const md = editor.getMarkdown() ?? "";
      lastEmittedRef.current = md;
      onChange(md);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[200px] px-3 py-2 focus:outline-none",
      },
    },
  });

  // 当父组件传入的 value 变化时（如加载了另一篇文章）同步到编辑器
  useEffect(() => {
    if (!editor) return;
    if (value !== lastEmittedRef.current) {
      lastEmittedRef.current = value;
      editor.commands.setContent(value || "", { contentType: "markdown" });
    }
  }, [editor, value]);

  // 选区/内容变化时重绘，以便工具栏按钮的 active 状态正确
  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => setTick((t) => t + 1);
    editor.on("selectionUpdate", onUpdate);
    editor.on("transaction", onUpdate);
    return () => {
      editor.off("selectionUpdate", onUpdate);
      editor.off("transaction", onUpdate);
    };
  }, [editor]);

  if (!editor) {
    return (
      <div
        className={cn(
          "rounded-md border border-input bg-background animate-pulse",
          className
        )}
        style={{ minHeight }}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-md border border-input bg-background overflow-hidden",
        "[&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:px-3 [&_.ProseMirror]:py-2",
        "[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
        className
      )}
      style={{ minHeight }}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/30 p-1">
        <Button
          type="button"
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          title="粗体"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          title="斜体"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("code") ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          title="行内代码"
        >
          <Code className="h-4 w-4" />
        </Button>
        <div className="mx-1 w-px self-stretch bg-border" />
        <Button
          type="button"
          variant={
            editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"
          }
          size="icon"
          className="h-8 w-8"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          title="一级标题"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={
            editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"
          }
          size="icon"
          className="h-8 w-8"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          title="二级标题"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="引用"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="无序列表"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="有序列表"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="分割线"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
