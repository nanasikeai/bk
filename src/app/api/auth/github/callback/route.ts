import { NextRequest, NextResponse } from "next/server";
import {
  clearOAuthCookies,
  getOAuthCookies,
  setCommentUserCookie,
} from "@/lib/comment-auth";

interface GitHubTokenResponse {
  access_token?: string;
  error?: string;
}

interface GitHubUserResponse {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
}

function getBaseUrl(request: NextRequest) {
  return process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
}

function redirectWithStatus(request: NextRequest, returnTo: string, status: string) {
  const url = new URL(returnTo, getBaseUrl(request));
  url.searchParams.set("commentAuth", status);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauth = await getOAuthCookies();

  if (!clientId || !clientSecret) {
    const response = redirectWithStatus(request, oauth.returnTo, "missing-config");
    clearOAuthCookies(response);
    return response;
  }

  if (!code || !state || state !== oauth.state) {
    const response = redirectWithStatus(request, oauth.returnTo, "invalid-state");
    clearOAuthCookies(response);
    return response;
  }

  const callbackUrl = new URL("/api/auth/github/callback", getBaseUrl(request));
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: callbackUrl.toString(),
    }),
  });

  const token = (await tokenResponse.json()) as GitHubTokenResponse;
  if (!tokenResponse.ok || !token.access_token || token.error) {
    const response = redirectWithStatus(request, oauth.returnTo, "token-failed");
    clearOAuthCookies(response);
    return response;
  }

  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!userResponse.ok) {
    const response = redirectWithStatus(request, oauth.returnTo, "profile-failed");
    clearOAuthCookies(response);
    return response;
  }

  const githubUser = (await userResponse.json()) as GitHubUserResponse;
  const response = NextResponse.redirect(new URL(oauth.returnTo, getBaseUrl(request)));
  setCommentUserCookie(response, {
    githubId: String(githubUser.id),
    login: githubUser.login,
    name: githubUser.name,
    avatarUrl: githubUser.avatar_url,
    profileUrl: githubUser.html_url,
  });
  clearOAuthCookies(response);
  return response;
}
