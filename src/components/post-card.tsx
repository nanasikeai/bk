import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { DEFAULT_COVER_IMAGE } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Post, Category, Tag } from "@/types";

interface PostCardProps {
  post: Pick<Post, "id" | "title" | "slug" | "excerpt" | "createdAt" | "coverImage"> & {
    category?: Pick<Category, "name" | "slug"> | null;
    tags?: Pick<Tag, "name" | "slug">[];
  };
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <Link href={`/posts/${post.slug}`}>
        <div className="aspect-video overflow-hidden">
          <img
            src={post.coverImage || DEFAULT_COVER_IMAGE}
            alt={post.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
        </div>
        <CardHeader className="p-4">
          {post.category && (
            <Badge variant="secondary" className="w-fit mb-2">
              {post.category.name}
            </Badge>
          )}
          <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {post.excerpt && (
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
              {post.excerpt}
            </p>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <time dateTime={post.createdAt.toString()}>
              {formatDate(post.createdAt)}
            </time>
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {post.tags.slice(0, 3).map((tag) => (
                <Badge key={tag.slug} variant="outline" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
