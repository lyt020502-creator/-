# 风格提示词管理器 Dockerfile
# 使用多阶段构建优化镜像大小

# ===== 阶段一: 构建应用 =====
FROM node:20-alpine AS build

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --production=false

# 复制项目文件
COPY . .

# 确保.env.production存在，用于构建过程
RUN if [ ! -f .env.production ]; then \
    if [ -f .env.local ]; then \
        cp .env.local .env.production; \
    else \
        echo 'GEMINI_API_KEY=placeholder' > .env.production; \
    fi; \
fi

# 执行构建
RUN npm run build

# ===== 阶段二: 运行应用 =====
# 使用Nginx作为Web服务器
FROM nginx:alpine

# 复制构建产物到Nginx的静态文件目录
COPY --from=build /app/dist /usr/share/nginx/html

# 复制自定义Nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露80端口
EXPOSE 80

# 添加健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]
