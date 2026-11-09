import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/post-card";
import { Pagination } from "@/components/pagination";

const POSTS_PER_PAGE = 9;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateStaticParams() {
  const categories = await prisma.category.findMany({
    select: { slug: true },
  });

  return categories.map((category) => ({ slug: category.slug }));
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page } = await searchParams;
  const currentPage = parseInt(page || "1", 10);

  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (!category) {
    notFound();
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: {
        published: true,
        categoryId: category.id,
      },
      take: POSTS_PER_PAGE,
      skip: (currentPage - 1) * POSTS_PER_PAGE,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        tags: {
          include: { tag: true },
        },
      },
    }),
    prisma.post.count({
      where: {
        published: true,
        categoryId: category.id,
      },
    }),
  ]);

  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

  const formattedPosts = posts.map((post) => ({
    ...post,
    tags: post.tags.map((t) => t.tag),
  }));

  return (
    <div className="journal-shell journal-page">
      <header className="journal-page-heading">
        <p className="journal-eyebrow"><span className="journal-small-rule" />分类 · {total} 篇文章</p>
        <h1 className="journal-heading">{category.name}</h1>
        {category.description && <p className="journal-description">{category.description}</p>}
      </header>

      {formattedPosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">该分类下暂无文章。</p>
        </div>
      ) : (
        <>
          <div className="journal-index-list">
            {formattedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={`/categories/${slug}`}
          />
        </>
      )}
    </div>
  );
}
