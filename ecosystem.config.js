module.exports = {
  apps: [
    {
      name: 'migong',
      script: 'npm',
      args: 'start',
      env: {
        PORT: 3000,
        NODE_ENV: 'production',
      },
    },
  ],
};