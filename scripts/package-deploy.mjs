/**
 * 生成精简部署目录 deploy-bundle/（可选 deploy-bundle.tgz）
 * 不含：node_modules、.git、.env、源码与仅开发用配置；.next 内去掉缓存/诊断/开发残留以减小体积。
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const BUNDLE = "deploy-bundle";
const outDir = path.join(root, BUNDLE);
const tgzPath = path.join(root, `${BUNDLE}.tgz`);

function rm(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function copyFile(rel) {
  const from = path.join(root, rel);
  const to = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function copyDir(rel) {
  const from = path.join(root, rel);
  const to = path.join(outDir, rel);
  fs.cpSync(from, to, { recursive: true });
}

const nextRoot = path.join(root, ".next");

if (!fs.existsSync(nextRoot)) {
  console.error("缺少 .next，请先执行: npm run build");
  process.exit(1);
}
if (!fs.existsSync(path.join(root, "package-lock.json"))) {
  console.error("缺少 package-lock.json");
  process.exit(1);
}

rm(outDir);
rm(tgzPath);
fs.mkdirSync(outDir, { recursive: true });

for (const f of ["package.json", "package-lock.json", "next.config.ts"]) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) {
    console.error(`缺少 ${f}`);
    process.exit(1);
  }
  copyFile(f);
}

for (const d of ["public", "prisma"]) {
  const p = path.join(root, d);
  if (!fs.existsSync(p)) {
    console.error(`缺少 ${d}/`);
    process.exit(1);
  }
  copyDir(d);
}

fs.cpSync(nextRoot, path.join(outDir, ".next"), {
  recursive: true,
  /** Windows 上 .next 内常有指向根 node_modules 的 symlink，不跟随会 EPERM */
  dereference: true,
  filter(src) {
    const rel = path.relative(nextRoot, src);
    if (!rel) return true;
    const n = rel.split(path.sep).join("/");
    if (n === "cache" || n.startsWith("cache/")) return false;
    if (n === "diagnostics" || n.startsWith("diagnostics/")) return false;
    if (n === "dev" || n.startsWith("dev/")) return false;
    return true;
  },
});

const envExample = path.join(root, ".env.example");
if (fs.existsSync(envExample)) {
  copyFile(".env.example");
}

let archived = false;
try {
  execSync(`tar -caf "${tgzPath}" "${BUNDLE}"`, { cwd: root, stdio: "inherit" });
  archived = true;
} catch {
  console.warn("\n未生成 .tgz（本机无 tar 或执行失败），请手动压缩 deploy-bundle 文件夹。\n");
}

console.log("\n已生成部署包目录:", outDir);
if (archived) console.log("已生成压缩包:", tgzPath);
console.log(
  "\n已剔除: node_modules、.git、.env、src、开发依赖配置；.next 内已去掉 cache / diagnostics / dev。\n服务器上: 解压后 npm ci --omit=dev && npx prisma generate && 新建 .env && npx prisma db push && npm run start\n"
);
