import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, generateExcerpt } from "@/lib/utils";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getCommentUser } from "@/lib/comment-auth";
import { DEFAULT_COVER_IMAGE } from "@/lib/constants";
import { ArrowLeft } from "lucide-react";
import { ArticleToc } from "@/components/article-toc";
import { HtmlRenderer } from "@/components/html-renderer";
import { CommentForm } from "@/components/comment-form";
import { CommentList } from "@/components/comment-list";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug },
    select: { title: true, content: true, excerpt: true, coverImage: true, createdAt: true },
  });

  if (!post) return {};

  const description = post.excerpt?.trim() || generateExcerpt(post.content);

  const baseUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description: description || undefined,
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      url: `${baseUrl}/posts/${slug}`,
      images: [{ url: post.coverImage || DEFAULT_COVER_IMAGE }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: description || undefined,
      images: [post.coverImage || DEFAULT_COVER_IMAGE],
    },
  };
}

const postInclude = {
  category: true,
  tags: {
    include: { tag: true },
  },
  comments: {
    where: { status: "APPROVED" as const },
    orderBy: { createdAt: "desc" as const },
  },
};

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const [commentUser, isAdmin] = await Promise.all([
    getCommentUser(),
    isAdminAuthenticated(),
  ]);

  const post = isAdmin
    ? await prisma.post.findUnique({
        where: { slug, published: true },
        include: postInclude,
      })
    : await prisma.post
        .update({
          where: { slug, published: true },
          data: { viewCount: { increment: 1 } },
          include: postInclude,
        })
        .catch((error) => {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            notFound();
          }
          throw error;
        });

  if (!post) {
    notFound();
  }

  const tags = post.tags.map((t) => t.tag);

  return (
    <div className="journal-shell journal-reader-layout">
      <article className="journal-reader">
        <Link href="/posts" className="journal-back-link"><ArrowLeft aria-hidden="true" />回到文章列表</Link>
        <header className="journal-reader-header">
          <div className="journal-post-meta">
            {post.category && <Link href={`/categories/${post.category.slug}`} className="text-primary">{post.category.name}</Link>}
            <time dateTime={post.createdAt.toISOString()}>{formatDate(post.createdAt)}</time>
            <span>浏览 {post.viewCount}</span>
          </div>
          <h1>{post.title}</h1>
          {post.excerpt?.trim() && <p className="journal-description">{post.excerpt}</p>}
          {post.updatedAt.getTime() - post.createdAt.getTime() > 60 * 1000 && (
            <p className="text-muted-foreground text-xs mt-4">最近编辑于 <time dateTime={post.updatedAt.toISOString()}>{formatDate(post.updatedAt)}</time></p>
          )}
          {tags.length > 0 && <div className="journal-post-tags">{tags.map((tag) => <Link key={tag.id} href={`/tags/${tag.slug}`}># {tag.name}</Link>)}</div>}
        </header>

        {post.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImage} alt={post.title} className="journal-reader-cover" />
        )}
        <div className="journal-reader-body"><HtmlRenderer content={post.content} /></div>

        <section id="comments" className="journal-comments">
          <h2>聊聊你的想法 <span className="text-muted-foreground text-sm font-sans">({post.comments.length})</span></h2>
          <div className="space-y-8">
            <CommentForm postId={post.id} user={commentUser} />
            <CommentList comments={post.comments} />
          </div>
        </section>
      </article>
      <ArticleToc content={post.content} />
    </div>
  );
}
