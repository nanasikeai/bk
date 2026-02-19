import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";

const POSTS_PER_PAGE = 6;

export default async function HomePage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    take: POSTS_PER_PAGE,
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      tags: {
        include: { tag: true },
      },
    },
  });

  const formattedPosts = posts.map((post) => ({
    ...post,
    tags: post.tags.map((t) => t.tag),
  }));

  return (
    <div className="container py-8">
      <section className="mb-12">
        <h1 className="text-4xl font-bold mb-4">欢迎来到我的博客</h1>
        <p className="text-xl text-muted-foreground">
          分享我的想法、观点和经验的地方。
        </p>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">最新文章</h2>
          <Button variant="ghost" asChild>
            <Link href="/posts">查看全部</Link>
          </Button>
        </div>

        {formattedPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">暂无文章，敬请期待！</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {formattedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
