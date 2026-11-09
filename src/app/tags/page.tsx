import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function TagsPage() {
  const tags = await prisma.tag.findMany({
    include: { _count: { select: { posts: { where: { post: { published: true } } } } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="journal-shell journal-page">
      <header className="journal-page-heading">
        <p className="journal-eyebrow"><span className="journal-small-rule" />TOPICS & IDEAS</p>
        <h1 className="journal-heading">从一个话题，遇见更多。</h1>
        <p className="journal-description">沿着感兴趣的关键词，找找那些散落在不同文章里的想法。</p>
      </header>
      {tags.length === 0 ? <div className="journal-empty">暂无标签，话题还在慢慢积累。</div> : (
        <div className="journal-tag-index">
          {tags.map((tag) => <Link key={tag.id} href={`/tags/${tag.slug}`}># {tag.name}<span>{tag._count.posts} 篇</span></Link>)}
        </div>
      )}
    </div>
  );
}
