import { NextResponse } from "next/server";
import { clearCommentUserCookie } from "@/lib/comment-auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearCommentUserCookie(response);
  return response;
}
