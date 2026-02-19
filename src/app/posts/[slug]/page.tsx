import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { DEFAULT_COVER_IMAGE } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { CommentForm } from "@/components/comment-form";
import { CommentList } from "@/components/comment-list";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    select: { slug: true },
  });

  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug },
    select: { title: true, excerpt: true, coverImage: true, createdAt: true },
  });

  if (!post) return {};

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      url: `${baseUrl}/posts/${slug}`,
      images: [{ url: post.coverImage || DEFAULT_COVER_IMAGE }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || undefined,
      images: [post.coverImage || DEFAULT_COVER_IMAGE],
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      category: true,
      tags: {
        include: { tag: true },
      },
      comments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!post || !post.published) {
    notFound();
  }

  const tags = post.tags.map((t) => t.tag);

  return (
    <div className="container py-8">
      <article className="max-w-3xl mx-auto">
        <header className="mb-8">
          {post.category && (
            <Link href={`/categories/${post.category.slug}`}>
              <Badge variant="secondary" className="mb-4">
                {post.category.name}
              </Badge>
            </Link>
          )}
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <time dateTime={post.createdAt.toString()}>
              {formatDate(post.createdAt)}
            </time>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {tags.map((tag) => (
                <Link key={tag.id} href={`/tags/${tag.slug}`}>
                  <Badge variant="outline">{tag.name}</Badge>
                </Link>
              ))}
            </div>
          )}
        </header>

        <img
          src={post.coverImage || DEFAULT_COVER_IMAGE}
          alt={post.title}
          className="w-full aspect-video object-cover rounded-lg mb-8"
        />

        <Separator className="mb-8" />

        <div className="prose-container">
          <MarkdownRenderer content={post.content} />
        </div>

        <Separator className="my-12" />

        <section>
          <h2 className="text-2xl font-bold mb-6">评论 ({post.comments.length})</h2>
          <div className="space-y-8">
            <CommentForm postId={post.id} />
            <CommentList comments={post.comments} />
          </div>
        </section>
      </article>
    </div>
  );
}
