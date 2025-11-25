# 域名与SSL证书配置指南

本指南详细说明了如何为风格提示词管理器应用设置域名和配置SSL证书，以确保网站的安全性和可访问性。

## 1. 域名注册与选择

### 1.1 选择合适的域名注册商

以下是一些常用的域名注册商：

- **阿里云域名服务**：https://wanwang.aliyun.com/
- **腾讯云域名服务**：https://dnspod.cloud.tencent.com/
- **Namecheap**：https://www.namecheap.com/
- **GoDaddy**：https://www.godaddy.com/
- **Google Domains**：https://domains.google/

### 1.2 选择和注册域名

选择域名时的建议：
- 简短易记
- 与应用主题相关
- 考虑使用.com、.cn等主流顶级域名
- 避免使用容易混淆的字符

注册流程通常包括：
1. 搜索域名是否可用
2. 添加到购物车并付款
3. 完成域名所有者信息填写
4. 验证邮箱（如需要）

## 2. DNS 配置

### 2.1 配置A记录

将域名指向您的服务器IP地址：

1. 登录域名注册商的管理控制台
2. 找到DNS管理或域名解析设置
3. 添加A记录：
   - 主机记录：`@`（表示域名本身）和`www`（表示www子域名）
   - 记录类型：A
   - 记录值：您的服务器IP地址
   - TTL：默认值或设置为较小值（如600秒，即10分钟）以加快生效速度

### 2.2 验证DNS配置

DNS记录更新可能需要几小时才能全球生效。您可以使用以下命令验证：

```bash
# 检查A记录
dig your_domain.com A

# 检查www子域名
dig www.your_domain.com A
```

或者使用在线工具如：
- https://tool.chinaz.com/dns/
- https://www.whatsmydns.net/

## 3. 安装Certbot获取SSL证书

### 3.1 安装Certbot

在Ubuntu服务器上安装Certbot：

```bash
# 更新软件包列表
sudo apt update

# 安装Certbot和Nginx插件
sudo apt install -y certbot python3-certbot-nginx
```

### 3.2 获取SSL证书

使用Certbot自动获取证书并配置Nginx：

```bash
# 交互式获取证书
sudo certbot --nginx -d your_domain.com -d www.your_domain.com
```

执行过程中会有以下提示：
1. 输入您的邮箱地址（用于证书到期通知）
2. 同意服务条款
3. 是否分享您的邮箱地址（可选）
4. 是否将HTTP重定向到HTTPS（建议选择是）

### 3.3 验证证书安装

安装完成后，您可以通过访问`https://your_domain.com`来验证SSL证书是否生效。浏览器地址栏应该显示安全锁图标。

也可以使用以下命令检查证书信息：

```bash
# 检查证书详情
sudo certbot certificates
```

## 4. 手动配置Nginx以支持HTTPS

如果Certbot未能自动配置Nginx，您可以手动更新配置：

### 4.1 更新Nginx配置文件

编辑您的Nginx配置文件（通常位于`/etc/nginx/sites-available/`目录下）：

```bash
sudo nano /etc/nginx/sites-available/style-prompt-manager
```

### 4.2 添加HTTPS配置

将以下配置添加到您的服务器块中：

```nginx
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;
    # 重定向HTTP到HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your_domain.com www.your_domain.com;

    # SSL证书配置
    ssl_certificate /etc/letsencrypt/live/your_domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your_domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_stapling on;
    ssl_stapling_verify on;
    add_header Strict-Transport-Security "max-age=63072000" always;

    # 应用配置
    root /var/www/style-prompt-manager;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 4.3 测试并重启Nginx

```bash
# 测试配置是否正确
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

## 5. SSL证书自动续期

Let's Encrypt证书有效期为90天，建议设置自动续期：

### 5.1 设置自动续期

Certbot安装时通常会自动设置定时任务，但您可以使用以下命令确保：

```bash
# 检查是否已设置定时任务
sudo systemctl list-timers | grep certbot

# 如果没有设置，手动添加定时任务
echo "0 3 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'" | sudo tee -a /etc/crontab
```

### 5.2 测试自动续期

您可以使用以下命令测试续期过程（不会实际续期，除非证书即将到期）：

```bash
sudo certbot renew --dry-run
```

## 6. SSL证书配置最佳实践

### 6.1 安全增强配置

1. **配置OCSP Stapling**：减少SSL握手时间
   ```nginx
   resolver 8.8.8.8 8.8.4.4 valid=300s;
   resolver_timeout 5s;
   ssl_stapling on;
   ssl_stapling_verify on;
   ```

2. **启用HSTS**：强制浏览器使用HTTPS
   ```nginx
   add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
   ```

3. **禁用不安全的SSL协议**：
   ```nginx
   ssl_protocols TLSv1.2 TLSv1.3;
   ```

### 6.2 SSL性能优化

```nginx
# 优化SSL会话缓存
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_session_tickets off;

# 优化SSL缓冲区
ssl_buffer_size 4k;
```

## 7. Docker环境中的SSL配置

如果使用Docker部署，可以通过以下方式配置SSL：

### 7.1 使用Docker Compose和Nginx

创建`docker-compose.yml`文件：

```yaml
version: '3'

services:
  web:
    build: .
    container_name: style-prompt-manager
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - /etc/letsencrypt:/etc/letsencrypt:ro
```

### 7.2 在Docker容器外处理SSL

另一种方法是在Docker容器外使用反向代理处理SSL，这通常更灵活：

1. 部署应用容器（只暴露80端口）
2. 在主机上安装和配置Nginx
3. 配置Nginx作为反向代理，处理SSL终止

## 8. 常见问题与故障排除

### 8.1 证书验证失败

**问题**：Certbot提示"Failed authorization procedure"

**解决方案**：
- 确保您的域名正确解析到服务器IP
- 确保服务器80端口可以从互联网访问
- 检查防火墙设置，确保允许外部连接
- 如果使用CDN，暂时禁用或正确配置CDN以允许验证请求

### 8.2 浏览器显示不安全警告

**问题**：浏览器仍然显示网站不安全

**解决方案**：
- 检查是否有混合内容（HTTP和HTTPS资源混合）
- 确保所有页面链接都使用HTTPS
- 检查SSL证书是否已正确安装和配置
- 使用SSL Labs测试：https://www.ssllabs.com/ssltest/

### 8.3 证书续期失败

**问题**：自动续期失败

**解决方案**：
- 检查Certbot日志：`/var/log/letsencrypt/letsencrypt.log`
- 确保crontab配置正确
- 手动运行续期命令查看错误信息：`sudo certbot renew -v`

## 9. SSL证书监控

### 9.1 证书到期提醒

虽然Certbot会通过邮件提醒，但您也可以设置额外的监控：

- **UptimeRobot**：提供SSL证书到期监控
- **Zabbix**：可以配置SSL证书到期监控告警
- **自定义脚本**：创建脚本定期检查证书有效期并发送通知

### 9.2 SSL配置安全检测

使用以下工具检查您的SSL配置安全性：

- **SSL Labs**：https://www.ssllabs.com/ssltest/
- **Mozilla Observatory**：https://observatory.mozilla.org/
- **SSL Checker**：https://www.sslshopper.com/ssl-checker.html

---

完成域名和SSL证书配置后，您的风格提示词管理器应用将通过HTTPS安全访问，这不仅保护了用户数据，也提高了网站的可信度和搜索引擎排名。