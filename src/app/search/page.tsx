import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/post-card";
import { Pagination } from "@/components/pagination";
import { SearchX } from "lucide-react";
import type { Prisma } from "@prisma/client";

const POSTS_PER_PAGE = 9;

type PostWithRelations = Prisma.PostGetPayload<{
  include: { category: true; tags: { include: { tag: true } } };
}>;

interface SearchPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, page } = await searchParams;
  const currentPage = parseInt(page || "1", 10);
  const query = q?.trim() || "";

  let posts: PostWithRelations[] = [];
  let total = 0;

  if (query) {
    [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: query } },
            { content: { contains: query } },
            { excerpt: { contains: query } },
          ],
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
          OR: [
            { title: { contains: query } },
            { content: { contains: query } },
            { excerpt: { contains: query } },
          ],
        },
      }),
    ]);
  }

  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

  const formattedPosts = posts.map((post) => ({
    ...post,
    tags: post.tags.map((t) => t.tag),
  }));

  return (
    <div className="journal-shell journal-page">
      <header className="journal-page-heading">
        <p className="journal-eyebrow"><span className="journal-small-rule" />FIND A THOUGHT</p>
        <h1 className="journal-heading">在文字里找一找。</h1>
        {query && (
          <p className="text-muted-foreground">
            {total === 0
              ? `未找到 "${query}" 的相关结果`
              : `找到 ${total} 篇与 "${query}" 相关的文章`}
          </p>
        )}
      </header>

      {!query ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            请输入关键词搜索文章。
          </p>
        </div>
      ) : formattedPosts.length === 0 ? (
        <div className="text-center py-12">
          <SearchX className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            没有找到匹配的文章。
          </p>
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
            basePath={`/search?q=${encodeURIComponent(query)}`}
          />
        </>
      )}
    </div>
  );
}
