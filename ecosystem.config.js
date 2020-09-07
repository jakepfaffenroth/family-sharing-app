module.exports = {
  apps : [{
	name: "carousel",
	"cwd": "./carousel",
    script: "./bin/www",
    args : "--require ./bin/config.js",
	exec_mode: "cluster",
    instances: "max",
    watch: true,
	"ignore_watch" : [ "./log", "./node_modules","./.git", "./sessions","./sessions/*", "./private/files/**/*", "./private/imgs/**/*" ],
	env: {
      NODE_ENV: "development",
      LD_PRELOAD:"/usr/lib/x86_64-linux-gnu/libjemalloc.so.1",
PM2_REDIS_PWD:"m!z9x7G-tPULC6!6nkJ.-c3HK6au-38ytWH!wUQNsdUMQCx!TweK9!@tfZWGVAbxc9gZWi8avnLAyxRWCDZA8Xy79*F9!Y7uQ!@g"
	},
	env_debug: {
	  NODE_ENV: "production",
	  DEBUG: ".",
      LD_PRELOAD:"/usr/lib/x86_64-linux-gnu/libjemalloc.so.1",
PM2_REDIS_PWD:"m!z9x7G-tPULC6!6nkJ.-c3HK6au-38ytWH!wUQNsdUMQCx!TweK9!@tfZWGVAbxc9gZWi8avnLAyxRWCDZA8Xy79*F9!Y7uQ!@g"
	},
	env_production: {
      NODE_ENV: "production",
      LD_PRELOAD:"/usr/lib/x86_64-linux-gnu/libjemalloc.so.1",
PM2_REDIS_PWD:"m!z9x7G-tPULC6!6nkJ.-c3HK6au-38ytWH!wUQNsdUMQCx!TweK9!@tfZWGVAbxc9gZWi8avnLAyxRWCDZA8Xy79*F9!Y7uQ!@g"
    },
  }],

  deploy : {
    production : {
      user : 'SSH_USERNAME',
      host : 'SSH_HOSTMACHINE',
      ref  : 'origin/master',
      repo : 'GIT_REPOSITORY',
      path : 'DESTINATION_PATH',
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
