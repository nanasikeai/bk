import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatDate, generateExcerpt } from "@/lib/utils";
import { QuietLandscape } from "@/components/quiet-landscape";
import type { Post, Category, Tag } from "@/types";

interface PostCardProps {
  post: Pick<Post, "id" | "title" | "slug" | "content" | "excerpt" | "createdAt" | "coverImage" | "viewCount"> & {
    category?: Pick<Category, "name" | "slug"> | null;
    tags?: Pick<Tag, "name" | "slug">[];
  };
  featured?: boolean;
}

export function PostCard({ post, featured = false }: PostCardProps) {
  const excerpt = post.excerpt?.trim() || generateExcerpt(post.content, 120);
  const date = new Date(post.createdAt);
  const href = `/posts/${post.slug}`;

  const metadata = (
    <div className="journal-post-meta">
      {post.category && <Link href={`/categories/${post.category.slug}`} className="text-primary">{post.category.name}</Link>}
      <time dateTime={date.toISOString()}>{formatDate(date)}</time>
      <span>浏览 {post.viewCount}</span>
    </div>
  );

  if (featured) {
    return (
      <article className="journal-featured">
        {metadata}
        <h3><Link href={href}>{post.title}</Link></h3>
        <Link href={href} className="journal-cover-link" aria-label={`阅读：${post.title}`}>
          {post.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.coverImage} alt="" className="journal-cover" />
          ) : <QuietLandscape />}
        </Link>
        {excerpt && <p className="journal-excerpt">{excerpt}</p>}
        <div className="journal-featured-bottom">
          <div className="journal-post-tags">
            {post.tags?.slice(0, 3).map((tag) => <Link key={tag.slug} href={`/tags/${tag.slug}`}># {tag.name}</Link>)}
          </div>
          <Link href={href} className="journal-text-link">展开这篇文字 <ArrowRight aria-hidden="true" /></Link>
        </div>
      </article>
    );
  }

  return (
    <article className="journal-post-row">
      <div className="journal-date-stamp" aria-hidden="true">
        <strong>{String(date.getDate()).padStart(2, "0")}</strong>
        <span>{String(date.getMonth() + 1).padStart(2, "0")} 月 · {date.getFullYear()}</span>
      </div>
      <div className="min-w-0">
        <h3><Link href={href}>{post.title}</Link></h3>
        {excerpt && <p className="journal-excerpt line-clamp-2">{excerpt}</p>}
        {metadata}
      </div>
    </article>
  );
}
