# PM2 进程管理配置指南

本指南详细说明了如何使用PM2进行Node.js应用的进程管理，包括自动重启、负载均衡、日志管理等功能，确保应用稳定运行。

## 1. PM2 简介

PM2是一个Node.js应用的进程管理器，它提供以下核心功能：
- 自动重启应用（崩溃时）
- 负载均衡
- 日志管理
- 应用监控
- 启动脚本生成
- 零停机重载

## 2. PM2 安装

### 2.1 全局安装PM2

在服务器上全局安装PM2：

```bash
npm install -g pm2
```

### 2.2 验证安装

```bash
pm -v
node -v
pm list -g | grep pm2
```

## 3. 基本使用

### 3.1 启动应用

对于风格提示词管理器应用，如果需要使用Node.js预览服务器，可以使用PM2启动：

```bash
# 进入项目目录
cd /var/www/style-prompt-manager

# 启动预览服务
npm run preview -- --port 3000

# 或者使用PM2直接启动Vite预览服务器
pm install -g pm2
cd /var/www/style-prompt-manager
pm run build
pm start preview -- --port 3000

# 使用PM2启动应用
pm start preview -- --port 3000
```

### 3.2 常用PM2命令

```bash
# 查看进程列表
pm status

# 显示进程详情
pm show <app_name>

# 停止应用
npm stop <app_name>

# 重启应用
npm restart <app_name>

# 重载应用（零停机）
npm reload <app_name>

# 删除应用
npm delete <app_name>
```

## 4. 高级配置

### 4.1 使用配置文件

创建一个`ecosystem.config.js`文件来定义应用配置：

```javascript
module.exports = {
  apps: [
    {
      name: 'style-prompt-manager',
      script: 'npm',
      args: 'run preview -- --port 3000',
      instances: 1, // 根据CPU核心数设置，可以是数字或'max'
      exec_mode: 'cluster', // 可选：'cluster' 或 'fork'
      autorestart: true,
      watch: false, // 在生产环境中设置为false
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      },
      // 日志配置
      error_file: '/var/log/pm2/style-prompt-error.log',
      out_file: '/var/log/pm2/style-prompt-output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      // 启动延迟和轮询间隔
      listen_timeout: 5000,
      kill_timeout: 5000
    }
  ]
};
```

### 4.2 使用配置文件启动

```bash
# 使用配置文件启动
pm start ecosystem.config.js

# 停止所有应用
npm stop ecosystem.config.js

# 重启所有应用
npm restart ecosystem.config.js
```

## 5. 日志管理

### 5.1 查看日志

```bash
# 查看最新日志
npm logs

# 查看特定应用的日志
npm logs style-prompt-manager

# 实时查看日志
npm logs style-prompt-manager --lines 100

# 查看错误日志
npm logs style-prompt-manager --err
```

### 5.2 日志轮转

启用日志轮转以防止日志文件过大：

```bash
# 安装日志轮转模块
pm install -g pm2-logrotate

# 设置日志轮转
npm set pm2-logrotate:max_size 50M
npm set pm2-logrotate:interval 1
npm set pm2-logrotate:interval_unit 'day'
npm set pm2-logrotate:compress true

# 应用日志轮转设置
npm set pm2-logrotate:rotateInterval '0 0 * * *'

# 重新启动pm2-logrotate
npm install pm2-logrotate
```

## 6. 设置开机自启动

### 6.1 生成启动脚本

```bash
# 生成开机自启动脚本
npm startup

# 按照输出的提示完成设置
```

### 6.2 保存当前进程列表

```bash
# 保存当前运行的所有进程
npm save
```

这样当服务器重启时，PM2会自动启动所有保存的应用。

## 7. 监控应用

### 7.1 使用内置监控

```bash
# 启动监控仪表盘
npm monit
```

这将打开一个交互式仪表盘，显示CPU和内存使用情况、请求数等。

### 7.2 使用PM2 Plus或PM2 Enterprise

对于更高级的监控，可以使用：
- **PM2 Plus**：免费的基础云监控
- **PM2 Enterprise**：付费的高级监控和分析服务

注册并连接：
```bash
npm link pm2-plus
# 然后按照提示操作
```

## 8. 与Docker结合使用

### 8.1 在Docker中使用PM2

创建一个Dockerfile，使用PM2作为主进程：

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install -g pm2

COPY . .
RUN npm run build

# 复制PM2配置文件
COPY ecosystem.config.js .

# 暴露端口
EXPOSE 3000

# 使用PM2启动应用
CMD ["npm", "start", "ecosystem.config.js"]
```

### 8.2 最佳实践

- 使用`--init-type`指定适合您系统的启动脚本类型
- 配置合理的内存限制（`max_memory_restart`）
- 在Docker容器中使用PM2时，确保正确处理信号

## 9. 性能优化

### 9.1 集群模式配置

对于多核服务器，可以使用集群模式提高性能：

```javascript
// 在ecosystem.config.js中
module.exports = {
  apps: [
    {
      name: 'style-prompt-manager',
      script: 'npm',
      args: 'run preview -- --port 3000',
      instances: 'max', // 使用所有可用CPU核心
      exec_mode: 'cluster',
      // 其他配置...
    }
  ]
};
```

### 9.2 内存管理

```javascript
// 在ecosystem.config.js中
{
  // ...
  max_memory_restart: '1G', // 当内存使用超过1GB时重启
  // ...
}
```

## 10. 常见问题与故障排除

### 10.1 应用无法启动

- 检查日志：`npm logs <app_name>`
- 验证端口是否被占用：`sudo lsof -i :3000`
- 检查Node.js版本兼容性

### 10.2 PM2启动脚本不工作

- 检查系统服务状态：`systemctl status pm2-<username>`
- 重新生成启动脚本：`npm startup`
- 检查用户权限

### 10.3 内存泄漏问题

- 设置合理的`max_memory_restart`
- 定期监控内存使用
- 检查应用代码中的内存泄漏

## 11. 备份与恢复

### 11.1 备份PM2配置

```bash
# 备份当前PM2配置和进程列表
npm dump

# 备份到指定文件
npm dump > pm2_backup.json
```

### 11.2 恢复PM2配置

```bash
# 从备份恢复
npm resurrect

# 或者从文件恢复
npm start pm2_backup.json
```

## 12. 零停机部署

### 12.1 使用PM2进行零停机部署

```bash
# 构建新版本
npm run build

# 重载应用（零停机）
npm reload style-prompt-manager
```

### 12.2 部署工作流

1. 拉取最新代码
2. 安装依赖
3. 构建应用
4. 重载PM2进程

---

通过正确配置PM2，您的风格提示词管理器应用将能够稳定运行，自动处理崩溃恢复，并提供良好的性能监控和日志管理功能。这对于确保应用的高可用性和可靠性至关重要。