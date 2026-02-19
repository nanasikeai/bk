import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/post-card";
import { Pagination } from "@/components/pagination";

const POSTS_PER_PAGE = 9;

interface PostsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const { page } = await searchParams;
  const currentPage = parseInt(page || "1", 10);

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { published: true },
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
    prisma.post.count({ where: { published: true } }),
  ]);

  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

  const formattedPosts = posts.map((post) => ({
    ...post,
    tags: post.tags.map((t) => t.tag),
  }));

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">全部文章</h1>

      {formattedPosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">暂无文章，敬请期待！</p>
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
            basePath="/posts"
          />
        </>
      )}
    </div>
  );
}
