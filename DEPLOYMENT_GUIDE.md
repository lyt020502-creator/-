# 风格提示词管理器 - 部署指南

## Vercel部署指南

### 步骤1：准备项目

确保您的项目包含以下必要配置：

#### vercel.json 配置说明

项目中的 `vercel.json` 文件包含以下关键配置：

```json
{
  "version": 2,                 // Vercel配置版本
  "builds": [                   // 构建配置
    {
      "src": "package.json",    // 触发构建的源文件
      "use": "@vercel/static-build",  // 使用静态站点构建器
      "config": {
        "distDir": "dist"       // 指定输出目录
      }
    }
  ],
  "routes": [                   // 路由配置
    {
      "handle": "filesystem"     // 先检查文件系统
    },
    {
      "src": "/(.*)",           // 匹配所有路径
      "dest": "/index.html"     // 重定向到index.html（支持SPA）
    }
  ],
  "buildCommand": "npm run build",  // 构建命令
  "outputDirectory": "dist",        // 输出目录
  "cleanUrls": true,                 // 启用干净的URL（移除.html后缀）
  "trailingSlash": false             // 禁用尾部斜杠
}
```

#### package.json 构建脚本

`package.json` 中的构建脚本已正确配置为：

```json
"scripts": {
  "build": "vite build"  // 使用Vite进行构建
}
```

#### vite.config.ts 基础路径配置

由于Vercel部署的URL包含 `/prompt/` 前缀，需要在 `vite.config.ts` 中设置正确的base路径：

```typescript
// vite.config.ts
export default defineConfig({
  base: '/prompt/', // 必须设置为/prompt/以匹配Vercel部署的URL结构
  // 其他配置...
})
```

这些配置确保了Vercel能够正确构建和部署您的React+Vite应用。

### 步骤2：确保代码已推送到GitHub

项目已经配置了Git并连接到GitHub仓库。如果您是首次设置：

```bash
# 初始化Git仓库
git init

# 添加所有文件
git add .

# 提交更改
git commit -m "初始提交"

# 关联GitHub仓库
git remote add origin https://github.com/您的用户名/项目名称.git

# 推送到GitHub
git push -u origin master
```

### 步骤3：在Vercel控制台创建新项目

1. 访问 [Vercel官网](https://vercel.com)
2. 点击右上角的 `Log in` 登录您的账户（如果没有账户，请先注册）
3. 登录后，点击顶部导航栏的 `New Project` 按钮
4. 在项目创建页面，您会看到您的GitHub仓库列表
5. 找到您的项目仓库，点击右侧的 `Import` 按钮

### 步骤4：配置项目设置

在导入仓库后，您需要配置项目设置：

1. **项目名称**：可以使用默认名称或自定义
2. **团队**：选择适合的团队（如果适用）
3. **根目录**：保持默认值（如果项目在仓库根目录）
4. **Framework Preset**：选择 `Vite`
5. **Build Command**：应该会自动检测为 `npm run build`（保持不变）
6. **Output Directory**：应该会自动检测为 `dist`（保持不变）
7. **Environment Variables**：如果项目需要环境变量，在这里添加
8. 点击 `Deploy` 按钮开始部署

### 步骤5：触发部署并验证结果

#### 触发部署

1. 配置完成后，点击 `Deploy` 按钮开始部署过程
2. Vercel会自动克隆您的GitHub仓库并开始构建
3. 部署过程中可以实时查看构建日志

#### 验证部署结果

1. 部署完成后，Vercel会显示部署状态为 `Production Ready`
2. 系统会提供一个自动生成的域名（格式通常为 `您的项目名称.vercel.app`）
3. 点击提供的URL访问您的网站
4. 验证网站的所有功能是否正常工作

#### 常见问题排查

如果部署失败或网站无法正常工作，请检查以下几点：

1. **构建日志错误**：
   - 查看Vercel控制台中的构建日志
   - 注意任何错误信息，特别是依赖安装或构建过程中的错误

2. **路径问题**：
   - 确保所有资源引用路径正确
   - 对于SPA应用，确保路由配置正确（`routes`部分）

3. **环境变量**：
   - 如果项目需要环境变量，确保已在Vercel控制台中正确配置
   - 环境变量更改后需要重新部署

4. **构建配置**：
   - 确认 `buildCommand` 和 `outputDirectory` 与您的项目配置一致
   - 检查 `vercel.json` 中的配置是否正确

5. **依赖问题**：
   - 确保所有依赖都在 `package.json` 中正确声明
   - 可以尝试在本地运行 `npm install` 和 `npm run build` 测试构建

#### 重新部署

如需重新部署项目：

1. 对GitHub仓库进行任何修改并推送到远程
2. Vercel会自动检测变更并触发新的部署
3. 或者在Vercel控制台中点击项目的 `Deploy` 按钮手动触发部署

## 传统服务器部署指南

本指南详细说明了如何将风格提示词管理器应用部署到可公开访问的传统服务器环境。

## 1. 服务器环境准备

### 1.1 选择云服务提供商

根据您的需求和预算，可以选择以下主流云服务提供商：

- **阿里云**：国内访问速度快，有完善的中文支持
- **腾讯云**：国内服务稳定，价格合理
- **AWS**：全球覆盖广，服务丰富
- **Google Cloud**：基础设施先进，适合全球访问
- **DigitalOcean**：简单易用，适合个人开发者

### 1.2 配置服务器实例

**推荐配置**：
- **操作系统**：Ubuntu 20.04 LTS 或 Ubuntu 22.04 LTS
- **CPU**：至少 1 核
- **内存**：至少 2GB RAM
- **存储**：20GB SSD 存储
- **带宽**：根据预期访问量选择

### 1.3 安装必要软件

连接到服务器后，执行以下命令安装必要的软件：

```bash
# 更新软件包列表
sudo apt update

# 安装 Node.js 和 npm (使用 NodeSource 仓库获取最新稳定版本)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 Git
sudo apt install -y git

# 安装 Nginx
sudo apt install -y nginx

# 安装构建工具
sudo apt install -y build-essential

# 验证安装
node -v
npm -v
git --version
nginx -v
```

## 2. 配置服务器安全

### 2.1 设置防火墙

```bash
# 允许 SSH、HTTP 和 HTTPS 连接
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'

# 启用防火墙
sudo ufw enable

# 查看防火墙状态
sudo ufw status
```

### 2.2 配置 SSH 密钥认证

1. 在本地机器生成 SSH 密钥对（如果没有）：
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. 将公钥复制到服务器：
   ```bash
   ssh-copy-id username@server_ip
   ```

3. 禁用密码登录（可选但推荐）：
   ```bash
   sudo nano /etc/ssh/sshd_config
   ```
   将 `PasswordAuthentication yes` 改为 `PasswordAuthentication no`，然后重启 SSH 服务：
   ```bash
   sudo systemctl restart sshd
   ```

### 2.3 关闭不必要的端口

确保只开放必要的端口（通常是 22 用于 SSH，80 用于 HTTP，443 用于 HTTPS）。

## 3. 应用优化与打包

### 3.1 修改环境配置

在部署前，需要更新 `.env.local` 文件中的 API 密钥：

```bash
# 在服务器上创建 .env.local 文件
nano .env.local
```

内容：
```
GEMINI_API_KEY=your_actual_gemini_api_key
```

### 3.2 运行构建命令

在本地或服务器上执行构建：

```bash
# 安装依赖
npm install

# 构建应用
npm run build
```

### 3.3 验证构建产物

确保 `dist` 目录包含以下文件：
- index.html
- assets/index-*.js (JavaScript 打包文件)

## 4. 选择部署方式并实施

### 4.1 传统部署（使用 Nginx）

将构建产物复制到 Nginx 的 web 根目录：

```bash
# 备份默认配置
sudo mv /var/www/html /var/www/html.backup

# 将构建产物复制到 web 根目录
sudo cp -r dist/* /var/www/html/
```

### 4.2 Docker 容器化部署（推荐）

创建 `Dockerfile`：

```dockerfile
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
```

创建 `nginx.conf`：

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

构建并运行 Docker 容器：

```bash
# 构建镜像
docker build -t style-prompt-manager .

# 运行容器
docker run -d -p 80:80 --name style-prompt-manager style-prompt-manager
```

## 5. 配置 Web 服务器

### 5.1 Nginx 配置

编辑 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/default
```

基本配置示例：

```nginx
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 日志配置
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
}
```

### 5.2 验证 Nginx 配置

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 6. 域名设置与 SSL 证书配置

### 6.1 域名注册与 DNS 配置

1. 注册域名（如果还没有）
2. 在域名注册商处设置 A 记录，指向您的服务器 IP 地址

### 6.2 安装 Let's Encrypt SSL 证书

使用 Certbot 自动获取和配置 SSL 证书：

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取并安装证书
sudo certbot --nginx -d your_domain.com -d www.your_domain.com

# 设置自动更新证书
sudo systemctl enable certbot.timer
```

## 7. 配置进程管理

如果需要运行 Node.js 应用（如 API 服务器），使用 PM2 管理进程：

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm run preview -- --port 3000

# 或者使用 PM2 启动
pm install -g pm2
pm run build
pm run preview -- --port 3000 &

# 保存当前进程列表
pm run preview -- --port 3000
pm install -g pm2
pm start preview -- --port 3000

# 设置开机自启动
pm install -g pm2
pm run build
pm start preview -- --port 3000
pm start preview

# 检查进程状态
pm start preview
pm status
```

## 8. 部署后测试与监控

### 8.1 功能测试

1. 访问您的域名（https://your_domain.com）
2. 测试应用的所有主要功能
3. 验证 API 连接是否正常

### 8.2 性能监控

可以使用以下工具监控服务器性能：
- **Prometheus + Grafana**：开源监控解决方案
- **New Relic**：商业监控服务
- **Uptime Robot**：监控网站可用性

### 8.3 错误日志配置

定期检查 Nginx 错误日志：

```bash
# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 查看 Nginx 访问日志
sudo tail -f /var/log/nginx/access.log
```

## 9. 文档编写与维护指南

### 9.1 记录部署配置

创建一个配置文档，记录以下信息：
- 服务器 IP 地址和访问凭证
- 域名配置信息
- SSL 证书有效期
- 应用版本信息
- 环境变量配置

### 9.2 更新流程

制定标准的更新流程：
1. 在本地进行更改和测试
2. 提交代码到版本控制系统
3. 在服务器上拉取最新代码
4. 重新构建应用
5. 验证部署是否成功

## 常见问题与解决方案

### 应用无法连接到 Gemini API
- 检查 API 密钥是否正确
- 确保服务器可以访问互联网
- 检查防火墙设置，允许出站连接

### Nginx 启动失败
- 检查配置文件语法：`sudo nginx -t`
- 检查端口是否被占用：`sudo lsof -i :80`
- 查看错误日志：`sudo tail -f /var/log/nginx/error.log`

### SSL 证书问题
- 检查域名 DNS 解析是否生效
- 确保域名指向正确的服务器 IP
- 使用 Certbot 修复：`sudo certbot renew --force-renewal`

## 紧急回滚方案

如果部署出现严重问题，需要回滚到之前的版本：

```bash
# 备份当前版本
sudo mv /var/www/html /var/www/html.current

# 恢复上一个版本
sudo mv /var/www/html.backup /var/www/html

# 重启 Nginx
sudo systemctl restart nginx
```

---

本指南将帮助您成功部署风格提示词管理器应用到生产环境。如果遇到任何问题，请参考相关章节的解决方案或联系技术支持。