# 部署后测试与监控指南

本指南详细说明了风格提示词管理器应用在部署后如何进行全面的测试、监控和问题排查，确保应用在生产环境中稳定运行并能够快速响应各种问题。

## 1. 功能测试

### 1.1 基础功能验证

部署完成后，首先进行基础功能验证：

```bash
# 使用curl测试应用是否正常响应
curl -I http://your-domain.com

# 检查返回状态码是否为200
# HTTP/1.1 200 OK 表示正常
```

### 1.2 用户界面测试清单

手动测试应用的核心功能：

- [ ] 访问首页，检查UI是否正常加载
- [ ] 登录/注册功能
- [ ] 提示词创建与编辑
- [ ] 提示词分类与标签管理
- [ ] 搜索与筛选功能
- [ ] 导出/导入功能
- [ ] 设置页面功能
- [ ] 响应式布局测试（不同设备尺寸）

### 1.3 自动化测试设置

为持续集成/持续部署设置自动化测试：

```bash
# 安装测试依赖
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# 运行测试
npm test
```

## 2. 性能监控

### 2.1 使用 Lighthouse 进行性能审计

在Chrome浏览器中使用Lighthouse进行性能、可访问性和最佳实践审计：

1. 打开Chrome开发者工具
2. 切换到Lighthouse选项卡
3. 选择桌面或移动设备
4. 勾选性能、可访问性、最佳实践和SEO
5. 点击"Generate report"

### 2.2 服务器性能监控

#### 2.2.1 使用监控工具

```bash
# 安装Node.js监控工具
npm install -g clinic

# 使用clinic进行性能分析
clinic doctor -- node server.js
```

#### 2.2.2 系统资源监控

```bash
# 实时监控CPU和内存使用情况
htop

# 或使用
vmstat 1

# 监控磁盘使用情况
df -h
```

### 2.3 Nginx性能监控

```bash
# 查看Nginx状态（如果已启用status模块）
curl http://localhost/nginx_status

# 分析访问日志
cat /var/log/nginx/access.log | wc -l

# 查看状态码分布
cat /var/log/nginx/access.log | awk '{print $9}' | sort | uniq -c | sort -nr
```

## 3. 错误日志配置与分析

### 3.1 应用日志配置

在应用中添加结构化日志：

```javascript
// 示例：使用winston记录应用日志
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'style-prompt-manager' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// 在开发环境中输出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### 3.2 日志分析脚本

创建日志分析脚本：

```javascript
// analyze_logs.js
const fs = require('fs');
const path = require('path');

function analyzeErrorLogs(logPath) {
  try {
    const data = fs.readFileSync(logPath, 'utf8');
    const lines = data.split('\n');
    
    const errors = [];
    const errorCounts = {};
    
    lines.forEach(line => {
      if (line && line.includes('error') || line.includes('ERROR')) {
        errors.push(line);
        
        // 提取错误类型（简化示例）
        const errorMatch = line.match(/error:\s*(\w+)/i);
        if (errorMatch && errorMatch[1]) {
          const errorType = errorMatch[1];
          errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
        }
      }
    });
    
    console.log('=== 错误日志分析 ===');
    console.log(`总错误数: ${errors.length}`);
    console.log('\n错误类型分布:');
    Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`- ${type}: ${count}次`);
      });
    
    console.log('\n最近10条错误:');
    errors.slice(-10).forEach(err => {
      console.log(err);
    });
    
  } catch (err) {
    console.error('分析日志时出错:', err.message);
  }
}

analyzeErrorLogs('./logs/error.log');
```

### 3.3 使用 ELK Stack 或类似工具

对于生产环境，可以考虑使用 ELK Stack (Elasticsearch, Logstash, Kibana) 或 Graylog 进行集中式日志管理和分析。

## 4. 健康检查设置

### 4.1 应用健康检查端点

在应用中添加健康检查端点：

```javascript
// 在Express或Node.js应用中
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || 'unknown'
  });
});
```

### 4.2 Nginx健康检查配置

```nginx
http {
  # ... 其他配置 ...
  
  upstream app_servers {
    server localhost:3000;
    # ... 其他服务器 ...
  }
  
  server {
    # ... 服务器配置 ...
    
    # 健康检查
    location /health {
      proxy_pass http://app_servers/health;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      
      # 配置健康检查间隔和超时
      health_check interval=5s fails=2 passes=1;
    }
  }
}
```

## 5. 负载测试

### 5.1 使用压测工具

```bash
# 安装ApacheBench
apt-get install apache2-utils  # Ubuntu/Debian
# 或
yum install httpd-tools       # CentOS/RHEL

# 进行基本压测
ab -n 1000 -c 100 http://your-domain.com/
```

### 5.2 使用 Artillery 进行高级压测

```bash
# 安装Artillery
npm install -g artillery

# 创建压测脚本(load_test.yml)
cat > load_test.yml << EOF
config:
  target: "http://your-domain.com"
  phases:
    - duration: 60
      arrivalRate: 5
      rampTo: 50
      name: "预热阶段"
    - duration: 300
      arrivalRate: 50
      name: "持续负载"
scenarios:
  - flow:
    - get:
        url: "/"
    - think: 1
    - get:
        url: "/api/prompts"
EOF

# 运行压测
artillery run load_test.yml
```

## 6. 监控告警设置

### 6.1 使用 Prometheus 和 Grafana

#### 6.1.1 安装 Node Exporter

```bash
# 下载并安装Node Exporter
wget https://github.com/prometheus/node_exporter/releases/download/v1.3.1/node_exporter-1.3.1.linux-amd64.tar.gz
tar xvfz node_exporter-1.3.1.linux-amd64.tar.gz
cd node_exporter-1.3.1.linux-amd64
./node_exporter &
```

#### 6.1.2 配置 Prometheus

创建 `prometheus.yml` 配置文件：

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
  
  - job_name: 'nginx'
    static_configs:
      - targets: ['localhost:9113']
```

### 6.2 使用简单的监控脚本

创建一个监控脚本 `monitor_app.sh`：

```bash
#!/bin/bash

# 监控应用的健康状态
APP_URL="http://localhost:3000/health"
ALERT_EMAIL="your@email.com"

check_health() {
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $APP_URL)
  
  if [ $HTTP_STATUS -ne 200 ]; then
    echo "[ERROR] 应用健康检查失败，状态码: $HTTP_STATUS"
    
    # 发送邮件告警
    echo "应用健康检查失败，请检查服务状态" | mail -s "[告警] 风格提示词管理器应用异常" $ALERT_EMAIL
    
    # 尝试重启应用
    pm2 restart style-prompt-manager
  else
    echo "[OK] 应用健康状态正常"
  fi
}

# 执行检查
check_health
```

设置为定时任务：

```bash
# 每5分钟执行一次
*/5 * * * * /path/to/monitor_app.sh >> /var/log/app_monitor.log 2>&1
```

## 7. 安全监控

### 7.1 安全日志分析

```bash
# 检查SSH登录尝试
grep "Failed password" /var/log/auth.log

# 检查Nginx访问日志中的异常请求
cat /var/log/nginx/access.log | grep -E "(\.php|\.jsp|admin|wp-admin|config)"
```

### 7.2 使用 Fail2ban

```bash
# 安装Fail2ban
apt-get install fail2ban  # Ubuntu/Debian
# 或
yum install fail2ban       # CentOS/RHEL

# 配置Fail2ban
echo "[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
findtime = 300
bantime = 3600" > /etc/fail2ban/jail.local

# 启动Fail2ban
systemctl restart fail2ban
systemctl enable fail2ban
```

## 8. 问题排查流程

### 8.1 常见问题排查步骤

1. **应用无法访问**
   - 检查服务器是否运行：`ping your-server-ip`
   - 检查防火墙设置：`sudo ufw status`
   - 检查Web服务器状态：`systemctl status nginx`
   - 检查应用状态：`pm2 status`

2. **应用崩溃或异常**
   - 查看应用日志：`pm2 logs style-prompt-manager`
   - 检查内存使用：`free -h`
   - 检查磁盘空间：`df -h`

3. **性能问题**
   - 查看CPU和内存使用：`top`
   - 检查数据库连接（如果适用）
   - 分析慢查询日志

### 8.2 系统日志位置

- **Nginx日志**：`/var/log/nginx/`
- **应用日志**：`./logs/` 或 `/var/log/pm2/`
- **系统日志**：`/var/log/syslog` 或 `/var/log/messages`
- **安全日志**：`/var/log/auth.log` 或 `/var/log/secure`

## 9. 自动化备份

### 9.1 数据库备份（如果适用）

```bash
#!/bin/bash

# 数据库备份脚本
DB_NAME="style_prompt_manager"
BACKUP_DIR="/var/backups/db"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
mysqldump -u username -p $DB_NAME > "$BACKUP_DIR/${DB_NAME}_${DATE}.sql"
gzip "$BACKUP_DIR/${DB_NAME}_${DATE}.sql"

# 保留最近30天的备份
find $BACKUP_DIR -name "${DB_NAME}_*.sql.gz" -mtime +30 -delete
```

### 9.2 文件备份

```bash
#!/bin/bash

# 文件备份脚本
APP_DIR="/var/www/style-prompt-manager"
BACKUP_DIR="/var/backups/app"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
tar -czf "$BACKUP_DIR/app_backup_${DATE}.tar.gz" $APP_DIR

# 保留最近7天的备份
find $BACKUP_DIR -name "app_backup_*.tar.gz" -mtime +7 -delete
```

## 10. 持续监控计划

### 10.1 日常监控任务

- 检查应用健康状态
- 查看关键错误日志
- 监控系统资源使用
- 验证SSL证书有效期

### 10.2 定期维护任务

- 每周：清理日志文件
- 每月：更新依赖和安全补丁
- 每季度：性能审计和优化

---

通过实施本指南中的测试和监控策略，您将能够及时发现并解决应用运行中遇到的各种问题，确保风格提示词管理器应用在生产环境中稳定、高效地运行。定期的监控和维护对于保证应用的可靠性和用户体验至关重要。