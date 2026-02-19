# Personal Blog

A modern personal blog built with Next.js 14, TypeScript, Tailwind CSS, and MySQL.

## Features

- **Modern Tech Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Database**: MySQL with Prisma ORM
- **UI Components**: shadcn/ui component library
- **Dark Mode**: System-aware dark mode support
- **Markdown Support**: Write posts in Markdown with GitHub Flavored Markdown support
- **Categories & Tags**: Organize posts with categories and tags
- **Full-text Search**: Search posts by title, content, or excerpt
- **Comments**: Allow visitors to leave comments
- **Admin Panel**: Manage posts, categories, and tags
- **SEO Optimized**: Sitemap, robots.txt, Open Graph, and Twitter Card support

## Prerequisites

- Node.js 18+
- MySQL database

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Update the `DATABASE_URL` with your MySQL connection string:

```
DATABASE_URL="mysql://user:password@localhost:3306/blog"
```

### 3. Set up the database

Generate Prisma client and push the schema to your database:

```bash
npm run db:generate
npm run db:push
```

### 4. (Optional) Seed sample data

```bash
npm run db:seed
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the blog.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Create and run migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed sample data |

## Project Structure

```
blog/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed script
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (public)/      # Public pages (not used, pages at root)
│   │   ├── admin/         # Admin panel
│   │   ├── api/           # API routes
│   │   ├── categories/    # Category pages
│   │   ├── posts/         # Post pages
│   │   ├── search/        # Search page
│   │   └── tags/          # Tag pages
│   ├── components/        # React components
│   ├── lib/               # Utility functions
│   └── types/             # TypeScript types
└── public/                # Static assets
```

## Admin Panel

Access the admin panel at `/admin` to:

- Create, edit, and delete posts
- Manage categories
- Manage tags

## Customization

### Site Configuration

Update the site metadata in `src/app/layout.tsx`:

```typescript
export const metadata: Metadata = {
  title: {
    default: "Your Blog Name",
    template: "%s | Your Blog Name",
  },
  description: "Your blog description",
  // ...
};
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MySQL connection string |
| `NEXT_PUBLIC_SITE_URL` | Public URL of your site (for sitemap) |

## Deployment

### Build for production

```bash
npm run build
```

### Run production server

```bash
npm run start
```

### Deploy to Vercel

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to a Git repository
2. Import the project to Vercel
3. Add your environment variables
4. Deploy!

## License

MIT License
