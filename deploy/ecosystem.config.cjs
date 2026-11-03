// pm2 配置：部署时复制到服务器 ~/blog/ecosystem.config.cjs
// 目录结构：
//   ~/blog/current -> releases/<版本>   当前运行版本
//   ~/blog/shared/.env                  环境变量（不随部署覆盖）
//   ~/blog/shared/uploads/              上传的图片
//   ~/blog/shared/logs/                 运行日志
const fs = require("fs");
const path = require("path");

const BASE = __dirname;
const SHARED = path.join(BASE, "shared");

function loadEnv(file) {
  const env = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, "$2");
  }
  return env;
}

module.exports = {
  apps: [
    {
      name: "blog",
      cwd: path.join(BASE, "current"),
      script: "server.js",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "500M",
      env: {
        ...loadEnv(path.join(SHARED, ".env")),
        NODE_ENV: "production",
        PORT: "3000",
        // 只监听本机，由 Nginx 反向代理对外
        HOSTNAME: "127.0.0.1",
        UPLOAD_DIR: path.join(SHARED, "uploads"),
      },
      out_file: path.join(SHARED, "logs/out.log"),
      error_file: path.join(SHARED, "logs/err.log"),
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
