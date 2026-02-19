import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";

export default async function TagsPage() {
  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: {
          posts: {
            where: { post: { published: true } },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">标签</h1>

      {tags.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">暂无标签。</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <Link key={tag.id} href={`/tags/${tag.slug}`}>
              <Badge
                variant="outline"
                className="text-base px-4 py-2 transition-all hover:bg-primary hover:text-primary-foreground"
              >
                {tag.name}
                <span className="ml-2 text-muted-foreground group-hover:text-primary-foreground">
                  ({tag._count.posts})
                </span>
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
