import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { posts: { where: { published: true } } } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="journal-shell journal-page">
      <header className="journal-page-heading">
        <p className="journal-eyebrow"><span className="journal-small-rule" />COLLECTIONS</p>
        <h1 className="journal-heading">按喜欢的方向，读下去。</h1>
        <p className="journal-description">给文字分几个小抽屉，让每一个想法都有自己的位置。</p>
      </header>
      {categories.length === 0 ? <div className="journal-empty">暂无分类，文字还在慢慢整理。</div> : (
        <div className="journal-taxonomy-grid">
          {categories.map((category) => (
            <Link key={category.id} href={`/categories/${category.slug}`} className="journal-taxonomy-card">
              <div className="flex justify-between items-center gap-3"><h2>{category.name}</h2><ArrowUpRight className="size-4 text-muted-foreground shrink-0" aria-hidden="true" /></div>
              {category.description && <p>{category.description}</p>}
              <p>{category._count.posts} 篇文章</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
