# 个人博客

使用 Next.js 14、TypeScript、Tailwind CSS 和 MySQL 构建的现代个人博客。

## 功能特性

- **现代技术栈**：Next.js 14（App Router）、TypeScript、Tailwind CSS
- **数据库**：MySQL + Prisma ORM
- **UI 组件**：shadcn/ui 组件库
- **暗色模式**：支持跟随系统主题切换
- **Markdown 支持**：使用 Markdown 撰写文章，支持 GitHub Flavored Markdown
- **分类与标签**：用分类和标签组织文章
- **全文搜索**：按标题、内容或摘要搜索文章
- **评论系统**：访客可留言评论
- **管理后台**：管理文章、分类和标签
- **SEO 优化**：站点地图、robots.txt、Open Graph、Twitter Card

## 环境要求

- Node.js 18+
- MySQL 数据库

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填入实际配置：

```bash
cp .env.example .env
```

更新 MySQL 连接字符串 `DATABASE_URL`：

```
DATABASE_URL="mysql://user:password@localhost:3306/blog"
```

### 3. 初始化数据库

生成 Prisma 客户端并将表结构同步到数据库：

```bash
npm run db:generate
npm run db:push
```

### 4. （可选）填充示例数据

```bash
npm run db:seed
```

### 5. 启动开发服务器

```bash
npm run dev
```

在浏览器打开 [http://localhost:3000](http://localhost:3000) 查看博客。

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run start` | 启动生产服务器 |
| `npm run lint` | 运行 ESLint |
| `npm run db:generate` | 生成 Prisma 客户端 |
| `npm run db:push` | 将表结构推送到数据库 |
| `npm run db:migrate` | 创建并执行迁移 |
| `npm run db:studio` | 打开 Prisma Studio |
| `npm run db:seed` | 填充示例数据 |

## 项目结构

```
blog/
├── prisma/
│   ├── schema.prisma      # 数据库模型
│   └── seed.ts            # 种子脚本
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── admin/         # 管理后台
│   │   ├── api/           # API 路由
│   │   ├── categories/    # 分类页面
│   │   ├── posts/         # 文章页面
│   │   ├── search/        # 搜索页面
│   │   └── tags/          # 标签页面
│   ├── components/        # React 组件
│   ├── lib/               # 工具函数
│   └── types/             # TypeScript 类型
└── public/                # 静态资源
```

## 管理后台

访问 `/admin` 可进行以下操作（需先到 `/login` 登录）：

- 创建、编辑、删除文章
- 管理分类
- 管理标签

## 自定义配置

### 站点信息

在 `src/app/layout.tsx` 中修改站点元数据：

```typescript
export const metadata: Metadata = {
  title: {
    default: "你的博客名称",
    template: "%s | 你的博客名称",
  },
  description: "博客描述",
  // ...
};
```

### 环境变量

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | MySQL 连接字符串 |
| `NEXT_PUBLIC_SITE_URL` | 站点公网地址（用于 sitemap） |
| `ADMIN_PASSWORD` | 管理后台登录密码 |

## 部署

本地构建（Next standalone），上传到服务器后切换版本，健康检查失败自动回退。

```bash
npm run deploy              # 构建并发布
npm run deploy -- --db      # 同时同步数据库表结构（prisma db push，经 SSH 隧道）
npm run deploy -- --dry-run # 只构建打包，不上传（产物在 .deploy/）
npm run rollback            # 切回上一个版本
```

有未提交的改动时会先询问是否继续（`--allow-dirty` 跳过询问）；每个版本目录下的 `REVISION` 记录了对应的提交。

前提：本机 `~/.ssh/config` 配置了主机别名 `blog`（root 密钥登录），服务器上以 `admin` 用户运行。

服务器目录 `/home/admin/blog`：

| 路径 | 说明 |
|------|------|
| `releases/<时间戳>/` | 各版本，保留最近 5 个 |
| `current` | 指向当前运行版本的软链接 |
| `shared/.env` | 线上环境变量，不随部署覆盖 |
| `shared/uploads/` | 上传的图片 |
| `shared/logs/` | 运行日志 |
| `ecosystem.config.cjs` | pm2 配置（来自 `deploy/`） |

Nginx 反向代理到 `127.0.0.1:3000`，应用只监听本机。

## 许可证

MIT License
