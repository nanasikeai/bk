import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCommentUser } from "@/lib/comment-auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const MIN_COMMENT_LENGTH = 2;
const MAX_COMMENT_LENGTH = 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_PER_USER = 3;
const RATE_LIMIT_PER_IP = 8;

export async function POST(request: NextRequest) {
  try {
    const user = await getCommentUser();
    if (!user) {
      return NextResponse.json(
        { error: "请先使用 GitHub 登录后再评论" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const postId = Number(body.postId);
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!Number.isInteger(postId) || postId <= 0 || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (content.length < MIN_COMMENT_LENGTH || content.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        { error: `评论内容需为 ${MIN_COMMENT_LENGTH}-${MAX_COMMENT_LENGTH} 个字符` },
        { status: 400 }
      );
    }

    const ip = getClientIp(request.headers);
    const userLimit = checkRateLimit(
      `comment:user:${user.githubId}`,
      RATE_LIMIT_PER_USER,
      RATE_LIMIT_WINDOW_MS
    );
    const ipLimit = checkRateLimit(
      `comment:ip:${ip}`,
      RATE_LIMIT_PER_IP,
      RATE_LIMIT_WINDOW_MS
    );

    if (!userLimit.allowed || !ipLimit.allowed) {
      return NextResponse.json(
        {
          error: "评论太频繁了，请稍后再试",
          retryAfterSeconds: Math.max(
            userLimit.retryAfterSeconds,
            ipLimit.retryAfterSeconds
          ),
        },
        { status: 429 }
      );
    }

    // 只允许给已发布文章评论，避免草稿文章被猜 ID 后写入评论。
    const post = await prisma.post.findUnique({
      where: { id: postId, published: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        author: user.name || user.login,
        content,
        status: "PENDING",
        githubId: user.githubId,
        githubLogin: user.login,
        githubAvatarUrl: user.avatarUrl,
        githubProfileUrl: user.profileUrl,
        postId,
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
