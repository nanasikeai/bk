"use client";

import { useRef, useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
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
  ImagePlus,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  placeholder = "在此编写内容，支持 Markdown、粘贴图片…",
  className,
  minHeight = 400,
}: RichTextEditorProps) {
  const lastEmittedRef = useRef<string | undefined>(undefined);
  const [, setTick] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUploading, setImageUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: "_blank", rel: "noopener" },
      }),
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

  // 粘贴图片：通过 editor 实例（在 useEffect 里绑定）
  useEffect(() => {
    if (!editor) return;
    const el = editor.view.dom;
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
      e.stopPropagation();
      setImageUploading(true);
      try {
        const url = await uploadImage(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch {
        alert("图片上传失败");
      } finally {
        setImageUploading(false);
      }
    };
    el.addEventListener("paste", onPaste);
    return () => el.removeEventListener("paste", onPaste);
  }, [editor]);

  // 当父组件传入的 value 变化时同步到编辑器
  useEffect(() => {
    if (!editor) return;
    if (value !== lastEmittedRef.current) {
      lastEmittedRef.current = value;
      editor.commands.setContent(value || "", { contentType: "markdown" });
    }
  }, [editor, value]);

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

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    if (!file.type.startsWith("image/")) {
      alert("请选择图片文件");
      return;
    }
    setImageUploading(true);
    try {
      const url = await uploadImage(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      alert("图片上传失败");
    } finally {
      setImageUploading(false);
    }
  };

  const handleInsertLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("链接地址", previousUrl || "https://");
    if (url == null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

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
        "[&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:h-auto [&_.ProseMirror_img]:rounded",
        className
      )}
      style={{ minHeight }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleImageFile}
      />
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
        <Button
          type="button"
          variant={editor.isActive("link") ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={handleInsertLink}
          title="插入链接"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <div className="mx-1 w-px self-stretch bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => fileInputRef.current?.click()}
          disabled={imageUploading}
          title={imageUploading ? "上传中…" : "插入图片（也可直接粘贴）"}
        >
          <ImagePlus className="h-4 w-4" />
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
          variant={
            editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"
          }
          size="sm"
          className="h-8 px-2 font-semibold"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          title="三级标题"
        >
          H3
        </Button>
        <Button
          type="button"
          variant={
            editor.isActive("heading", { level: 4 }) ? "secondary" : "ghost"
          }
          size="sm"
          className="h-8 px-2 font-semibold"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 4 }).run()
          }
          title="四级标题"
        >
          H4
        </Button>
        <Button
          type="button"
          variant={
            editor.isActive("heading", { level: 5 }) ? "secondary" : "ghost"
          }
          size="sm"
          className="h-8 px-2 font-semibold"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 5 }).run()
          }
          title="五级标题"
        >
          H5
        </Button>
        <Button
          type="button"
          variant={
            editor.isActive("heading", { level: 6 }) ? "secondary" : "ghost"
          }
          size="sm"
          className="h-8 px-2 font-semibold"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 6 }).run()
          }
          title="六级标题"
        >
          H6
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
