import path from "path";

// 上传图片目录：线上通过 UPLOAD_DIR 指向发布目录之外的共享目录，避免部署时被覆盖
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
