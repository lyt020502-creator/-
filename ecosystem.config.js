module.exports = {
  apps: [
    {
      // 应用名称
      name: 'style-prompt-manager',
      
      // 启动脚本命令
      script: 'npm',
      
      // 脚本参数
      args: 'run preview -- --port 3000',
      
      // 实例数量，根据服务器CPU核心数调整
      // 对于前端应用，通常1个实例就足够
      instances: 1,
      
      // 执行模式
      // 'cluster' 用于多进程负载均衡（适用于API服务）
      // 'fork' 用于单进程应用（适用于前端预览服务）
      exec_mode: 'fork',
      
      // 自动重启（应用崩溃或异常退出时）
      autorestart: true,
      
      // 监听文件变化（开发环境可以设置为true，生产环境设置为false）
      watch: false,
      
      // 忽略的文件或目录（在watch为true时有效）
      ignore_watch: ['node_modules', 'logs', 'dist'],
      
      // 内存限制，超过此限制会自动重启应用
      max_memory_restart: '1G',
      
      // 环境变量
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      
      // 日志配置
      error_file: './logs/error.log', // 错误日志路径
      out_file: './logs/output.log', // 输出日志路径
      log_date_format: 'YYYY-MM-DD HH:mm:ss', // 日志时间格式
      merge_logs: true, // 合并多实例日志
      
      // 启动配置
      listen_timeout: 5000, // 监听超时时间
      kill_timeout: 5000, // 停止超时时间
      restart_delay: 4000, // 重启延迟时间
      
      // 健康检查
      // 对于预览服务器，可以通过HTTP请求进行健康检查
      // healthcheck: {
      //   interval: 30000,
      //   timeout: 3000,
      //   max_retries: 3
      // }
    }
  ],

  // 部署配置（可选，用于自动化部署）
  deploy: {
    // 生产环境
    production: {
      user: 'deploy', // SSH用户名
      host: 'your-server-ip', // 服务器IP
      ref: 'origin/main', // Git分支
      repo: 'git@github.com:yourusername/style-prompt-manager.git', // Git仓库
      path: '/var/www/style-prompt-manager', // 部署路径
      'post-deploy': 'npm install && npm run build && npm reload ecosystem.config.js', // 部署后脚本
      env: {
        NODE_ENV: 'production'
      }
    },
    
    // 开发环境（可选）
    development: {
      user: 'deploy',
      host: 'dev-server-ip',
      ref: 'origin/develop',
      repo: 'git@github.com:yourusername/style-prompt-manager.git',
      path: '/var/www/style-prompt-manager-dev',
      'post-deploy': 'npm install && npm run build && npm reload ecosystem.config.js',
      env: {
        NODE_ENV: 'development'
      }
    }
  }
};