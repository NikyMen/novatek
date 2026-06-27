module.exports = {
  apps: [{
    name: 'novatek',
    script: './dist/server/entry.mjs',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0',
    },
  }],
};
