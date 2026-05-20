export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-sm text-muted-foreground">
        <span>© {year} boxboxs</span>
        <span aria-hidden className="text-muted-foreground/60">
          ·
        </span>
        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          粤ICP备2026051173号
        </a>
        <span aria-hidden className="text-muted-foreground/60">
          ·
        </span>
        <a
          href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=44162202000115"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          粤公网安备44162202000115号
        </a>
      </div>
    </footer>
  );
}
