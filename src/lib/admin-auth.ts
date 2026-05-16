import { cookies } from "next/headers";
import { createSignedSession, verifySignedSession } from "@/lib/signed-cookie";
import { isSecureCookie } from "@/lib/comment-auth";

const ADMIN_AUTH_COOKIE = "admin-auth";
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

interface AdminSession {
  role: "admin";
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = verifySignedSession<AdminSession>(
    cookieStore.get(ADMIN_AUTH_COOKIE)?.value
  );
  return session?.role === "admin";
}

export async function requireAdminAuth() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    throw new Error("Unauthorized");
  }
}

export function createAdminAuthCookie() {
  return {
    name: ADMIN_AUTH_COOKIE,
    value: createSignedSession<AdminSession>(
      { role: "admin" },
      ADMIN_SESSION_MAX_AGE
    ),
    options: {
      httpOnly: true,
      secure: isSecureCookie(),
      sameSite: "lax" as const,
      maxAge: ADMIN_SESSION_MAX_AGE,
      path: "/",
    },
  };
}

export { ADMIN_AUTH_COOKIE };
