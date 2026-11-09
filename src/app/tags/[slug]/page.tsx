import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/post-card";
import { Pagination } from "@/components/pagination";

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
    <div className="journal-shell journal-page">
      <header className="journal-page-heading">
        <p className="journal-eyebrow"><span className="journal-small-rule" />TOPIC</p>
        <h1 className="journal-heading"># {tag.name}</h1>
        <p className="journal-description">关于这个话题，留下的文字都在这里。</p>
      </header>

      {formattedPosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">该标签下暂无文章。</p>
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
            basePath={`/tags/${slug}`}
          />
        </>
      )}
    </div>
  );
}
