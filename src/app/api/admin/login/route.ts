import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminAuthCookie } from "@/lib/admin-auth";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "密码错误" },
        { status: 401 }
      );
    }

    // 设置签名 cookie，有效期 7 天
    const cookieStore = await cookies();
    const authCookie = createAdminAuthCookie();
    cookieStore.set(authCookie.name, authCookie.value, authCookie.options);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "登录失败" },
      { status: 500 }
    );
  }
}
