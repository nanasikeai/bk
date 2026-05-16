"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { CommentUser } from "@/lib/comment-auth";

interface CommentFormProps {
  postId: number;
  user: CommentUser | null;
  onCommentAdded?: () => void;
}

const MAX_COMMENT_LENGTH = 1000;

export function CommentForm({ postId, user, onCommentAdded }: CommentFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [message, setMessage] = useState("");

  const loginUrl = `/api/auth/github/login?redirect=${encodeURIComponent(
    `${pathname}#comments`
  )}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content }),
      });

      if (res.ok) {
        setContent("");
        setMessage("评论提交成功，等待审核后展示。");
        onCommentAdded?.();
        router.refresh();
      } else {
        const data = await res.json();
        setMessage(data.error || "评论提交失败，请重试。");
      }
    } catch {
      setMessage("发生错误，请重试。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/github/logout", { method: "POST" });
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) {
    const authError = searchParams.get("commentAuth");

    return (
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="mb-4 text-sm text-muted-foreground">
          为了减少垃圾评论，请先使用 GitHub 登录后再发表评论。
        </p>
        {authError && (
          <p className="mb-4 text-sm text-red-600">
            GitHub 登录失败，请检查 OAuth 配置后重试。
          </p>
        )}
        <Button asChild>
          <a href={loginUrl}>使用 GitHub 登录评论</a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
        <div className="flex items-center gap-3">
          <img
            src={user.avatarUrl}
            alt={user.login}
            className="h-9 w-9 rounded-full"
          />
          <div>
            <div className="text-sm font-medium">{user.name || user.login}</div>
            <a
              href={user.profileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground hover:underline"
            >
              @{user.login}
            </a>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isLoggingOut}
          onClick={handleLogout}
        >
          {isLoggingOut ? "退出中..." : "退出"}
        </Button>
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">评论内容</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={4}
          maxLength={MAX_COMMENT_LENGTH}
          placeholder="写下您的评论..."
        />
        <div className="text-right text-xs text-muted-foreground">
          {content.length}/{MAX_COMMENT_LENGTH}
        </div>
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
