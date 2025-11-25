# SSH密钥配置指南

由于安全脚本中已禁用密码登录，SSH密钥认证是连接服务器的唯一方式。本指南将帮助您设置SSH密钥。

## 1. 在本地机器上生成SSH密钥对

### 在macOS或Linux上：

1. 打开终端
2. 运行以下命令生成SSH密钥对：
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```
   （如果您的系统不支持ed25519算法，可以使用：
   ```bash
   ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
   ```
   ）
3. 系统会提示您指定密钥保存位置，默认为`~/.ssh/id_ed25519`，通常可以直接按回车接受默认值
4. 输入一个强密码短语保护您的私钥（可选但推荐）

### 在Windows上：

1. 打开PowerShell或命令提示符
2. 运行与macOS/Linux相同的命令

## 2. 查看并复制公钥

### 在macOS或Linux上：

```bash
cat ~/.ssh/id_ed25519.pub
```
复制输出的文本内容

### 在Windows上：

```bash
type %USERPROFILE%\.ssh\id_ed25519.pub
```
复制输出的文本内容

## 3. 将公钥添加到服务器

### 方法一：通过SSH复制（如果尚未禁用密码登录）

在本地终端运行：
```bash
ssh-copy-id username@server_ip
```

### 方法二：手动添加（如果已经禁用密码登录）

1. 先在服务器上创建SSH目录（如果不存在）：
   ```bash
   ssh username@server_ip "mkdir -p ~/.ssh"
   ```
2. 将公钥追加到授权密钥文件：
   ```bash
   cat ~/.ssh/id_ed25519.pub | ssh username@server_ip "cat >> ~/.ssh/authorized_keys"
   ```
3. 设置正确的权限：
   ```bash
   ssh username@server_ip "chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
   ```

## 4. 测试SSH密钥认证

尝试使用密钥连接到服务器：
```bash
ssh username@server_ip
```

如果设置了密码短语，系统会提示您输入该短语。如果一切正常，您应该能够成功连接到服务器，而不需要输入服务器密码。

## 5. 配置SSH客户端（可选）

在本地机器上创建或编辑SSH配置文件，简化连接过程：

```bash
nano ~/.ssh/config
```

添加以下内容：

```
Host style-prompt-server
    HostName server_ip_or_domain
    User your_username
    IdentityFile ~/.ssh/id_ed25519
    Port 22  # 如果您修改了SSH端口，请相应更新
```

保存并退出编辑器。现在您可以使用更简单的命令连接：
```bash
ssh style-prompt-server
```

## 6. 安全建议

- 永远不要分享您的私钥文件（`id_ed25519`）
- 定期更换SSH密钥（每6-12个月）
- 如果您的私钥文件丢失或被盗，立即从服务器的`authorized_keys`文件中删除对应的公钥
- 考虑使用SSH代理来管理多个密钥和密码短语

## 7. 备份SSH密钥

将您的SSH密钥备份到安全的位置（如云存储、加密USB驱动器等）：

```bash
# 压缩密钥目录
zip -r ~/ssh_keys_backup.zip ~/.ssh/id_ed25519 ~/.ssh/id_ed25519.pub
```

确保备份文件安全存储并加密保护。