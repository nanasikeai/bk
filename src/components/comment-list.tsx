import { formatDate } from "@/lib/utils";
import type { Comment } from "@/types";

interface CommentListProps {
  comments: Comment[];
}

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <p className="text-muted-foreground">暂无评论，成为第一个评论者！</p>
    );
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <div key={comment.id} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
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
            <time className="text-sm text-muted-foreground" dateTime={comment.createdAt.toString()}>
              {formatDate(comment.createdAt)}
            </time>
          </div>
          <p className="text-muted-foreground whitespace-pre-wrap">{comment.content}</p>
        </div>
      ))}
    </div>
  );
}
