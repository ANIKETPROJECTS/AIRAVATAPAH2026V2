module.exports = {
  apps: [
    {
      name: "krushi-suvidha",
      cwd: "./artifacts/api-server",
      script: "node",
      args: "--enable-source-maps ./dist/index.mjs",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        PORT: 3014,
        NODE_ENV: "production",
        MONGODB_URI: "mongodb+srv://sairajkoyande_db_user:5QlrqFxJrJmM9rR4@cluster0.akmevxg.mongodb.net/?appName=Cluster0",
        DATALAB_API_KEY: "Zgtv3ZTMRajX5sv5v9EqD81nsdUH0rfPwlWJd3SorTI",
        JWT_SECRET: "krushi-suvidha-prod-secret-2026-mh-agri",
      },
    },
  ],
};
