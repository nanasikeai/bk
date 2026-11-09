import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="journal-shell">
      <div className="journal-footer">
        <div className="space-y-1">
          <Link href="/" className="journal-footer-brand">boxboxs<span className="text-primary">.</span></Link>
          <p>一个记录想法、代码与日常的小地方。</p>
        </div>
        <div className="journal-footer-legal">
          <p>© {year} boxboxs · 慢慢写，慢慢来。</p>
          <div className="flex flex-wrap justify-end gap-x-3 gap-y-1">
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">粤ICP备2026051173号</a>
            <a href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=44162202000115" target="_blank" rel="noopener noreferrer">粤公网安备44162202000115号</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
