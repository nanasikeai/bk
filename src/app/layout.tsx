import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

// 每次请求都重新渲染，避免数据库更新后页面仍显示旧数据
export const dynamic = "force-dynamic";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "我的博客",
    template: "%s | 我的博客",
  },
  description: "使用 Next.js、TypeScript 和 Tailwind CSS 构建的个人博客",
  keywords: ["博客", "技术", "编程", "前端开发"],
  authors: [{ name: "博客作者" }],
  creator: "博客作者",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: baseUrl,
    title: "我的博客",
    description: "使用 Next.js、TypeScript 和 Tailwind CSS 构建的个人博客",
    siteName: "我的博客",
  },
  twitter: {
    card: "summary_large_image",
    title: "我的博客",
    description: "使用 Next.js、TypeScript 和 Tailwind CSS 构建的个人博客",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
