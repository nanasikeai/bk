"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { slugify } from "@/lib/utils";

interface Tag {
  id: number;
  name: string;
  slug: string;
  _count?: { posts: number };
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTags = () => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then(setTags);
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug) {
      setSlug(slugify(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });

      if (res.ok) {
        setName("");
        setSlug("");
        fetchTags();
      } else {
        const data = await res.json();
        alert(data.error || "创建标签失败");
      }
    } catch {
      alert("发生错误");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个标签吗？")) return;

    try {
      const res = await fetch(`/api/tags/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchTags();
      } else {
        alert("删除标签失败");
      }
    } catch {
      alert("发生错误");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">标签管理</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4">添加新标签</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">名称</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "创建中..." : "创建标签"}
            </Button>
          </form>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">已有标签</h2>
          {tags.length === 0 ? (
            <p className="text-muted-foreground">暂无标签。</p>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名称</TableHead>
                    <TableHead>文章数</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{tag.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {tag.slug}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{tag._count?.posts || 0}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(tag.id)}
                        >
                          删除
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
