#!/bin/bash

# 服务器安全配置脚本
# 此脚本用于配置Ubuntu服务器的基本安全措施

echo "开始配置服务器安全..."

# 1. 更新系统软件包
echo "更新系统软件包..."
sudo apt update
sudo apt upgrade -y

# 2. 安装必要的安全工具
echo "安装安全工具..."
sudo apt install -y ufw fail2ban rkhunter chkrootkit

# 3. 配置防火墙
echo "配置防火墙..."

# 允许SSH连接
sudo ufw allow OpenSSH

# 允许HTTP和HTTPS连接
sudo ufw allow 'Nginx Full'

# 启用防火墙
sudo ufw --force enable

# 显示防火墙状态
sudo ufw status verbose

# 4. 配置SSH安全
echo "配置SSH安全..."

# 备份原始SSH配置
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

# 修改SSH配置
sudo sed -i 's/#Port 22/Port 22/' /etc/ssh/sshd_config  # 保持默认端口22，如果需要可以修改为其他端口
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config  # 禁止root远程登录
sudo sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config  # 启用公钥认证
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config  # 禁用密码认证
sudo sed -i 's/#ClientAliveInterval 0/ClientAliveInterval 600/' /etc/ssh/sshd_config  # 设置客户端保持活动时间间隔
sudo sed -i 's/#ClientAliveCountMax 3/ClientAliveCountMax 2/' /etc/ssh/sshd_config  # 设置客户端保持活动最大次数

# 重启SSH服务
sudo systemctl restart sshd

# 5. 配置Fail2ban防止暴力破解
echo "配置Fail2ban..."

# 复制配置文件
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# 创建Nginx专用配置
sudo tee /etc/fail2ban/jail.d/nginx.conf > /dev/null << EOF
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600

[nginx-botsearch]
enabled = true
filter = nginx-botsearch
logpath = /var/log/nginx/access.log
maxretry = 2
bantime = 3600
EOF

# 启动Fail2ban并设置开机自启动
sudo systemctl enable fail2ban
sudo systemctl restart fail2ban

# 6. 配置时间同步
echo "配置时间同步..."
sudo apt install -y ntp
sudo systemctl restart ntp

# 7. 禁用不必要的服务
echo "禁用不必要的服务..."
# 根据需要禁用其他服务

# 8. 安装并配置入侵检测工具
echo "配置入侵检测工具..."
sudo rkhunter --propupd  # 更新rkhunter数据库
sudo systemctl enable rkhunter.timer

# 9. 配置系统日志
echo "配置系统日志..."
sudo apt install -y rsyslog
sudo systemctl restart rsyslog

# 10. 限制SU命令使用
echo "配置SU命令限制..."
sudo dpkg-statoverride --update --add root sudo 4750 /bin/su

# 11. 设置文件系统权限
echo "优化文件系统权限..."
# 限制关键文件权限
sudo chmod 600 /etc/shadow
sudo chmod 644 /etc/passwd
sudo chmod 700 /root

# 12. 安装定期安全更新
echo "配置自动安全更新..."
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades

# 13. 检查系统安全状态
echo "检查系统安全状态..."
echo "请手动运行以下命令检查更多安全细节："
echo "1. sudo rkhunter --check"
echo "2. sudo chkrootkit"
echo "3. sudo ufw status"
echo "4. sudo fail2ban-client status"

echo "服务器安全配置完成！请确保："
echo "1. 您已经设置了SSH密钥认证（本脚本已禁用密码登录）"
echo "2. 防火墙已正确配置，只允许必要的端口"
echo "3. 系统已更新到最新安全补丁"
