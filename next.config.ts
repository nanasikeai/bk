import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 输出自带运行依赖的独立包，服务器上无需 npm install（见 scripts/deploy.mjs）
  output: "standalone",
  // Prisma 的 Linux 查询引擎不会被自动追踪进独立包
  outputFileTracingIncludes: {
    "/**": [
      "./node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node",
      "./node_modules/.prisma/client/schema.prisma",
    ],
  },
  async rewrites() {
    // 早期图片存于 public/uploads，以 /uploads/xxx 引用；现统一由上传目录提供
    return [{ source: "/uploads/:name", destination: "/api/uploads/:name" }];
  },
};

export default nextConfig;
