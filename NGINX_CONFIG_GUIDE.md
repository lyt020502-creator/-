# Nginx 配置详细指南

本指南提供了针对风格提示词管理器应用的Nginx详细配置说明，包括基本设置、性能优化、安全配置和静态资源处理等。

## 1. 基础Nginx配置

### 1.1 基本站点配置

以下是应用的基本Nginx配置文件，保存为`/etc/nginx/sites-available/style-prompt-manager`：

```nginx
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;

    root /var/www/style-prompt-manager;
    index index.html;

    # 主应用路由
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 1.2 启用站点

创建符号链接并启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/style-prompt-manager /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # 移除默认站点
sudo nginx -t  # 测试配置
sudo systemctl reload nginx  # 重新加载Nginx
```

## 2. 性能优化配置

### 2.1 启用Gzip压缩

在`/etc/nginx/nginx.conf`的`http`块中添加：

```nginx
# Gzip压缩配置
gzip on;
gzip_comp_level 6;
gzip_min_length 256;
gzip_proxied any;
gzip_vary on;
gzip_types
    text/plain
    text/css
    text/js
    text/xml
    text/javascript
    application/javascript
    application/json
    application/xml
    application/rss+xml
    font/opentype
    font/otf
    font/ttf
    image/svg+xml;
gzip_disable "msie6";
```

### 2.2 配置静态资源缓存

在站点配置文件中添加：

```nginx
# 静态资源缓存
location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg|eot)$ {
    expires 7d;
    add_header Cache-Control "public, max-age=604800";
    access_log off;
}
```

### 2.3 调整缓冲区和工作进程

在`/etc/nginx/nginx.conf`的`http`块中添加：

```nginx
# 缓冲区设置
client_body_buffer_size 128k;
client_max_body_size 10m;
client_header_buffer_size 1k;
large_client_header_buffers 4 4k;
output_buffers 1 32k;
postpone_output 1460;

# 连接处理
sendfile on;
tcp_nopush on;
tcp_nodelay on;
keepalive_timeout 65;
```

在`/etc/nginx/nginx.conf`的顶层添加（根据CPU核心数调整）：

```nginx
# 根据CPU核心数调整工作进程
worker_processes auto;
# 使用epoll事件模型
events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}
```

## 3. 安全配置

### 3.1 添加安全头

在站点配置文件的`server`块中添加：

```nginx
# 安全头设置
add_header X-Content-Type-Options nosniff;
add_header X-Frame-Options SAMEORIGIN;
add_header X-XSS-Protection "1; mode=block";
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self';";
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

### 3.2 限制请求频率（防DDoS）

在`http`块中添加限流配置：

```nginx
# 限流配置
limit_req_zone $binary_remote_addr zone=styleprompt:10m rate=10r/s;
```

在站点配置文件中添加：

```nginx
# 应用限流
location / {
    limit_req zone=styleprompt burst=20 nodelay;
    try_files $uri $uri/ /index.html;
}
```

### 3.3 禁用不需要的HTTP方法

```nginx
# 禁用不需要的HTTP方法
if ($request_method !~ ^(GET|POST|HEAD)$) {
    return 405;
}
```

## 4. 完整的优化配置示例

以下是综合了所有优化的完整配置：

```nginx
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;

    # 基本设置
    root /var/www/style-prompt-manager;
    index index.html;

    # 安全头
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self';";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # 限流
    limit_req zone=styleprompt burst=20 nodelay;

    # 仅允许GET、POST和HEAD方法
    if ($request_method !~ ^(GET|POST|HEAD)$) {
        return 405;
    }

    # 静态资源处理
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg|eot)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
        access_log off;
    }

    # API请求（如果需要后端API）
    # location /api/ {
    #     proxy_pass http://localhost:3001/;
    #     proxy_set_header Host $host;
    #     proxy_set_header X-Real-IP $remote_addr;
    #     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    #     proxy_set_header X-Forwarded-Proto $scheme;
    # }

    # 主应用路由
    location / {
        try_files $uri $uri/ /index.html;
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate";
    }

    # 错误页面
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /var/www/style-prompt-manager;
    }

    # 日志配置
    access_log /var/log/nginx/style-prompt-manager.access.log;
    error_log /var/log/nginx/style-prompt-manager.error.log warn;
}
```

## 5. Nginx与Docker集成

如果使用Docker部署，以下是一个适合容器化环境的Nginx配置：

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # 安全头
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";

    # 容器化环境的静态资源处理
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg|eot)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
        access_log off;
    }

    # 主应用路由
    location / {
        try_files $uri $uri/ /index.html;
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate";
    }

    # 健康检查
    location /health {
        return 200 'healthy';
        add_header Content-Type text/plain;
    }
}
```

## 6. 常见问题排查

### 6.1 配置测试和重载

```bash
# 测试配置
sudo nginx -t

# 重载配置
sudo systemctl reload nginx

# 重启Nginx
sudo systemctl restart nginx
```

### 6.2 日志查看

```bash
# 查看错误日志
sudo tail -f /var/log/nginx/error.log

# 查看访问日志
sudo tail -f /var/log/nginx/access.log
```

### 6.3 端口占用检查

```bash
# 检查80端口是否被占用
sudo lsof -i :80
# 或
sudo netstat -tulpn | grep 80
```

### 6.4 常见错误及解决方案

- **404错误**：检查文件路径是否正确，确认`root`指令指向正确的目录
- **502错误**：如果配置了反向代理，检查后端服务是否正常运行
- **403错误**：检查文件和目录权限，确保Nginx用户有访问权限
- **连接被拒绝**：检查防火墙设置，确保80/443端口已开放

## 7. 性能监控

### 7.1 启用Nginx状态页面

在`http`块中添加：

```nginx
# 状态页面配置
location /nginx_status {
    stub_status on;
    access_log off;
    allow 127.0.0.1;  # 只允许本地访问
    deny all;
}
```

安装`nginx-extras`包启用此模块：

```bash
sudo apt install nginx-extras
```

### 7.2 监控工具

- **Nginx Amplify**：官方提供的监控工具
- **Prometheus + Grafana**：开源监控解决方案，可通过nginx-module-vts模块收集指标

---

本指南提供了针对风格提示词管理器应用的全面Nginx配置。根据您的具体部署环境和需求，可能需要进一步调整配置参数。