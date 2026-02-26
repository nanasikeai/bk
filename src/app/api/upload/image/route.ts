import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(request: NextRequest) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !file.size) {
      return NextResponse.json(
        { error: "请选择图片文件" },
        { status: 400 }
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "仅支持 JPG、PNG、GIF、WebP 格式" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "图片大小不能超过 5MB" },
        { status: 400 }
      );
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const ext = path.extname(file.name) || ".jpg";
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
    const filePath = path.join(UPLOAD_DIR, name);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    const url = baseUrl ? `${baseUrl}/uploads/${name}` : `/uploads/${name}`;

    return NextResponse.json({ url });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "上传失败" },
      { status: 500 }
    );
  }
}
