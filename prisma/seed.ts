import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 创建分类
  const techCategory = await prisma.category.upsert({
    where: { slug: "technology" },
    update: {},
    create: {
      name: "技术",
      slug: "technology",
      description: "关于技术和编程的文章",
    },
  });

  const lifeCategory = await prisma.category.upsert({
    where: { slug: "lifestyle" },
    update: {},
    create: {
      name: "生活",
      slug: "lifestyle",
      description: "日常生活和想法分享",
    },
  });

  // 创建标签
  const tagNextjs = await prisma.tag.upsert({
    where: { slug: "nextjs" },
    update: {},
    create: { name: "Next.js", slug: "nextjs" },
  });

  const tagReact = await prisma.tag.upsert({
    where: { slug: "react" },
    update: {},
    create: { name: "React", slug: "react" },
  });

  const tagTypescript = await prisma.tag.upsert({
    where: { slug: "typescript" },
    update: {},
    create: { name: "TypeScript", slug: "typescript" },
  });

  const tagTailwind = await prisma.tag.upsert({
    where: { slug: "tailwindcss" },
    update: {},
    create: { name: "Tailwind CSS", slug: "tailwindcss" },
  });

  // 创建示例文章
  const post1 = await prisma.post.upsert({
    where: { slug: "getting-started-with-nextjs" },
    update: {},
    create: {
      title: "Next.js 14 入门指南",
      slug: "getting-started-with-nextjs",
      excerpt:
        "学习如何使用 Next.js 14 构建现代 Web 应用，这是 React 框架的最新版本。",
      content: `# Next.js 14 入门指南

Next.js 14 是流行的 React 框架的最新版本，支持服务端渲染和静态站点生成。

## 为什么选择 Next.js？

- **服务端渲染** - 更好的 SEO 和性能
- **静态站点生成** - 快速的页面加载
- **API 路由** - 轻松构建 API
- **图片优化** - 自动图片处理

## 快速开始

\`\`\`bash
npx create-next-app@latest my-app
cd my-app
npm run dev
\`\`\`

## 结论

Next.js 是构建现代 Web 应用的绝佳选择。快来试试吧！`,
      published: true,
      categoryId: techCategory.id,
    },
  });

  await prisma.postTag.createMany({
    data: [
      { postId: post1.id, tagId: tagNextjs.id },
      { postId: post1.id, tagId: tagReact.id },
      { postId: post1.id, tagId: tagTypescript.id },
    ],
    skipDuplicates: true,
  });

  const post2 = await prisma.post.upsert({
    where: { slug: "tailwind-css-best-practices" },
    update: {},
    create: {
      title: "Tailwind CSS 最佳实践",
      slug: "tailwind-css-best-practices",
      excerpt:
        "了解在项目中使用 Tailwind CSS 的最佳实践，编写更清晰、更易维护的样式。",
      content: `# Tailwind CSS 最佳实践

Tailwind CSS 是一个实用优先的 CSS 框架，帮助你构建现代网站而无需离开 HTML。

## 关键最佳实践

### 1. 使用一致的间距

始终使用 Tailwind 的间距比例：

\`\`\`html
<div class="p-4 m-2">
  <!-- 内容 -->
</div>
\`\`\`

### 2. 创建可复用组件

将常见模式提取为组件：

\`\`\`jsx
function Button({ children }) {
  return (
    <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
      {children}
    </button>
  );
}
\`\`\`

### 3. 使用响应式前缀

让你的设计具有响应性：

\`\`\`html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <!-- 内容 -->
</div>
\`\`\`

## 结论

遵循这些最佳实践将帮助你编写更整洁的 Tailwind CSS 代码！`,
      published: true,
      categoryId: techCategory.id,
    },
  });

  await prisma.postTag.createMany({
    data: [
      { postId: post2.id, tagId: tagTailwind.id },
    ],
    skipDuplicates: true,
  });

  const post3 = await prisma.post.upsert({
    where: { slug: "my-daily-routine" },
    update: {},
    create: {
      title: "程序员的日常",
      slug: "my-daily-routine",
      excerpt:
        "作为软件开发者的日常生活，包括生产力技巧和工作生活平衡。",
      content: `# 程序员的日常

这是我作为软件开发者如何安排一天的时间，保持高效的同时维持健康的工作生活平衡。

## 早晨例行

- **6:00** - 起床锻炼
- **7:00** - 早餐和咖啡
- **8:00** - 回顾今日目标

## 工作时间

- **9:00 - 12:00** - 深度工作时段
- **12:00 - 13:00** - 午休
- **13:00 - 17:00** - 会议和协作

## 晚间安排

- **18:00** - 下班
- **19:00** - 与家人共进晚餐
- **21:00** - 阅读或个人项目

## 生产力建议

1. 以清晰的计划开始新的一天
2. 定期休息
3. 保持水分充足
4. 坚持锻炼

## 结论

良好的日常习惯是长期成功和幸福的关键！`,
      published: true,
      categoryId: lifeCategory.id,
    },
  });

  console.log("示例数据创建成功！");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
