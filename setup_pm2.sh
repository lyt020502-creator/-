#!/bin/bash

# 颜色定义
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

# 脚本标题
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}    风格提示词管理器 PM2 设置脚本    ${NC}"
echo -e "${GREEN}=========================================${NC}"

# 检查是否有node和npm
echo -e "${YELLOW}检查 Node.js 和 npm 环境...${NC}"
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo -e "${RED}错误: 未找到 Node.js 或 npm。请先安装 Node.js 和 npm。${NC}"
    exit 1
fi

echo -e "${GREEN}Node.js 和 npm 环境检查通过!${NC}"
echo -e "Node.js 版本: $(node -v)"
echo -e "npm 版本: $(npm -v)"

# 检查是否已安装PM2
echo -e "\n${YELLOW}检查 PM2 是否已安装...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 未安装，正在安装...${NC}"
    npm install -g pm2
    if [ $? -ne 0 ]; then
        echo -e "${RED}PM2 安装失败!${NC}"
        exit 1
    fi
    echo -e "${GREEN}PM2 安装成功!${NC}"
else
    echo -e "${GREEN}PM2 已安装!${NC}"
    echo -e "PM2 版本: $(pm2 -v)"
fi

# 创建日志目录
echo -e "\n${YELLOW}创建日志目录...${NC}"
mkdir -p logs
if [ $? -eq 0 ]; then
    echo -e "${GREEN}日志目录创建成功!${NC}"
else
    echo -e "${RED}日志目录创建失败!${NC}"
    exit 1
fi

# 检查ecosystem.config.js文件
if [ ! -f "ecosystem.config.js" ]; then
    echo -e "\n${RED}错误: 未找到 ecosystem.config.js 文件!${NC}"
    echo -e "请确保已创建正确的 PM2 配置文件。"
    exit 1
fi

echo -e "\n${YELLOW}使用配置文件启动应用...${NC}"

# 停止可能正在运行的相同应用
pm stop style-prompt-manager &> /dev/null

# 启动应用
pm start ecosystem.config.js
if [ $? -eq 0 ]; then
    echo -e "${GREEN}应用启动成功!${NC}"
else
    echo -e "${RED}应用启动失败!${NC}"
    echo -e "请检查错误信息。"
    exit 1
fi

# 设置开机自启动
echo -e "\n${YELLOW}设置 PM2 开机自启动...${NC}"

# 生成启动脚本
STARTUP_CMD=$(pm2 startup | grep -o 'sudo.*')
if [ -n "$STARTUP_CMD" ]; then
    eval "$STARTUP_CMD"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}PM2 开机自启动设置成功!${NC}"
    else
        echo -e "${RED}PM2 开机自启动设置失败!${NC}"
        echo -e "请手动执行: $STARTUP_CMD"
    fi
else
    echo -e "${YELLOW}无法自动生成启动脚本命令。请参考 PM2 文档手动设置。${NC}"
fi

# 保存当前进程列表
echo -e "\n${YELLOW}保存当前进程列表...${NC}"
pm save
if [ $? -eq 0 ]; then
    echo -e "${GREEN}进程列表保存成功!${NC}"
else
    echo -e "${RED}进程列表保存失败!${NC}"
fi

# 显示当前进程状态
echo -e "\n${YELLOW}当前 PM2 进程状态:${NC}"
pm list

echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}    PM2 设置完成!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo -e "\n${YELLOW}常用 PM2 命令:${NC}"
echo -e "  - 查看进程状态: ${GREEN}pm2 status${NC}"
echo -e "  - 查看日志: ${GREEN}pm2 logs style-prompt-manager${NC}"
echo -e "  - 重启应用: ${GREEN}pm2 restart style-prompt-manager${NC}"
echo -e "  - 停止应用: ${GREEN}pm2 stop style-prompt-manager${NC}"
echo -e "  - 重载应用: ${GREEN}pm2 reload style-prompt-manager${NC}"
echo -e "  - 监控应用: ${GREEN}pm2 monit${NC}"
echo -e "\n${YELLOW}请确保应用在 http://localhost:3000 可以正常访问。${NC}"