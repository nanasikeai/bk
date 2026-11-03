// 旧文章由 Quill 生成（getSemanticHTML），载入 Tiptap 前转换成标准 HTML：
// - 所有空格被存成了 &nbsp;，导致英文长文本无法换行
// - 代码块是 <pre data-language="xx">，首尾各带一个换行
// - 待办列表是 <ul data-list="checked|unchecked">
// - 图片包在 <p> 内
// 段落缩进 ql-indent-N 由 Indent 扩展直接解析，这里不处理
export function normalizeLegacyHtml(html: string): string {
  if (!html || typeof window === "undefined") return html;
  if (!/&nbsp;| |data-language=|data-list=|<img/.test(html)) return html;

  const doc = new DOMParser().parseFromString(html, "text/html");
  const body = doc.body;

  // Quill 把图片放在 <p> 内，Tiptap 的图片是块级节点，直接解析会多出空段落
  body.querySelectorAll("p").forEach((p) => {
    const onlyImages =
      p.querySelector("img") &&
      Array.from(p.childNodes).every(
        (node) =>
          (node as Element).tagName === "IMG" ||
          (node as Element).tagName === "BR" ||
          (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim())
      );
    if (onlyImages) p.replaceWith(...Array.from(p.querySelectorAll("img")));
  });

  body.querySelectorAll("pre[data-language]").forEach((pre) => {
    const lang = pre.getAttribute("data-language") || "plain";
    const text = (pre.textContent || "")
      .replace(/ /g, " ")
      .replace(/^\n/, "")
      .replace(/\n$/, "");
    const code = doc.createElement("code");
    if (lang !== "plain") code.className = `language-${lang}`;
    code.textContent = text;
    const next = doc.createElement("pre");
    next.appendChild(code);
    pre.replaceWith(next);
  });

  body.querySelectorAll("ul[data-list]").forEach((list) => {
    const checked = list.getAttribute("data-list") === "checked";
    list.removeAttribute("data-list");
    list.setAttribute("data-type", "taskList");
    Array.from(list.children).forEach((item) => {
      if (item.tagName !== "LI") return;
      item.setAttribute("data-type", "taskItem");
      item.setAttribute("data-checked", String(checked));
    });
  });

  const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.parentElement?.closest("pre, code")) continue;
    if (node.nodeValue?.includes(" ")) {
      node.nodeValue = node.nodeValue.replace(/ /g, " ");
    }
  }

  return body.innerHTML;
}
