import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { posts: { where: { published: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">分类</h1>

      {categories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">暂无分类。</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link key={category.id} href={`/categories/${category.slug}`}>
              <Card className="transition-all hover:shadow-lg hover:border-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {category._count.posts} 篇文章
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
