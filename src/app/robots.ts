import { MetadataRoute } from "next";

// 运行时生成：站点地址与文章列表取线上环境，而非构建机
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
