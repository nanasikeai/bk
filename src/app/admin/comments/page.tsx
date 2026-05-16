import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CommentModerationActions } from "@/components/comment-moderation-actions";

const statusText = {
  PENDING: "待审核",
  APPROVED: "已通过",
  REJECTED: "已拒绝",
};

const statusVariant = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "outline",
} as const;

export default async function AdminCommentsPage() {
  const comments = await prisma.comment.findMany({
    include: {
      post: {
        select: {
          title: true,
          slug: true,
        },
      },
    },
    orderBy: [
      { status: "asc" },
      { createdAt: "desc" },
    ],
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">评论管理</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          新评论默认待审核，只有通过后才会展示在文章页。
        </p>
      </div>

      {comments.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">暂无评论。</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>评论</TableHead>
                <TableHead>用户</TableHead>
                <TableHead>文章</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comments.map((comment) => (
                <TableRow key={comment.id}>
                  <TableCell className="max-w-sm whitespace-normal">
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {comment.content}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {comment.githubAvatarUrl && (
                        <img
                          src={comment.githubAvatarUrl}
                          alt={comment.githubLogin || comment.author}
                          className="h-8 w-8 rounded-full"
                        />
                      )}
                      <div>
                        <div className="font-medium">{comment.author}</div>
                        {comment.githubLogin && comment.githubProfileUrl && (
                          <a
                            href={comment.githubProfileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-muted-foreground hover:underline"
                          >
                            @{comment.githubLogin}
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs whitespace-normal">
                    <Link
                      href={`/posts/${comment.post.slug}`}
                      target="_blank"
                      className="hover:underline"
                    >
                      {comment.post.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[comment.status]}>
                      {statusText[comment.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(comment.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <CommentModerationActions
                      commentId={comment.id}
                      status={comment.status}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
