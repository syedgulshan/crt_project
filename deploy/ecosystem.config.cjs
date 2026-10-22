module.exports = {
  apps: [
    {
      name: 'requirement-analyzer',
      script: 'server/src/index.ts',
      interpreter: 'tsx',
      cwd: '/var/www/requirement-analyzer',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      time: true
    }
  ]
};
