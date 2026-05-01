module.exports = {
  apps: [
    {
      name: 'agri-admin',
      cwd: './artifacts/agri-admin',
      script: 'pnpm',
      args: 'run dev',
      env: {
        PORT: '8080',
        BASE_PATH: '/',
        NODE_ENV: 'development',
      },
    },
    {
      name: 'api-server',
      cwd: './artifacts/api-server',
      script: 'pnpm',
      args: 'run dev',
      env: {
        PORT: '8081',
        NODE_ENV: 'development',
        MONGODB_DB: 'apnaapp',
      },
    },
  ],
};
