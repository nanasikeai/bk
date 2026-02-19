"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  id: number;
  name: string;
}

interface Tag {
  id: number;
  name: string;
}

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  published: boolean;
  categoryId: number | null;
  tags: Tag[];
}

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [published, setPublished] = useState(false);
  const [categoryId, setCategoryId] = useState<string>("none");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/posts/${resolvedParams.id}`)
      .then((res) => res.json())
      .then((data) => {
        setPost(data);
        setTitle(data.title);
        setSlug(data.slug);
        setContent(data.content);
        setExcerpt(data.excerpt || "");
        setCoverImage(data.coverImage || "");
        setPublished(data.published);
        setCategoryId(data.categoryId?.toString() || "none");
        setSelectedTags(data.tags?.map((t: Tag) => t.id) || []);
      });

    fetch("/api/categories")
      .then((res) => res.json())
      .then(setCategories);
    fetch("/api/tags")
      .then((res) => res.json())
      .then(setTags);
  }, [resolvedParams.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      alert("请输入文章内容");
      return;
    }
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/posts/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          content,
          excerpt,
          coverImage,
          published,
          categoryId: categoryId && categoryId !== "none" ? parseInt(categoryId, 10) : null,
          tagIds: selectedTags,
        }),
      });

      if (res.ok) {
        router.push("/admin/posts");
      } else {
        const data = await res.json();
        alert(data.error || "更新文章失败");
      }
    } catch {
      alert("发生错误");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这篇文章吗？")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${resolvedParams.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/admin/posts");
      } else {
        alert("删除文章失败");
      }
    } catch {
      alert("发生错误");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  if (!post) {
    return <div>加载中...</div>;
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">编辑文章</h1>
        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? "删除中..." : "删除"}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">标题</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">链接标识 (slug)</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">内容（所见即所得，支持 Markdown 粘贴）</Label>
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="在此编写内容，支持 Markdown 粘贴导入…"
            minHeight={400}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="excerpt">摘要</Label>
          <Textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="coverImage">封面图片链接</Label>
          <Input
            id="coverImage"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">分类</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">无</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>标签</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Button
                key={tag.id}
                type="button"
                variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleTag(tag.id)}
              >
                {tag.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="published"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-4 w-4"
          />
          <Label htmlFor="published">已发布</Label>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : "保存更改"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/posts">取消</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
