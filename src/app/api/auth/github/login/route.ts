import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { sanitizeReturnTo, setOAuthCookies } from "@/lib/comment-auth";

function getBaseUrl(request: NextRequest) {
  return process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const returnTo = sanitizeReturnTo(request.nextUrl.searchParams.get("redirect"));

  if (!clientId) {
    const url = new URL(returnTo, request.url);
    url.searchParams.set("commentAuth", "missing-config");
    return NextResponse.redirect(url);
  }

  const state = randomBytes(24).toString("base64url");
  const callbackUrl = new URL("/api/auth/github/callback", getBaseUrl(request));
  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", clientId);
  githubAuthUrl.searchParams.set("redirect_uri", callbackUrl.toString());
  githubAuthUrl.searchParams.set("scope", "read:user");
  githubAuthUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(githubAuthUrl);
  setOAuthCookies(response, state, returnTo);
  return response;
}
