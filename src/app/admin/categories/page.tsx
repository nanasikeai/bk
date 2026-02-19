"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  _count?: { posts: number };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = () => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then(setCategories);
  };

  useEffect(() => {
    fetchCategories();
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
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description }),
      });

      if (res.ok) {
        setName("");
        setSlug("");
        setDescription("");
        fetchCategories();
      } else {
        const data = await res.json();
        alert(data.error || "创建分类失败");
      }
    } catch {
      alert("发生错误");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个分类吗？")) return;

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchCategories();
      } else {
        alert("删除分类失败");
      }
    } catch {
      alert("发生错误");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">分类管理</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4">添加新分类</h2>
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
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "创建中..." : "创建分类"}
            </Button>
          </form>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">已有分类</h2>
          {categories.length === 0 ? (
            <p className="text-muted-foreground">暂无分类。</p>
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
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{category.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {category.slug}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{category._count?.posts || 0}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
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
