"use client";

import "highlight.js/styles/github-dark.css";
import { useEffect, useRef, type ReactNode } from "react";
import { useEditor, useEditorState, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extensions";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";
import {
  Baseline,
  Bold,
  Code,
  Highlighter,
  ImagePlus,
  Italic,
  Link,
  List,
  ListIndentDecrease,
  ListIndentIncrease,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Redo2,
  RemoveFormatting,
  SquareCode,
  Strikethrough,
  Table,
  TextAlignCenter,
  TextAlignEnd,
  TextAlignStart,
  Underline,
  Undo2,
  Unlink,
} from "lucide-react";
import { Indent } from "@/lib/editor/indent";
import { normalizeLegacyHtml } from "@/lib/editor/legacy-html";
import { articleProseClassName } from "@/components/html-renderer";
import { cn } from "@/lib/utils";

const lowlight = createLowlight(common);

const CODE_LANGUAGES: [string, string][] = [
  ["plaintext", "纯文本"],
  ["javascript", "JavaScript"],
  ["typescript", "TypeScript"],
  ["json", "JSON"],
  ["bash", "Bash"],
  ["xml", "HTML/XML"],
  ["css", "CSS"],
  ["python", "Python"],
  ["java", "Java"],
  ["go", "Go"],
  ["rust", "Rust"],
  ["c", "C"],
  ["cpp", "C++"],
  ["csharp", "C#"],
  ["sql", "SQL"],
  ["yaml", "YAML"],
  ["markdown", "Markdown"],
];

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

function findImageFile(files?: FileList | null): File | undefined {
  return Array.from(files ?? []).find((file) => file.type.startsWith("image/"));
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "在此编写内容，支持富文本和图片…",
  className,
  minHeight = 400,
}: RichTextEditorProps) {
  // 记录最近一次由编辑器产出的 HTML，用于区分外部传入的新内容（如编辑页异步加载文章）
  const lastHtmlRef = useRef(value);
  const editorRef = useRef<Editor | null>(null);

  const insertImage = async (file: File, pos?: number) => {
    const editor = editorRef.current;
    if (!editor) return;
    try {
      const url = await uploadImage(file);
      const chain = editor.chain().focus();
      if (pos !== undefined) chain.setTextSelection(pos);
      chain.setImage({ src: url }).run();
    } catch {
      alert("图片上传失败");
    }
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        enableTabIndentation: true,
        tabSize: 2,
      }),
      Image.configure({
        resize: {
          enabled: true,
          directions: ["bottom-right", "bottom-left"],
          minWidth: 80,
          alwaysPreserveAspectRatio: true,
        },
      }),
      TableKit.configure({ table: { resizable: false } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Highlight,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder }),
      Indent,
    ],
    content: normalizeLegacyHtml(value),
    editorProps: {
      attributes: {
        class: cn(articleProseClassName, "focus:outline-none px-4 py-3"),
      },
      handlePaste: (_view, event) => {
        const file = findImageFile(event.clipboardData?.files);
        if (!file) return false;
        event.preventDefault();
        void insertImage(file);
        return true;
      },
      handleDrop: (view, event) => {
        const file = findImageFile(event.dataTransfer?.files);
        if (!file) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        void insertImage(file, pos);
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.isEmpty ? "" : editor.getHTML();
      lastHtmlRef.current = html;
      onChange(html);
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    if (!editor || value === lastHtmlRef.current) return;
    lastHtmlRef.current = value;
    editor.commands.setContent(normalizeLegacyHtml(value), { emitUpdate: false });
  }, [editor, value]);

  return (
    <div
      className={cn(
        "rounded-md border border-input bg-background overflow-hidden",
        className
      )}
    >
      {editor && <Toolbar editor={editor} onPickImage={(file) => insertImage(file)} />}
      <div
        className="overflow-y-auto"
        style={{ minHeight, maxHeight: `max(${minHeight}px, calc(100vh - 12rem))` }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Toolbar({
  editor,
  onPickImage,
}: {
  editor: Editor;
  onPickImage: (file: File) => void;
}) {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      heading: ([1, 2, 3] as const).find((level) => editor.isActive("heading", { level })) ?? 0,
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      strike: editor.isActive("strike"),
      code: editor.isActive("code"),
      highlight: editor.isActive("highlight"),
      color: (editor.getAttributes("textStyle").color as string | undefined) ?? "",
      alignCenter: editor.isActive({ textAlign: "center" }),
      alignRight: editor.isActive({ textAlign: "right" }),
      bulletList: editor.isActive("bulletList"),
      orderedList: editor.isActive("orderedList"),
      taskList: editor.isActive("taskList"),
      blockquote: editor.isActive("blockquote"),
      codeBlock: editor.isActive("codeBlock"),
      codeLanguage: (editor.getAttributes("codeBlock").language as string | null) ?? "plaintext",
      link: editor.isActive("link"),
      table: editor.isActive("table"),
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
    }),
  });

  const run = () => editor.chain().focus();

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("链接地址", previous ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      run().extendMarkRange("link").unsetLink().run();
      return;
    }
    run().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const pickImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/gif,image/webp";
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) onPickImage(file);
    };
    input.click();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 px-2 py-1.5">
      <ToolButton title="撤销 (Ctrl+Z)" disabled={!state.canUndo} onClick={() => run().undo().run()}>
        <Undo2 />
      </ToolButton>
      <ToolButton title="重做 (Ctrl+Shift+Z)" disabled={!state.canRedo} onClick={() => run().redo().run()}>
        <Redo2 />
      </ToolButton>
      <Divider />
      <select
        title="段落格式"
        className="h-8 rounded-md bg-transparent px-1.5 text-sm hover:bg-accent focus:outline-none"
        value={state.heading}
        onChange={(e) => {
          const level = Number(e.target.value);
          if (level === 0) run().setParagraph().run();
          else run().setHeading({ level: level as 1 | 2 | 3 }).run();
        }}
      >
        <option value={0}>正文</option>
        <option value={1}>标题 1</option>
        <option value={2}>标题 2</option>
        <option value={3}>标题 3</option>
      </select>
      <Divider />
      <ToolButton title="粗体 (Ctrl+B)" active={state.bold} onClick={() => run().toggleBold().run()}>
        <Bold />
      </ToolButton>
      <ToolButton title="斜体 (Ctrl+I)" active={state.italic} onClick={() => run().toggleItalic().run()}>
        <Italic />
      </ToolButton>
      <ToolButton title="下划线 (Ctrl+U)" active={state.underline} onClick={() => run().toggleUnderline().run()}>
        <Underline />
      </ToolButton>
      <ToolButton title="删除线" active={state.strike} onClick={() => run().toggleStrike().run()}>
        <Strikethrough />
      </ToolButton>
      <ToolButton title="行内代码 (Ctrl+E)" active={state.code} onClick={() => run().toggleCode().run()}>
        <Code />
      </ToolButton>
      <label
        title="文字颜色"
        className="relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md hover:bg-accent [&_svg]:size-4"
      >
        <Baseline style={{ color: state.color || undefined }} />
        <input
          type="color"
          className="absolute inset-0 cursor-pointer opacity-0"
          value={state.color || "#000000"}
          onChange={(e) => run().setColor(e.target.value).run()}
        />
      </label>
      <ToolButton title="高亮" active={state.highlight} onClick={() => run().toggleHighlight().run()}>
        <Highlighter />
      </ToolButton>
      <ToolButton title="清除格式" onClick={() => run().unsetAllMarks().clearNodes().run()}>
        <RemoveFormatting />
      </ToolButton>
      <Divider />
      <ToolButton
        title="左对齐"
        active={!state.alignCenter && !state.alignRight}
        onClick={() => run().unsetTextAlign().run()}
      >
        <TextAlignStart />
      </ToolButton>
      <ToolButton title="居中" active={state.alignCenter} onClick={() => run().setTextAlign("center").run()}>
        <TextAlignCenter />
      </ToolButton>
      <ToolButton title="右对齐" active={state.alignRight} onClick={() => run().setTextAlign("right").run()}>
        <TextAlignEnd />
      </ToolButton>
      <ToolButton title="取消首行缩进 (Shift+Tab)" onClick={() => outdent(editor)}>
        <ListIndentDecrease />
      </ToolButton>
      <ToolButton title="首行缩进 (Tab)" onClick={() => indent(editor)}>
        <ListIndentIncrease />
      </ToolButton>
      <Divider />
      <ToolButton title="无序列表" active={state.bulletList} onClick={() => run().toggleBulletList().run()}>
        <List />
      </ToolButton>
      <ToolButton title="有序列表" active={state.orderedList} onClick={() => run().toggleOrderedList().run()}>
        <ListOrdered />
      </ToolButton>
      <ToolButton title="待办列表" active={state.taskList} onClick={() => run().toggleTaskList().run()}>
        <ListTodo />
      </ToolButton>
      <ToolButton title="引用" active={state.blockquote} onClick={() => run().toggleBlockquote().run()}>
        <Quote />
      </ToolButton>
      <ToolButton title="代码块 (```)" active={state.codeBlock} onClick={() => run().toggleCodeBlock().run()}>
        <SquareCode />
      </ToolButton>
      {state.codeBlock && (
        <select
          title="代码语言"
          className="h-8 rounded-md bg-transparent px-1.5 text-sm hover:bg-accent focus:outline-none"
          value={state.codeLanguage}
          onChange={(e) => run().updateAttributes("codeBlock", { language: e.target.value }).run()}
        >
          {CODE_LANGUAGES.map(([lang, label]) => (
            <option key={lang} value={lang}>
              {label}
            </option>
          ))}
        </select>
      )}
      <ToolButton title="分割线" onClick={() => run().setHorizontalRule().run()}>
        <Minus />
      </ToolButton>
      <Divider />
      <ToolButton title="链接" active={state.link} onClick={setLink}>
        <Link />
      </ToolButton>
      {state.link && (
        <ToolButton title="取消链接" onClick={() => run().extendMarkRange("link").unsetLink().run()}>
          <Unlink />
        </ToolButton>
      )}
      <ToolButton title="插入图片（也可直接粘贴或拖入）" onClick={pickImage}>
        <ImagePlus />
      </ToolButton>
      <ToolButton
        title="插入表格"
        active={state.table}
        onClick={() => run().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      >
        <Table />
      </ToolButton>
      {state.table && (
        <>
          <TextButton onClick={() => run().addRowAfter().run()}>加行</TextButton>
          <TextButton onClick={() => run().addColumnAfter().run()}>加列</TextButton>
          <TextButton onClick={() => run().deleteRow().run()}>删行</TextButton>
          <TextButton onClick={() => run().deleteColumn().run()}>删列</TextButton>
          <TextButton onClick={() => run().deleteTable().run()}>删表</TextButton>
        </>
      )}
    </div>
  );
}

function indent(editor: Editor) {
  const chain = editor.chain().focus();
  if (editor.isActive("taskItem")) chain.sinkListItem("taskItem").run();
  else if (editor.isActive("listItem")) chain.sinkListItem("listItem").run();
  else chain.indent().run();
}

function outdent(editor: Editor) {
  const chain = editor.chain().focus();
  if (editor.isActive("taskItem")) chain.liftListItem("taskItem").run();
  else if (editor.isActive("listItem")) chain.liftListItem("listItem").run();
  else chain.outdent().run();
}

function ToolButton({
  title,
  active,
  disabled,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors [&_svg]:size-4",
        "hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
        active && "bg-accent text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function TextButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="h-8 rounded-md px-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-border" aria-hidden />;
}
