module.exports = { 
  apps: [ 
    { 
      name: "blog", 
      script: "node_modules/next/dist/bin/next", 
      args: "start -p 3000", 
      instances: 1, 
      exec_mode: "fork", 
      autorestart: true, 
      watch: false, 
      max_memory_restart: "1G", 
      env: { 
        NODE_ENV: "production",
        PORT: 3000, 
      }, 
      error_file: "./logs/err.log", 
      out_file: "./logs/out.log", 
      log_date_format: "YYYY-MM-DD HH:mm:ss", merge_logs: true, 
    }, 
  ], 
};
