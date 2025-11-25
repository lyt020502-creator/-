#!/usr/bin/env node

import { execSync, exec } from 'child_process';
import fs from 'fs';
import path from 'path';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  let color = colors.blue;
  
  switch(type) {
    case 'success':
      color = colors.green;
      break;
    case 'warning':
      color = colors.yellow;
      break;
    case 'error':
      color = colors.red;
      break;
    case 'info':
    default:
      color = colors.blue;
  }
  
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

async function deployToGitHubPages() {
  try {
    log('开始部署到GitHub Pages...');
    
    // 检查dist目录是否存在，如果存在则备份
    const distDir = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distDir)) {
      log('备份现有dist目录...', 'warning');
      const backupDir = path.join(process.cwd(), `dist_backup_${Date.now()}`);
      fs.renameSync(distDir, backupDir);
    }
    
    // 安装依赖（确保gh-pages已安装）
    log('安装部署依赖...');
    execSync('npm install --save-dev gh-pages', { stdio: 'inherit' });
    
    // 执行构建
    log('执行应用构建...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // 检查构建是否成功
    if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'index.html'))) {
      throw new Error('构建失败：未生成dist目录或index.html文件');
    }
    
    log('构建成功！准备部署...', 'success');
    
    // 执行gh-pages部署
    log('开始上传到GitHub Pages...');
    execSync('npx gh-pages -d dist', { stdio: 'inherit' });
    
    log('部署成功！应用已发布到GitHub Pages。', 'success');
    log(`访问地址: https://lyt020502-creator.github.io/prompt/`, 'success');
    
    // 提示清理
    log('可选：运行 `rm -rf dist_backup_*` 清理备份文件', 'warning');
    
    return true;
  } catch (error) {
    log(`部署失败: ${error.message}`, 'error');
    
    // 尝试恢复备份
    const backupDirs = fs.readdirSync(process.cwd()).filter(dir => 
      dir.startsWith('dist_backup_') && fs.statSync(path.join(process.cwd(), dir)).isDirectory()
    );
    
    if (backupDirs.length > 0) {
      const latestBackup = backupDirs.sort().pop();
      log(`尝试恢复最近的备份: ${latestBackup}`, 'warning');
      try {
        if (fs.existsSync(distDir)) {
          fs.rmdirSync(distDir, { recursive: true });
        }
        fs.renameSync(path.join(process.cwd(), latestBackup), distDir);
        log('备份恢复成功', 'success');
      } catch (restoreError) {
        log(`备份恢复失败: ${restoreError.message}`, 'error');
      }
    }
    
    log('请检查错误信息，修复问题后重试。', 'error');
    return false;
  }
}

// 执行部署
deployToGitHubPages();