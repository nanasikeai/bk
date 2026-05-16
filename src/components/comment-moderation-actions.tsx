"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type CommentStatus = "PENDING" | "APPROVED" | "REJECTED";

interface CommentModerationActionsProps {
  commentId: number;
  status: CommentStatus;
}

export function CommentModerationActions({
  commentId,
  status,
}: CommentModerationActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const updateStatus = async (nextStatus: CommentStatus) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "更新评论失败");
        return;
      }

      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  const deleteComment = async () => {
    if (!confirm("确定要删除这条评论吗？此操作无法撤销。")) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "删除评论失败");
        return;
      }

      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      {status !== "APPROVED" && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isLoading}
          onClick={() => updateStatus("APPROVED")}
        >
          <Check className="h-4 w-4" />
          通过
        </Button>
      )}
      {status !== "REJECTED" && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isLoading}
          onClick={() => updateStatus("REJECTED")}
        >
          <X className="h-4 w-4" />
          拒绝
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        disabled={isLoading}
        onClick={deleteComment}
      >
        <Trash2 className="h-4 w-4" />
        删除
      </Button>
    </div>
  );
}
