import Link from "next/link";
import { ArrowRight, Hash, FolderOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/post-card";

const POSTS_PER_PAGE = 6;

interface HomePageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { category: categorySlug } = await searchParams;
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({
      where: { posts: { some: { published: true } } },
      include: { _count: { select: { posts: { where: { published: true } } } } },
      orderBy: { name: "asc" },
    }),
    prisma.tag.findMany({
      where: { posts: { some: { post: { published: true } } } },
      orderBy: { name: "asc" },
      take: 10,
    }),
  ]);
  const selectedCategory = categories.find((category) => category.slug === categorySlug);
  const posts = await prisma.post.findMany({
    where: { published: true, ...(selectedCategory ? { categoryId: selectedCategory.id } : {}) },
    take: POSTS_PER_PAGE,
    orderBy: { createdAt: "desc" },
    include: { category: true, tags: { include: { tag: true } } },
  });
  const formattedPosts = posts.map((post) => ({ ...post, tags: post.tags.map((t) => t.tag) }));
  const filterCategories = selectedCategory
    ? [...categories.slice(0, 3).filter((category) => category.id !== selectedCategory.id), selectedCategory].slice(-3)
    : categories.slice(0, 3);

  return (
    <div className="journal-shell">
      <section className="journal-hero" aria-labelledby="home-heading">
        <div className="min-w-0">
          <p className="journal-eyebrow"><span className="journal-small-rule" />你好，欢迎来到我的一方小天地</p>
          <h1 id="home-heading">在代码与生活之间，<br />留下一点<em>自己的声音。</em></h1>
          <p className="journal-description">记录折腾技术时的灵光，也收藏平凡日子里的微小快乐。<br className="hidden sm:block" />这里没有标准答案，只有一些认真生活的痕迹。</p>
          <div className="journal-signoff"><span>文字 · 代码 · 日常</span><span aria-hidden="true" /><span>A little corner of the internet.</span></div>
        </div>
        <aside className="journal-margin-note">
          <span className="journal-note-label">A NOTE TO YOU</span>
          <p>互联网很大，<br />能在这里相遇，<br />也是一件很好的事。</p>
          <span className="journal-signature">Enjoy your stay.</span>
        </aside>
      </section>

      <div className="journal-content-grid">
        <section className="min-w-0" aria-labelledby="recent-heading">
          <div className="journal-section-heading">
            <div className="journal-section-title"><h2 id="recent-heading">最近写下的</h2><span>Recent writings</span></div>
            <nav className="journal-filters" aria-label="按文章分类筛选">
              <Link href="/" aria-current={!selectedCategory ? "page" : undefined} scroll={false}>全部</Link>
              {filterCategories.map((category) => (
                <Link key={category.id} href={`/?category=${encodeURIComponent(category.slug)}`} aria-current={selectedCategory?.id === category.id ? "page" : undefined} scroll={false}>{category.name}</Link>
              ))}
            </nav>
          </div>
          {formattedPosts.length === 0 ? (
            <div className="journal-empty"><p>文字还在酝酿中，敬请期待。</p></div>
          ) : formattedPosts.map((post, index) => <PostCard key={post.id} post={post} featured={index === 0} />)}
          <div className="journal-more-row"><Link href={selectedCategory ? `/categories/${selectedCategory.slug}` : "/posts"} className="journal-more-link">翻看所有文章 <ArrowRight aria-hidden="true" /></Link></div>
        </section>

        <aside className="journal-sidebar" aria-label="关于博客与话题">
          <section className="journal-profile">
            <div className="journal-profile-top"><span className="journal-avatar" aria-hidden="true">b.</span><div><h2>boxboxs</h2><p>一个持续探索的小空间</p></div></div>
            <p className="journal-profile-copy">把遇到的问题和偶尔的灵感，<br />都慢慢装进这个小盒子。<br />保持好奇，慢慢生长。</p>
            <div className="journal-profile-foot"><span>想法，都值得被记下。</span><Link href="/posts">翻翻文章 <ArrowRight aria-hidden="true" /></Link></div>
          </section>
          {categories.length > 0 && <section><h2 className="journal-sidebar-title"><FolderOpen aria-hidden="true" />按分类翻阅</h2><div className="journal-category-links">{categories.slice(0, 5).map((category) => <Link key={category.id} href={`/categories/${category.slug}`}><span>{category.name}</span><span>{category._count.posts} 篇</span></Link>)}</div></section>}
          {tags.length > 0 && <section><h2 className="journal-sidebar-title"><Hash aria-hidden="true" />常写的话题</h2><div className="journal-topic-cloud">{tags.map((tag) => <Link key={tag.id} href={`/tags/${tag.slug}`}>{tag.name}</Link>)}</div></section>}
          <section className="journal-side-quote"><span aria-hidden="true">“</span><p>把日子过慢一点，<br />把喜欢的事情做久一点。</p><small>写给自己的小提醒</small></section>
        </aside>
      </div>
    </div>
  );
}
