<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 风格提示词管理器

一个强大的风格提示词管理工具，支持从UI图片中提取样式代码，使用DeepSeek API进行智能分析。

## 本地运行

**前置要求:** Node.js


1. 安装依赖:
   `npm install`
2. 设置 `DEEPSEEK_API_KEY` 环境变量
3. 运行应用:
   `npm run dev`

## API密钥配置

该应用支持多种API密钥配置方式：

### 方式1：界面配置（推荐）
1. 点击界面右上角的密钥图标 🔑
2. 在弹出的API密钥设置面板中输入您的DeepSeek API密钥
3. 可以选择保存到本地存储，以便下次使用
4. 点击测试按钮验证密钥是否有效

### 方式2：环境变量配置

创建`.env`文件，添加以下内容：
```
DEEPSEEK_API_KEY=your_actual_api_key_here
```

> 注意：请勿将包含API密钥的`.env`文件提交到代码仓库。`.env`文件已在`.gitignore`中配置为忽略。
> 您可以从DeepSeek开发者平台获取API密钥：https://platform.deepseek.com/

## 部署到GitHub Pages

### 手动部署

1. 确保已安装依赖
```bash
npm install
```

2. 构建应用
```bash
npm run build
```

3. 部署到GitHub Pages
```bash
npm run deploy-gh-pages
```

### 自动部署

该项目配置了简单的部署脚本，可以一键部署到GitHub Pages。部署成功后，应用将可通过以下地址访问：
```
https://lyt020502-creator.github.io/prompt/
```

## 使用说明

### 导入图片生成提示词
1. 点击"导入图片"按钮
2. 上传图片
3. 输入风格描述和额外要求（可选）
4. 点击生成按钮获取AI生成的提示词
5. 保存为模板以便将来使用

### 管理提示词模板
1. 在阅读模式下查看所有模板
2. 切换到编辑模式进行删除操作
3. 点击模板卡片查看详细信息
4. 使用搜索框和标签筛选器快速找到所需模板

## 故障排除

### API密钥无效错误

如果遇到API密钥无效错误，请检查：
1. 确保输入的DeepSeek API密钥正确无误
2. 验证该密钥是否已在DeepSeek开发者平台启用
3. 检查是否有使用限制或配额问题
4. 确认您的网络可以访问DeepSeek API服务
