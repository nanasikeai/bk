/**
 * 一键部署到服务器（本地构建 → 上传 → 服务器切换版本 → 健康检查，失败自动回退）
 *
 *   npm run deploy              构建并发布
 *   npm run deploy -- --db      发布前同步数据库表结构（prisma db push，经 SSH 隧道执行）
 *   npm run deploy -- --skip-build   使用已有构建产物发布
 *   npm run deploy -- --dry-run      只构建和打包，不上传（产物在 .deploy/）
 *   npm run deploy -- --allow-dirty  有未提交改动时不询问，直接部署
 *   npm run rollback            切回服务器上的上一个版本
 *
 * 依赖本机 ~/.ssh/config 中的主机别名（默认 blog，root 登录，可用 DEPLOY_HOST 覆盖），
 * 服务器上以运行博客的 admin 用户身份执行发布。
 */
import { spawn, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline/promises";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const HOST = process.env.DEPLOY_HOST || "blog";
const APP_USER = "admin";
const APP_HOME = `/home/${APP_USER}`;
const asApp = (cmd) => `sudo -u ${APP_USER} -H bash -c "${cmd}"`;
const PRISMA_ENGINE = "libquery_engine-debian-openssl-3.0.x.so.node";
const TUNNEL_PORT = 13306;

const args = process.argv.slice(2);

function run(cmd, cmdArgs, options = {}) {
  const result = spawnSync(cmd, cmdArgs, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32" && cmd === "npm",
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(`命令失败: ${cmd} ${cmdArgs.join(" ")}`);
  }
  return result;
}

function step(title) {
  console.log(`\n▶ ${title}`);
}

function timestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function copyLf(from, to) {
  fs.writeFileSync(to, fs.readFileSync(from, "utf8").replace(/\r\n/g, "\n"));
}

function assembleBundle(bundleDir) {
  const standalone = path.join(root, ".next/standalone");
  if (!fs.existsSync(path.join(standalone, "server.js"))) {
    throw new Error("缺少 .next/standalone/server.js，请先构建（next.config.ts 需 output: standalone）");
  }
  fs.rmSync(bundleDir, { recursive: true, force: true });
  // Windows 下构建产物里有指向 node_modules 的符号链接，必须解引用复制
  fs.cpSync(standalone, bundleDir, { recursive: true, dereference: true });
  fs.cpSync(path.join(root, ".next/static"), path.join(bundleDir, ".next/static"), { recursive: true });
  fs.cpSync(path.join(root, "public"), path.join(bundleDir, "public"), {
    recursive: true,
    filter: (src) => !src.includes(`${path.sep}uploads`),
  });

  // 本地 .env 不能带上线（线上使用 ~/blog/shared/.env）；本地上传的图片、被追踪进来的源码也不需要
  for (const name of fs.readdirSync(bundleDir)) {
    if (name.startsWith(".env") || name === "uploads" || name === "src") {
      fs.rmSync(path.join(bundleDir, name), { recursive: true, force: true });
    }
  }

  const engineDir = path.join(bundleDir, "node_modules/.prisma/client");
  fs.mkdirSync(engineDir, { recursive: true });
  for (const file of [PRISMA_ENGINE, "schema.prisma"]) {
    const src = path.join(root, "node_modules/.prisma/client", file);
    if (!fs.existsSync(src)) {
      throw new Error(`缺少 ${src}，请确认 prisma/schema.prisma 的 binaryTargets 并执行 npx prisma generate`);
    }
    fs.copyFileSync(src, path.join(engineDir, file));
  }

  // 线上是 Linux，去掉 Windows 引擎减小体积
  for (const dir of [engineDir, path.join(bundleDir, ".next/node_modules")]) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir, { recursive: true })) {
      if (String(file).endsWith(".dll.node")) fs.rmSync(path.join(dir, String(file)));
    }
  }

  fs.mkdirSync(path.join(bundleDir, "deploy"), { recursive: true });
  fs.copyFileSync(
    path.join(root, "deploy/ecosystem.config.cjs"),
    path.join(bundleDir, "deploy/ecosystem.config.cjs")
  );
  copyLf(path.join(root, "deploy/remote.sh"), path.join(bundleDir, "deploy/remote.sh"));
}

// 本机安全软件会拦截 Node 直接拉起的 ssh 连接，统一经 bash 调用
const shellQuote = (value) => `'${String(value).replace(/'/g, `'\\''`)}'`;
const sshCommand = (sshArgs) => `exec ssh ${sshArgs.map(shellQuote).join(" ")}`;

function ssh(sshArgs, options) {
  return run("bash", ["-c", sshCommand(sshArgs)], options);
}

// 经 ssh 管道上传（服务器与本机 scp/SFTP 存在兼容问题）
function upload(localFile, remoteFile) {
  const fd = fs.openSync(localFile, "r");
  try {
    ssh([HOST, `cat > ${remoteFile}`], { stdio: [fd, "inherit", "inherit"] });
  } finally {
    fs.closeSync(fd);
  }
}

function readRemoteDatabaseUrl() {
  const result = spawnSync(
    "bash",
    ["-c", sshCommand([HOST, `grep -m1 "^DATABASE_URL=" ${APP_HOME}/blog/shared/.env`])],
    { encoding: "utf8" }
  );
  const line = (result.stdout || "").trim();
  if (result.status !== 0 || !line) throw new Error("读取线上 DATABASE_URL 失败");
  const url = new URL(line.replace(/^DATABASE_URL=/, "").replace(/^(["'])(.*)\1$/, "$2"));
  url.hostname = "127.0.0.1";
  url.port = String(TUNNEL_PORT);
  return url.toString();
}

async function pushDatabaseSchema() {
  step("同步数据库表结构（SSH 隧道 + prisma db push）");
  const databaseUrl = readRemoteDatabaseUrl();
  const tunnel = spawn(
    "bash",
    ["-c", sshCommand(["-N", "-o", "ExitOnForwardFailure=yes", "-L", `${TUNNEL_PORT}:127.0.0.1:3306`, HOST])],
    { stdio: "inherit" }
  );
  try {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    if (tunnel.exitCode !== null) throw new Error("SSH 隧道建立失败");
    run("npx", ["prisma", "db", "push", "--skip-generate"], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      shell: process.platform === "win32",
    });
  } finally {
    tunnel.kill();
  }
}

function git(gitArgs) {
  return spawnSync("git", gitArgs, { cwd: root, encoding: "utf8" }).stdout.trim();
}

// 有未提交改动时需确认，避免线上运行的代码在仓库里找不到
async function confirmCleanWorkTree() {
  const dirty = git(["status", "--porcelain"]);
  if (!dirty) return false;
  console.log("\n⚠ 有未提交的改动，线上将运行仓库中不存在的代码：");
  console.log(dirty.split("\n").map((line) => `    ${line}`).join("\n"));
  if (args.includes("--allow-dirty")) return true;
  if (!process.stdin.isTTY) {
    throw new Error("存在未提交的改动；请先提交，或加 --allow-dirty 强制部署");
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question("  仍要部署吗？(y/N) ");
  rl.close();
  if (answer.trim().toLowerCase() !== "y") throw new Error("已取消部署");
  return true;
}

async function deploy() {
  const version = timestamp();
  const workDir = path.join(root, ".deploy");
  const bundleDir = path.join(workDir, "bundle");
  const archiveName = `blog-${version}.tgz`;

  const dirty = await confirmCleanWorkTree();
  const revision = `${git(["rev-parse", "--short", "HEAD"])}${dirty ? "-dirty" : ""}`;

  if (!args.includes("--skip-build")) {
    step("构建");
    run("npm", ["run", "build"]);
  }

  step("组装发布包");
  fs.mkdirSync(workDir, { recursive: true });
  for (const name of fs.readdirSync(workDir)) {
    fs.rmSync(path.join(workDir, name), { recursive: true, force: true });
  }
  assembleBundle(bundleDir);
  // 记录对应的提交，服务器上 cat ~/blog/current/REVISION 可查
  fs.writeFileSync(path.join(bundleDir, "REVISION"), `${revision}\n`);
  console.log(`  提交 ${revision}`);
  // 用相对路径，避免 GNU tar 把 "C:" 当成远程主机
  run("tar", ["-czf", archiveName, "-C", "bundle", "."], { cwd: workDir });
  const sizeMb = fs.statSync(path.join(workDir, archiveName)).size / 1024 / 1024;
  console.log(`  ${archiveName}  ${sizeMb.toFixed(1)} MB`);
  if (args.includes("--dry-run")) {
    console.log(`  --dry-run：已停止，发布包在 ${path.join(workDir, archiveName)}`);
    return;
  }

  if (args.includes("--db")) await pushDatabaseSchema();

  step(`上传到 ${HOST}`);
  const remoteScript = `/tmp/blog-remote-${version}.sh`;
  const remoteArchive = `/tmp/${archiveName}`;
  upload(path.join(workDir, archiveName), remoteArchive);
  upload(path.join(bundleDir, "deploy/remote.sh"), remoteScript);

  step("服务器切换版本");
  ssh([
    HOST,
    [
      `chmod 644 ${remoteScript} ${remoteArchive}`,
      asApp(`bash ${remoteScript} release ${version} ${remoteArchive}`),
      "code=$?",
      `rm -f ${remoteScript} ${remoteArchive}`,
      "exit $code",
    ].join("; "),
  ]);

  fs.rmSync(workDir, { recursive: true, force: true });
}

async function rollback() {
  step(`回退 ${HOST} 到上一个版本`);
  ssh([HOST, asApp(`bash ${APP_HOME}/blog/remote.sh rollback`)]);
}

try {
  if (args[0] === "rollback") await rollback();
  else await deploy();
} catch (error) {
  console.error(`\n✗ ${error.message}`);
  process.exit(1);
}
