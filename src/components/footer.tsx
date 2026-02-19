export function Footer() {
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          使用 Next.js 和 Tailwind CSS 构建。保留所有权利。
        </p>
        <p className="text-center text-sm text-muted-foreground md:text-right">
          {new Date().getFullYear()} 我的博客
        </p>
      </div>
    </footer>
  );
}
