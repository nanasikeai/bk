"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CommentFormProps {
  postId: number;
  onCommentAdded?: () => void;
}

export function CommentForm({ postId, onCommentAdded }: CommentFormProps) {
  const [author, setAuthor] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, author, email, content }),
      });

      if (res.ok) {
        setAuthor("");
        setEmail("");
        setContent("");
        setMessage("评论提交成功！");
        onCommentAdded?.();
      } else {
        setMessage("评论提交失败，请重试。");
      }
    } catch {
      setMessage("发生错误，请重试。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="author">昵称</Label>
          <Input
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
            placeholder="您的昵称"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">邮箱</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">评论内容</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={4}
          placeholder="写下您的评论..."
        />
      </div>
      {message && (
        <p className={message.includes("成功") ? "text-green-600" : "text-red-600"}>
          {message}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "提交中..." : "提交评论"}
      </Button>
    </form>
  );
}
