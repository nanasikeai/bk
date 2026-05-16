import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSignedSession, verifySignedSession } from "@/lib/signed-cookie";

export const COMMENT_AUTH_COOKIE = "comment-auth";
export const GITHUB_OAUTH_STATE_COOKIE = "github-oauth-state";
export const GITHUB_OAUTH_RETURN_COOKIE = "github-oauth-return";

const COMMENT_SESSION_MAX_AGE = 60 * 60 * 24 * 30;
const OAUTH_STATE_MAX_AGE = 60 * 10;

export interface CommentUser {
  githubId: string;
  login: string;
  name: string | null;
  avatarUrl: string;
  profileUrl: string;
}

export function isSecureCookie() {
  return process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production";
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax" as const,
    maxAge,
    path: "/",
  };
}

export async function getCommentUser(): Promise<CommentUser | null> {
  const cookieStore = await cookies();
  return verifySignedSession<CommentUser>(
    cookieStore.get(COMMENT_AUTH_COOKIE)?.value
  );
}

export function setCommentUserCookie(response: NextResponse, user: CommentUser) {
  response.cookies.set(
    COMMENT_AUTH_COOKIE,
    createSignedSession(user, COMMENT_SESSION_MAX_AGE),
    cookieOptions(COMMENT_SESSION_MAX_AGE)
  );
}

export function clearCommentUserCookie(response: NextResponse) {
  response.cookies.delete(COMMENT_AUTH_COOKIE);
}

export function setOAuthCookies(response: NextResponse, state: string, returnTo: string) {
  response.cookies.set(GITHUB_OAUTH_STATE_COOKIE, state, cookieOptions(OAUTH_STATE_MAX_AGE));
  response.cookies.set(GITHUB_OAUTH_RETURN_COOKIE, returnTo, cookieOptions(OAUTH_STATE_MAX_AGE));
}

export async function getOAuthCookies() {
  const cookieStore = await cookies();
  return {
    state: cookieStore.get(GITHUB_OAUTH_STATE_COOKIE)?.value,
    returnTo: cookieStore.get(GITHUB_OAUTH_RETURN_COOKIE)?.value || "/",
  };
}

export function clearOAuthCookies(response: NextResponse) {
  response.cookies.delete(GITHUB_OAUTH_STATE_COOKIE);
  response.cookies.delete(GITHUB_OAUTH_RETURN_COOKIE);
}

export function sanitizeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}
