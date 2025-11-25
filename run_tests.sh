#!/bin/bash

# 颜色定义
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# 脚本标题
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}    风格提示词管理器 自动化测试脚本    ${NC}"
echo -e "${GREEN}=========================================${NC}"

# 创建测试结果目录
TEST_RESULTS_DIR="./test_results"
mkdir -p $TEST_RESULTS_DIR

# 时间戳
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_LOG="${TEST_RESULTS_DIR}/test_${TIMESTAMP}.log"

# 测试函数定义
function log_message {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $TEST_LOG
}

function run_test {
    local test_name=$1
    local test_command=$2
    
    log_message "${BLUE}开始测试: ${test_name}${NC}"
    echo "--------------------------------------------------" >> $TEST_LOG
    echo "测试名称: $test_name" >> $TEST_LOG
    echo "命令: $test_command" >> $TEST_LOG
    echo "--------------------------------------------------" >> $TEST_LOG
    
    local start_time=$(date +%s)
    local result=$($test_command 2>&1)
    local exit_code=$?
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo "执行时间: ${duration}秒" >> $TEST_LOG
    echo "退出码: $exit_code" >> $TEST_LOG
    echo "输出结果:" >> $TEST_LOG
    echo "$result" >> $TEST_LOG
    
    if [ $exit_code -eq 0 ]; then
        log_message "${GREEN}测试通过: ${test_name}${NC}"
        return 0
    else
        log_message "${RED}测试失败: ${test_name}${NC}"
        log_message "详细信息请查看日志: ${TEST_LOG}"
        return 1
    fi
}

# 检查系统依赖
echo -e "${YELLOW}检查系统依赖...${NC}"

# 检查curl
echo -e "检查 curl..."
if ! command -v curl &> /dev/null; then
    log_message "${RED}错误: curl 未安装，请先安装 curl${NC}"
    exit 1
fi

# 检查必要的环境变量
APP_URL=${APP_URL:-"http://localhost:3000"}
log_message "应用测试URL: ${APP_URL}"

# 1. 基础连通性测试
log_message "${BLUE}\n=== 1. 基础连通性测试 ===${NC}"
run_test "应用可访问性测试" "curl -I -s $APP_URL | grep -q 'HTTP/1.1 200 OK'"
if [ $? -ne 0 ]; then
    log_message "${RED}应用似乎不可访问，请确保应用正在运行且URL正确。${NC}"
    read -p "是否继续测试？(y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 2. 页面加载速度测试
log_message "${BLUE}\n=== 2. 页面加载速度测试 ===${NC}"
run_test "首页加载时间测试" "curl -w '\nTotal: %{time_total}s\nConnect: %{time_connect}s\nTTFB: %{time_starttransfer}s\n' -o /dev/null -s $APP_URL"

# 3. 资源加载测试
log_message "${BLUE}\n=== 3. 资源加载测试 ===${NC}"
run_test "检查关键资源存在" "curl -s $APP_URL | grep -q '<title>'"

# 4. API端点测试（如果适用）
log_message "${BLUE}\n=== 4. API端点测试 ===${NC}"

# 尝试获取提示词列表（如果API端点可用）
log_message "测试 /api/prompts 端点（可选）"
curl -s -o /dev/null -w "%{http_code}" ${APP_URL}/api/prompts > /dev/null
if [ $? -eq 0 ]; then
    run_test "API健康检查" "curl -s -o /dev/null -w '%{http_code}' ${APP_URL}/api/prompts | grep -q '^[23]'"
else
    log_message "${YELLOW}/api/prompts 端点可能不存在或不可访问，跳过此测试${NC}"
fi

# 5. 安全头检查
log_message "${BLUE}\n=== 5. 安全头检查 ===${NC}"

# 检查常见安全头
SECURITY_HEADERS=("Strict-Transport-Security" "X-Content-Type-Options" "X-Frame-Options" "X-XSS-Protection")

for header in "${SECURITY_HEADERS[@]}"; do
    if curl -I -s $APP_URL | grep -q "$header"; then
        log_message "${GREEN}✓ 已设置安全头: $header${NC}"
    else
        log_message "${YELLOW}! 未设置安全头: $header${NC}"
    fi
    sleep 0.5 # 避免请求过快
    done

# 6. 内容验证测试
log_message "${BLUE}\n=== 6. 内容验证测试 ===${NC}"

# 检查页面是否包含关键内容元素
run_test "检查页面标题" "curl -s $APP_URL | grep -i '<title>' | grep -i '提示词'"
run_test "检查样式加载" "curl -s $APP_URL | grep -i '\.css'"
run_test "检查脚本加载" "curl -s $APP_URL | grep -i '\.js'"

# 7. 响应式布局检查提示
log_message "${BLUE}\n=== 7. 响应式布局测试提示 ===${NC}"
log_message "${YELLOW}请手动测试以下响应式布局场景:${NC}"
log_message "- 桌面视图 (1920x1080)"
log_message "- 平板视图 (768x1024)"
log_message "- 手机视图 (375x667)"
log_message "- 检查布局是否正确，内容是否可读"
log_message "- 测试触摸交互元素是否易于点击"

# 8. 模拟负载测试（简单版）
log_message "${BLUE}\n=== 8. 简单负载测试 ===${NC}"
log_message "执行10次请求，检查应用稳定性..."

FAILURES=0
for i in {1..10}; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" $APP_URL)
    if [[ ! $STATUS =~ ^[23] ]]; then
        log_message "${RED}请求 $i 失败，状态码: $STATUS${NC}"
        ((FAILURES++))
    else
        echo -n "." | tee -a $TEST_LOG
    fi
    sleep 0.2 # 避免请求过快
    done
echo

if [ $FAILURES -eq 0 ]; then
    log_message "${GREEN}负载测试通过: 所有请求成功${NC}"
else
    log_message "${YELLOW}负载测试警告: $FAILURES 次请求失败${NC}"
fi

# 9. 检查应用日志中的错误
log_message "${BLUE}\n=== 9. 日志错误检查 ===${NC}"

# 检查常见日志位置中的错误
LOG_LOCATIONS=("logs/error.log" "logs/output.log" "/var/log/pm2/style-prompt-error.log" "/var/log/nginx/error.log")

for log_file in "${LOG_LOCATIONS[@]}"; do
    if [ -f "$log_file" ]; then
        log_message "检查日志文件: $log_file"
        ERROR_COUNT=$(grep -i "error\|exception\|fail\|critical" "$log_file" | wc -l)
        if [ $ERROR_COUNT -eq 0 ]; then
            log_message "${GREEN}✓ 未发现错误${NC}"
        else
            log_message "${RED}! 发现 $ERROR_COUNT 个错误记录${NC}"
            log_message "查看最近5条错误:"
            grep -i "error\|exception\|fail\|critical" "$log_file" | tail -5
        fi
    else
        log_message "${YELLOW}日志文件不存在: $log_file${NC}"
    fi
done

# 测试报告生成
log_message "${BLUE}\n=== 测试报告生成 ===${NC}"
log_message "测试日志已保存到: ${TEST_LOG}"

# 总结
echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}        测试完成！${NC}"
echo -e "${GREEN}=========================================${NC}"
echo -e "详细测试结果请查看: ${BLUE}${TEST_LOG}${NC}"
echo -e "\n后续建议:"
echo -e "1. 定期运行此测试脚本监控应用状态"
echo -e "2. 考虑实施更全面的自动化测试方案"
echo -e "3. 部署监控系统进行实时监控"
echo -e "4. 配置告警机制及时响应问题"
echo -e "\n更多测试详情请参考 TESTING_MONITORING_GUIDE.md 文件"