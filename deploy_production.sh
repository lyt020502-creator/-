#!/bin/bash

# 风格提示词管理器 - 生产环境部署脚本
# 支持传统部署和Docker容器化部署两种方式

echo "========================================"
echo "风格提示词管理器 - 生产环境部署脚本"
echo "========================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认配置
DEPLOY_METHOD="docker"  # 默认使用Docker部署
SERVER_IP=""           # 服务器IP地址
SERVER_USER=""        # 服务器用户名
SERVER_PATH=""        # 服务器部署路径
NGINX_CONFIG_PATH="/etc/nginx/sites-available/default" # Nginx配置文件路径

# 显示菜单
show_menu() {
    echo -e "\n${BLUE}请选择部署方式:${NC}"
    echo -e "1) ${GREEN}Docker容器化部署${NC} (推荐)"
    echo -e "2) ${GREEN}传统部署${NC} (使用Nginx直接部署)"
    echo -e "3) ${GREEN}退出${NC}"
    read -p "请输入选择 [1-3]: " choice
    
    case $choice in
        1)
            DEPLOY_METHOD="docker"
            echo -e "\n${YELLOW}您选择了Docker容器化部署${NC}"
            ;;
        2)
            DEPLOY_METHOD="traditional"
            echo -e "\n${YELLOW}您选择了传统部署${NC}"
            ;;
        3)
            echo -e "\n${BLUE}退出部署脚本${NC}"
            exit 0
            ;;
        *)
            echo -e "\n${RED}无效选择，请重新输入${NC}"
            show_menu
            ;;
    esac
}

# 获取服务器信息
get_server_info() {
    if [ "$DEPLOY_METHOD" = "traditional" ]; then
        read -p "请输入服务器IP地址: " SERVER_IP
        read -p "请输入服务器用户名: " SERVER_USER
        read -p "请输入服务器部署路径 [默认: /var/www/style-prompt-manager]: " input_path
        SERVER_PATH=${input_path:-/var/www/style-prompt-manager}
    fi
}

# 本地构建应用
build_app() {
    echo -e "\n${BLUE}开始构建应用...${NC}"
    
    # 确保.env.production文件存在
    if [ ! -f ".env.production" ]; then
        if [ -f ".env.local" ]; then
            cp .env.local .env.production
            echo -e "${YELLOW}已从.env.local复制创建.env.production${NC}"
        else
            echo "GEMINI_API_KEY=YOUR_API_KEY" > .env.production
            echo -e "${YELLOW}已创建默认.env.production文件，请在部署前更新API密钥${NC}"
        fi
    fi
    
    # 执行构建
    if [ -f "vite.config.prod.js" ]; then
        npm run build -- --config vite.config.prod.js
    else
        npm run build
    fi
    
    if [ $? -ne 0 ]; then
        echo -e "\n${RED}构建失败！${NC}"
        exit 1
    fi
    
    echo -e "\n${GREEN}应用构建成功！${NC}"
}

# Docker部署
docker_deploy() {
    echo -e "\n${BLUE}开始Docker容器化部署...${NC}"
    
    # 检查Docker是否安装
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}错误: Docker未安装，请先安装Docker${NC}"
        echo -e "安装Docker指南: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # 检查Docker是否在运行
    if ! docker info &> /dev/null; then
        echo -e "${RED}错误: Docker服务未运行，请先启动Docker服务${NC}"
        exit 1
    fi
    
    # 构建Docker镜像
    echo -e "${BLUE}构建Docker镜像...${NC}"
    docker build -t style-prompt-manager .
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}构建Docker镜像失败！${NC}"
        exit 1
    fi
    
    # 停止并移除旧容器（如果存在）
    echo -e "${BLUE}清理旧容器（如果存在）...${NC}"
    docker stop style-prompt-manager 2>/dev/null || true
    docker rm style-prompt-manager 2>/dev/null || true
    
    # 运行新容器
    echo -e "${BLUE}运行Docker容器...${NC}"
    docker run -d \
        --name style-prompt-manager \
        -p 80:80 \
        --restart unless-stopped \
        style-prompt-manager
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}运行Docker容器失败！${NC}"
        exit 1
    fi
    
    echo -e "\n${GREEN}Docker容器化部署成功！${NC}"
    echo -e "${GREEN}应用已在 http://localhost 上运行${NC}"
    echo -e "${YELLOW}使用以下命令查看容器日志: docker logs -f style-prompt-manager${NC}"
    echo -e "${YELLOW}使用以下命令管理容器: docker stop/start/restart style-prompt-manager${NC}"
}

# 传统部署
traditional_deploy() {
    echo -e "\n${BLUE}开始传统部署...${NC}"
    
    # 检查SSH是否可用
    if ! command -v ssh &> /dev/null; then
        echo -e "${RED}错误: SSH客户端未安装${NC}"
        exit 1
    fi
    
    # 创建远程目录
    echo -e "${BLUE}创建远程部署目录...${NC}"
    ssh "$SERVER_USER@$SERVER_IP" "mkdir -p $SERVER_PATH"
    
    # 复制构建产物到服务器
    echo -e "${BLUE}复制构建产物到服务器...${NC}"
    scp -r dist/* "$SERVER_USER@$SERVER_IP:$SERVER_PATH/"
    
    # 复制Nginx配置到服务器
    echo -e "${BLUE}配置Nginx...${NC}"
    ssh "$SERVER_USER@$SERVER_IP" "sudo cp $SERVER_PATH/nginx.conf $NGINX_CONFIG_PATH" || echo -e "${YELLOW}警告: 无法自动配置Nginx，请手动配置${NC}"
    
    # 测试并重启Nginx
    ssh "$SERVER_USER@$SERVER_IP" "sudo nginx -t && sudo systemctl restart nginx" || echo -e "${YELLOW}警告: 无法重启Nginx，请手动检查配置${NC}"
    
    echo -e "\n${GREEN}传统部署完成！${NC}"
    echo -e "${GREEN}应用已部署到 $SERVER_IP:$SERVER_PATH${NC}"
    echo -e "${YELLOW}请确保Nginx配置正确，并在浏览器中访问您的服务器IP或域名${NC}"
}

# 主函数
main() {
    # 检查是否在项目根目录
    if [ ! -f "package.json" ]; then
        echo -e "${RED}错误: 请在项目根目录运行此脚本${NC}"
        exit 1
    fi
    
    # 显示菜单
    show_menu
    
    # 获取服务器信息
    get_server_info
    
    # 构建应用
    build_app
    
    # 根据选择的部署方式执行相应的部署操作
    if [ "$DEPLOY_METHOD" = "docker" ]; then
        docker_deploy
    else
        traditional_deploy
    fi
    
    echo -e "\n========================================"
    echo -e "${GREEN}部署过程已完成！${NC}"
    echo -e "========================================"
}

# 执行主函数
main
