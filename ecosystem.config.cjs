/**
 * PM2 Ecosystem Configuration for Hostinger VPS
 *
 * Runs the Next.js standalone server with automatic restarts,
 * log management, and cluster mode disabled (Next.js handles its own).
 *
 * Usage:
 *   pm2 start ecosystem.config.cjs --env production
 *   pm2 save
 *   pm2 startup  (enable auto-start on boot)
 */
module.exports = {
  apps: [
    {
      name: "keyword-key",
      script: ".next/standalone/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
      // Restart if process crashes
      autorestart: true,
      // Max restart attempts in 10s window
      max_restarts: 10,
      // Time between restarts
      restart_delay: 3000,
      // Keep app running even if it exits
      min_uptime: "10s",
      // Logs
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_file: "./logs/combined.log",
      merge_logs: true,
      time: true,
      // Watch for file changes (disable in production)
      watch: false,
    },
  ],
};
