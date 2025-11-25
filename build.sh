#!/bin/bash

# 应用构建脚本
# 用于优化和打包应用程序，为部署做准备

echo "========================================"
echo "风格提示词管理器 - 应用构建脚本"
echo "========================================"

# 检查 Node.js 和 npm 是否已安装
if ! command -v node &> /dev/null; then
    echo "错误: Node.js 未安装，请先安装 Node.js 和 npm"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "错误: npm 未安装，请先安装 npm"
    exit 1
fi

NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)

echo "Node.js 版本: $NODE_VERSION"
echo "npm 版本: $NPM_VERSION"

# 检查项目目录中是否有 package.json
if [ ! -f "package.json" ]; then
    echo "错误: 找不到 package.json 文件，请在项目根目录运行此脚本"
    exit 1
fi

# 创建 .env.production 文件（如果不存在）
if [ ! -f ".env.production" ]; then
    echo "创建 .env.production 文件..."
    cp .env.local .env.production
    echo "请确保 .env.production 中的 API 密钥已正确配置"
fi

# 清理 node_modules 和 dist 目录
echo "清理旧的构建文件..."
rm -rf node_modules
dist="dist"
if [ -d "$dist" ]; then
    rm -rf "$dist"
    echo "已删除旧的 $dist 目录"
fi

# 安装依赖
echo "安装依赖..."
npm ci --production=false

if [ $? -ne 0 ]; then
    echo "错误: 依赖安装失败"
    exit 1
fi

# 执行生产构建
echo "执行生产构建..."

# 使用生产环境的Vite配置文件
if [ -f "vite.config.prod.js" ]; then
    npm run build -- --config vite.config.prod.js
else
    npm run build
fi

if [ $? -ne 0 ]; then
    echo "错误: 构建失败"
    exit 1
fi

# 验证构建产物
echo "验证构建产物..."

# 检查必要的文件是否存在
if [ ! -d "dist" ]; then
    echo "错误: 构建目录不存在"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "错误: 构建产物中缺少 index.html"
    exit 1
fi

# 检查是否有 JavaScript 资源文件
JS_FILE_COUNT=$(find dist -name "*.js" | wc -l)
if [ "$JS_FILE_COUNT" -eq 0 ]; then
    echo "警告: 构建产物中似乎没有 JavaScript 文件"
fi

# 检查构建大小
BUILD_SIZE=$(du -sh dist | cut -f1)
echo "构建产物总大小: $BUILD_SIZE"

# 分析构建产物
echo "构建产物分析:"
find dist -type f -name "*.js" | xargs ls -lh | sort -rh -k5

# 生成构建信息文件
echo "生成构建信息..."
BUILD_DATE=$(date +"%Y-%m-%d %H:%M:%S")
BUILD_INFO_FILE="dist/build-info.json"
echo "{\
  \"buildDate\": \"$BUILD_DATE\",\
  \"nodeVersion\": \"$NODE_VERSION\",\
  \"npmVersion\": \"$NPM_VERSION\",\
  \"buildSize\": \"$BUILD_SIZE\"\
}" > "$BUILD_INFO_FILE"

echo "构建完成！构建信息已保存到 $BUILD_INFO_FILE"
echo "构建产物位于: $(pwd)/dist"
echo "========================================"
echo "提示: 在部署前，请确保:"
echo "1. .env.production 中的环境变量已正确配置"
echo "2. 构建产物已上传到服务器"
echo "3. Web 服务器配置已正确设置"
echo "========================================"
