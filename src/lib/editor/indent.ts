import { Extension, type CommandProps } from "@tiptap/core";

const INDENT_TYPES = ["paragraph"];
const LIST_ITEM_TYPES = ["listItem", "taskItem"];

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

// 段落首行缩进两字：以内联 style 输出，前台无需额外样式即可与编辑时一致；
// 同时把旧 Quill 文章的 ql-indent-N class 视为首行缩进
export const Indent = Extension.create({
  name: "indent",
  // 低于列表、代码块、表格的默认优先级，让它们先处理 Tab
  priority: 50,

  addGlobalAttributes() {
    return [
      {
        types: INDENT_TYPES,
        attributes: {
          indent: {
            default: false,
            // 回车新起的段落不继承缩进
            keepOnSplit: false,
            parseHTML: (element) =>
              Number(element.getAttribute("data-indent")) > 0 ||
              /ql-indent-\d+/.test(element.className),
            renderHTML: (attributes) =>
              attributes.indent ? { "data-indent": 1, style: "text-indent: 2em" } : {},
          },
        },
      },
    ];
  },

  addCommands() {
    const set =
      (value: boolean) =>
      () =>
      ({ tr }: CommandProps) => {
        const { from, to } = tr.selection;
        let changed = false;
        tr.doc.nodesBetween(from, to, (node, pos) => {
          if (!INDENT_TYPES.includes(node.type.name)) return;
          if (Boolean(node.attrs.indent) === value) return false;
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: value });
          changed = true;
          return false;
        });
        return changed;
      };

    return {
      indent: set(true),
      outdent: set(false),
    };
  },

  addKeyboardShortcuts() {
    const inListOrCode = () =>
      this.editor.isActive("codeBlock") ||
      LIST_ITEM_TYPES.some((type) => this.editor.isActive(type));

    return {
      // 列表/代码块未处理的 Tab 也吞掉，避免焦点跳出编辑器
      Tab: () => (inListOrCode() ? true : this.editor.commands.indent() || true),
      "Shift-Tab": () =>
        inListOrCode() ? true : this.editor.commands.outdent() || true,
      // 行首退格先取消缩进
      Backspace: () => {
        const { empty, $from } = this.editor.state.selection;
        if (!empty || $from.parentOffset !== 0) return false;
        if (!INDENT_TYPES.includes($from.parent.type.name)) return false;
        if (!$from.parent.attrs.indent) return false;
        return this.editor.commands.outdent();
      },
    };
  },
});
