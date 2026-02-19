import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/post-card";
import { Pagination } from "@/components/pagination";
import { Badge } from "@/components/ui/badge";

const POSTS_PER_PAGE = 9;

interface TagPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateStaticParams() {
  const tags = await prisma.tag.findMany({
    select: { slug: true },
  });

  return tags.map((tag) => ({ slug: tag.slug }));
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { slug } = await params;
  const { page } = await searchParams;
  const currentPage = parseInt(page || "1", 10);

  const tag = await prisma.tag.findUnique({
    where: { slug },
  });

  if (!tag) {
    notFound();
  }

  const [postTags, total] = await Promise.all([
    prisma.postTag.findMany({
      where: { tagId: tag.id },
      take: POSTS_PER_PAGE,
      skip: (currentPage - 1) * POSTS_PER_PAGE,
    }),
    prisma.postTag.count({
      where: { tagId: tag.id },
    }),
  ]);

  const postIds = postTags.map((pt) => pt.postId);

  const posts = await prisma.post.findMany({
    where: {
      id: { in: postIds },
      published: true,
    },
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      tags: {
        include: { tag: true },
      },
    },
  });

  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

  const formattedPosts = posts.map((post) => ({
    ...post,
    tags: post.tags.map((t) => t.tag),
  }));

  return (
    <div className="container py-8">
      <div className="mb-8">
        <Badge variant="outline" className="mb-2">标签</Badge>
        <h1 className="text-3xl font-bold">{tag.name}</h1>
      </div>

      {formattedPosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">该标签下暂无文章。</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {formattedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={`/tags/${slug}`}
          />
        </>
      )}
    </div>
  );
}
