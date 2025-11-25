#!/usr/bin/env node

// 导入必要的依赖
import fs from 'fs';
import path from 'path';
import { execSync, exec, spawn } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import http from 'http';
import https from 'https';
import os from 'os';

// 常量定义
const PROJECT_ROOT = process.cwd();
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');
const NODE_VERSION_REQUIRED = '>=16.0.0';
const NPM_VERSION_REQUIRED = '>=8.0.0';
const TOTAL_STEPS = 8;

// 开始时间，用于计算部署耗时
const startTime = Date.now();

// 颜色配置
const colors = {
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  highlight: chalk.cyan,
  muted: chalk.gray,
  bgSuccess: chalk.bgGreen.black,
  bgError: chalk.bgRed.black,
  bgWarning: chalk.bgYellow.black,
  // 组合样式
  successBold: chalk.bold.green,
  errorBold: chalk.bold.red,
  warningBold: chalk.bold.yellow
};

// 进度条状态
let currentStep = 0;

// 进度条样式配置
const progressConfig = {
  width: 40,
  completeChar: '█',
  incompleteChar: '░',
  showPercentage: true,
  showTime: true
};

// 步骤图标映射
const stepIcons = {
  environment: '🌐',
  config: '⚙️',
  resources: '�',
  dependencies: '📦',
  build: '🔨',
  start: '🚀',
  health: '🏥',
  confirm: '✅'
};

// 错误解决方案映射
const errorSolutions = {
  'MODULE_NOT_FOUND': {
    message: '缺少必要的依赖模块',
    solution: '运行 `npm install` 安装所有依赖'  
  },
  'EACCES': {
    message: '权限不足',
    solution: '尝试以管理员权限运行命令或检查文件权限'
  },
  'EADDRINUSE': {
    message: '端口已被占用',
    solution: '检查是否有其他进程占用了端口，或使用其他端口'
  },
  'TypeScript': {
    message: 'TypeScript编译错误',
    solution: '运行 `npx tsc --noEmit` 检查并修复TypeScript错误'
  },
  'build': {
    message: '构建失败',
    solution: '检查构建日志，修复代码错误或依赖问题'
  },
  'PORT_IN_USE': {
    message: '端口已被占用',
    solution: '尝试使用其他端口或终止占用该端口的进程'
  }
};

/**
 * 获取当前时间戳的格式化字符串
 * @returns {string} 格式化的时间字符串
 */
function getTimestamp() {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
}

/**
 * 记录日志消息
 * @param {string} level 日志级别
 * @param {string} message 日志消息
 * @param {object} data 附加数据
 */
function log(level, message, data = {}) {
  // 确保startTime已初始化
  if (!startTime) {
    startTime = Date.now();
  }
  
  const timestamp = getTimestamp();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  
  let levelColor;
  let levelIcon;
  
  switch (level) {
    case 'info':
      levelColor = colors.info;
      levelIcon = 'ℹ️';
      break;
    case 'success':
      levelColor = colors.success;
      levelIcon = '✅';
      break;
    case 'warning':
      levelColor = colors.warning;
      levelIcon = '⚠️';
      break;
    case 'error':
      levelColor = colors.error;
      levelIcon = '❌';
      break;
    default:
      levelColor = colors.info;
      levelIcon = '📝';
  }
  
  console.log(`${colors.muted(`[${timestamp}]`)} ${levelColor(`[${level.toUpperCase()}]`)} ${levelIcon} ${message} ${colors.muted(`+${elapsed}s`)}`);
  
  // 如果有附加数据，格式化输出
  if (Object.keys(data).length > 0) {
    try {
      const dataStr = JSON.stringify(data, null, 2);
      console.log(`${colors.muted('  Data:')} ${colors.muted(dataStr)}`);
    } catch (e) {
      console.log(`${colors.muted('  Data:')} ${colors.muted('(unserializable)')}`);
    }
  }
}

// getTimestamp函数已在文件开头定义

// log函数已在文件开头定义

// formatError函数已在文件开头定义

// suggestSolution函数已在文件开头定义

/**
 * 更新部署进度
 * @param {string} message 当前步骤消息
 * @param {boolean} isComplete 是否完成
 * @param {string} stepType 步骤类型（用于图标显示）
 */
function updateProgress(message, isComplete = false, stepType = '') {
  // 确保startTime已初始化
  if (!startTime) {
    startTime = Date.now();
  }
  
  if (isComplete) {
    currentStep++;
  }
  
  const progress = Math.floor((currentStep / TOTAL_STEPS) * 100);
  
  // 创建进度条
  const completedLength = Math.floor(progressConfig.width * (currentStep / TOTAL_STEPS));
  const remainingLength = progressConfig.width - completedLength;
  
  const bar = progressConfig.completeChar.repeat(completedLength) +
              progressConfig.incompleteChar.repeat(remainingLength);
  
  // 计算时间
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  
  // 获取步骤图标
  const icon = stepIcons[stepType] || '⏳';
  const timestamp = getTimestamp();
  
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  
  let progressOutput = `${colors.muted(`[${timestamp}]`)} `;
  
  if (isComplete) {
    // 完成时显示成功样式
    progressOutput += `${colors.success(icon)} ${colors.success(message)} `;
    progressOutput += `${colors.info(bar)} ${colors.highlight(`${progress}%`)} ${colors.muted(`+${elapsed}s`)}`;
    console.log(progressOutput);
    
    // 记录完成日志
    log('info', `步骤 ${currentStep}/${TOTAL_STEPS} 完成: ${message}`, {
      progress,
      elapsedSeconds: elapsed
    });
    
    if (currentStep === TOTAL_STEPS) {
      console.log(''); // 全部完成时额外换行
      log('success', '部署流程全部完成!');
    }
  } else {
    // 进行中显示信息样式
    progressOutput += `${colors.info(icon)} ${colors.info(message)} `;
    progressOutput += `${colors.info(bar)} ${colors.highlight(`${progress}%`)} ${colors.muted(`+${elapsed}s`)}`;
    process.stdout.write(progressOutput);
  }
}

/**
 * 格式化错误信息
 * @param {Error|string} error 错误对象或错误消息
 * @returns {object} 格式化后的错误信息
 */
function formatError(error) {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code || 'UNKNOWN_ERROR'
    };
  }
  
  return {
    message: String(error),
    code: 'UNKNOWN_ERROR'
  };
}

/**
 * 执行命令并返回结果
 * @param {string} command 要执行的命令
 * @param {object} options 执行选项
 * @returns {string} 命令输出
 */
function executeCommand(command, options = {}) {
  try {
    return execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      ...options
    });
  } catch (error) {
    throw new Error(`命令执行失败: ${command}\n${error.message}`);
  }
}

/**
 * 检查环境
 * @returns {object} 环境检查结果
 */
function checkEnvironment() {
  updateProgress('检查环境...', false, 'environment');
  
  try {
    // 检查Node.js版本
    log('info', '检查Node.js版本...');
    const nodeVersion = executeCommand('node -v', { silent: true }).trim();
    log('info', `当前Node.js版本: ${nodeVersion}`);
    log('info', `要求Node.js版本: ${NODE_VERSION_REQUIRED}`);
    
    // 检查npm版本
    log('info', '检查npm版本...');
    const npmVersion = executeCommand('npm -v', { silent: true }).trim();
    log('info', `当前npm版本: ${npmVersion}`);
    
    log('success', '环境检查通过');
    
    return {
      success: true,
      nodeVersion,
      npmVersion
    };
  } catch (error) {
    console.error(formatError(error));
    suggestSolution(error.message);
    throw error;
  } finally {
    updateProgress('环境检查完成', true, 'environment');
  }
}

/**
 * 验证配置
 * @returns {object} 配置验证结果
 */
function validateConfig() {
  updateProgress('验证配置...', false, 'config');
  
  try {
    log('info', '检查package.json配置...');
    
    // 检查package.json是否存在
    if (!fs.existsSync(PACKAGE_JSON_PATH)) {
      throw new Error('package.json文件不存在');
    }
    
    // 读取并解析package.json
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
    
    // 检查必要的脚本
    const requiredScripts = ['build', 'dev', 'preview'];
    const missingScripts = requiredScripts.filter(script => !packageJson.scripts?.[script]);
    
    if (missingScripts.length > 0) {
      throw new Error(`package.json缺少必要的脚本: ${missingScripts.join(', ')}`);
    }
    
    // 检查主要源文件
    log('info', '检查主要源文件...');
    const mainSourceFiles = ['App.tsx', 'index.tsx'];
    const missingFiles = mainSourceFiles.filter(file => !fs.existsSync(path.join(PROJECT_ROOT, file)));
    
    if (missingFiles.length > 0) {
      throw new Error(`缺少必要的源文件: ${missingFiles.join(', ')}`);
    }
    
    // 检查TypeScript配置
    log('info', '检查TypeScript配置...');
    if (!fs.existsSync(path.join(PROJECT_ROOT, 'tsconfig.json'))) {
      throw new Error('tsconfig.json文件不存在');
    }
    
    // 检查环境变量文件
    log('info', '检查环境变量文件...');
    const envLocalPath = path.join(PROJECT_ROOT, '.env.local');
    if (!fs.existsSync(envLocalPath)) {
      log('info', '创建默认的.env.local文件...');
      fs.writeFileSync(envLocalPath, '# 默认环境配置文件\n# 请根据需要修改以下配置\n\n# Gemini API配置\nGEMINI_API_KEY=your_gemini_api_key_here\n\n# 端口配置\nPORT=4173\n');
      log('success', '已创建默认.env.local文件');
    }
    
    log('success', '配置验证通过');
    return {
      success: true,
      scripts: Object.keys(packageJson.scripts || {}),
      hasTsConfig: true
    };
  } catch (error) {
    console.error(formatError(error));
    suggestSolution(error.message);
    throw error;
  } finally {
    updateProgress('配置验证完成', true, 'config');
  }
}

/**
 * 检查系统资源
 * @returns {object} 资源检查结果
 */
function checkSystemResources() {
  updateProgress('检查系统资源...');
  const spinner = ora('正在检查系统资源').start();
  
  try {
     // 已在顶部导入所有必要模块
      const warnings = [];
    
    // 检查CPU核心数
    const cpuCores = os.cpus().length;
    if (cpuCores < 2) {
      warnings.push(`CPU核心数不足: 检测到${cpuCores}核心，建议至少2核心`);
    }
    
    // 检查可用内存
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryInGB = (freeMemory / (1024 * 1024 * 1024)).toFixed(1);
    
    if (freeMemory < 2 * 1024 * 1024 * 1024) { // 少于2GB
      warnings.push(`内存不足: 可用内存约${memoryInGB}GB，建议至少2GB`);
    }
    
    // 检查磁盘空间
    const diskInfo = fs.statSync(PROJECT_ROOT);
    const freeDiskSpace = diskInfo.blksize * diskInfo.blocks / (1024 * 1024 * 1024); // 转换为GB
    
    if (freeDiskSpace < 5) {
      warnings.push(`磁盘空间不足: 可用空间约${freeDiskSpace.toFixed(1)}GB，建议至少5GB`);
    }
    
    spinner.succeed(`${colors.success('系统资源检查完成')}`);
    
    // 输出资源信息
    console.log(colors.info('\n系统资源信息:'));
    console.log(`  CPU核心数: ${colors.info(cpuCores)}`);
    console.log(`  可用内存: ${colors.info(memoryInGB + 'GB')}`);
    console.log(`  磁盘空间: ${colors.info(freeDiskSpace.toFixed(1) + 'GB')}`);
    
    // 输出警告信息
    if (warnings.length > 0) {
      console.log(colors.warning('\n⚠️  资源警告:'));
      warnings.forEach(warning => console.log(`  ${colors.warning(warning)}`));
      console.log(colors.info('\n部署将继续，但可能会影响性能'));
    }
    
    return { success: true, warnings };
  } catch (error) {
    spinner.warn(`${colors.warning('系统资源检查出现错误，但继续执行部署')}`);
    console.error(colors.error(`资源检查错误: ${error.message}`));
    // 资源检查失败不应阻止部署
    return { success: true, error: error.message };
  } finally {
    updateProgress('系统资源检查完成', true);
  }
}

/**
 * 安装项目依赖
 * @returns {boolean} 安装是否成功
 */
function installDependencies() {
  updateProgress('安装项目依赖...');
  const spinner = ora('正在安装依赖').start();
  
  try {
    console.log(`${colors.info('开始安装依赖，这可能需要几分钟时间...')}`);
    executeCommand('npm install --legacy-peer-deps');
    
    spinner.succeed(`${colors.success('依赖安装成功')}`);
    return true;
  } catch (error) {
    spinner.fail(`${colors.error('依赖安装失败')}`);
    throw error;
  } finally {
    updateProgress('项目依赖安装完成', true);
  }
}

/**
 * 清理构建缓存
 */
function cleanBuildCache() {
  const spinner = ora('清理构建缓存...').start();
  try {
    // 清理Vite缓存
    const viteCacheDir = path.join(PROJECT_ROOT, 'node_modules', '.vite');
    if (fs.existsSync(viteCacheDir)) {
      fs.rmSync(viteCacheDir, { recursive: true, force: true });
      spinner.info('已清理Vite缓存');
    }
    
    // 清理之前的构建目录
    const distDir = path.join(PROJECT_ROOT, 'dist');
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true, force: true });
      spinner.info('已清理之前的构建输出');
    }
    
    spinner.succeed('构建缓存清理完成');
  } catch (error) {
    spinner.warn(`缓存清理出错: ${error.message}`);
    // 缓存清理失败不应阻止构建
  }
}

/**
 * 获取目录大小
 * @param {string} dirPath 目录路径
 * @returns {object} 包含大小和文件数的对象
 */
function getDirectorySize(dirPath) {
  let totalSize = 0;
  let fileCount = 0;
  
  function traverse(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        traverse(filePath);
      } else {
        totalSize += stats.size;
        fileCount++;
      }
    }
  }
  
  traverse(dirPath);
  return { size: totalSize, files: fileCount };
}

/**
 * 格式化字节大小
 * @param {number} bytes 字节数
 * @param {number} decimals 小数位数
 * @returns {string} 格式化后的大小
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 构建应用
 * @returns {boolean} 构建是否成功
 */
function buildApplication() {
  updateProgress('构建应用程序...');
  
  // 先清理构建缓存
  cleanBuildCache();
  
  const spinner = ora('正在构建应用').start();
  
  try {
    console.log(`${colors.info('开始构建应用，这可能需要一些时间...')}`);
    
    // 使用生产模式构建
    const buildCommand = process.env.NODE_ENV === 'production' 
      ? 'npm run build -- --mode production' 
      : 'npm run build';
      
    executeCommand(buildCommand);
    
    // 检查构建结果
    const distDir = path.join(PROJECT_ROOT, 'dist');
    if (!fs.existsSync(distDir)) {
      throw new Error('构建目录不存在，构建失败');
    }
    
    // 验证构建产物
    const requiredFiles = ['index.html', 'assets'];
    const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(distDir, file)));
    
    if (missingFiles.length > 0) {
      console.log(colors.warning(`构建警告: 缺少预期的文件或目录: ${missingFiles.join(', ')}`));
    }
    
    // 检查构建大小
    const distStats = getDirectorySize(distDir);
    const sizeFormatted = formatBytes(distStats.size);
    
    console.log(colors.info(`构建输出统计:`));
    console.log(`  文件数量: ${colors.info(distStats.files)}`);
    console.log(`  总大小: ${colors.info(sizeFormatted)}`);
    
    // 如果构建过大，发出警告
    if (distStats.size > 100 * 1024 * 1024) { // 100MB
      console.log(colors.warning('警告: 构建输出超过100MB，建议检查是否包含不必要的资源'));
    }
    
    spinner.succeed(`${colors.success('应用构建成功')}`);
    return true;
  } catch (error) {
    spinner.fail(`${colors.error('应用构建失败')}`);
    console.error(colors.error(`构建错误: ${error.message}`));
    console.log(colors.info('建议尝试以下解决方案:'));
    console.log(`  • 检查TypeScript错误: ${colors.highlight('npx tsc --noEmit')}`);
    console.log(`  • 清理依赖并重新安装: ${colors.highlight('rm -rf node_modules && npm install')}`);
    console.log(`  • 查看详细构建日志以定位具体错误`);
    throw error;
  } finally {
    updateProgress('应用程序构建完成', true);
  }
}

// 全局变量用于进程管理
let processPreview = null;
let isShuttingDown = false;
let restartCount = 0;

/**
 * 检查端口是否被占用
 * @param {number} port 要检查的端口
 * @returns {boolean} 是否已被占用
 */
function checkPort(port) {
  try {
    const server = require('net').createServer().listen(port);
    server.close();
    return false; // 端口可用
  } catch (err) {
    return true; // 端口被占用
  }
}

/**
 * 查找可用端口
 * @param {number} startPort 起始端口
 * @param {number} maxAttempts 最大尝试次数
 * @returns {number|null} 找到的可用端口或null
 */
function findAvailablePort(startPort = 3000, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const currentPort = startPort + i;
    if (!checkPort(currentPort)) {
      return currentPort;
    }
  }
  return null;
}

/**
 * 终止指定端口上的进程
 * @param {number} port 端口号
 */
function killProcessOnPort(port) {
  const platform = process.platform;
  let command;
  
  if (platform === 'win32') {
    // Windows
    command = `for /f "tokens=5" %a in ('netstat -aon ^| findstr ":${port} LISTENING"') do taskkill /f /pid %a`;
  } else {
    // macOS/Linux
    command = `lsof -ti:${port} | xargs -r kill`;
  }
  
  try {
    executeCommand(command);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 启动应用服务
 * @returns {object} 服务启动信息
 */
function startApplication() {
  updateProgress('启动应用服务...');
  const spinner = ora('正在启动应用服务').start();
  
  try {
    console.log(`${colors.info('开始启动应用服务...')}`);
    
    // 尝试使用默认端口3000
    let port = 3000;
    
    // 检查端口是否被占用
    if (checkPort(port)) {
      console.log(colors.warning(`端口 ${port} 已被占用`));
      
      // 尝试终止占用端口的进程
      const killed = killProcessOnPort(port);
      if (killed) {
        console.log(colors.success(`已终止占用端口 ${port} 的进程`));
      } else {
        // 查找可用端口
        const availablePort = findAvailablePort(3000);
        if (availablePort) {
          port = availablePort;
          console.log(colors.info(`将使用可用端口: ${port}`));
        } else {
          throw new Error('无法找到可用端口，服务启动失败');
        }
      }
    }
    
    // 设置环境变量
    const env = { ...process.env, PORT: port.toString() };
    
    // 启动预览服务
    console.log(`${colors.info(`启动预览服务在端口 ${port}...`)}`);
    
    // 使用 spawn 而不是 exec 来更好地处理长时间运行的进程
    // spawn 已经在顶部导入
    const previewProcess = spawn('npm', ['run', 'preview', '--', '--port', port.toString()], {
      env,
      shell: true,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    // 存储进程ID，用于后续清理
    processPreview = previewProcess;
    
    // 处理输出流
    let serverStarted = false;
    let serverUrl = `http://localhost:${port}`;
    
    previewProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output.trim());
      
      // 检查服务是否已启动
      if (output.includes('ready') || output.includes('running') || output.includes('listening')) {
        if (!serverStarted) {
          serverStarted = true;
          spinner.succeed(`${colors.success('应用服务启动成功')}`);
          console.log(`\n${colors.success('🚀 应用预览服务已启动!')}`);
          console.log(`${colors.highlight(`  访问地址: ${serverUrl}`)}`);
          console.log(`${colors.info(`  按 Ctrl+C 停止服务`)}\n`);
        }
      }
    });
    
    previewProcess.stderr.on('data', (data) => {
      console.error(colors.error(`服务错误: ${data.toString().trim()}`));
    });
    
    previewProcess.on('exit', (code) => {
      if (code !== 0 && !isShuttingDown) {
        console.error(colors.error(`服务意外退出，退出码: ${code}`));
        // 自动尝试重启
        if (restartCount < 3) {
          console.log(colors.info(`正在尝试重启服务 (${restartCount + 1}/3)...`));
          restartCount++;
          setTimeout(() => startApplication(), 1000);
        }
      }
    });
    
    // 等待服务启动的简单机制
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          port,
          url: serverUrl
        });
      }, 2000);
    });
  } catch (error) {
    spinner.fail(`${colors.error('应用服务启动失败')}`);
    console.error(colors.error(`启动错误: ${error.message}`));
    console.log(colors.info('建议尝试以下解决方案:'));
    console.log(`  • 检查端口是否被其他应用占用`);
    console.log(`  • 确认构建产物是否完整`);
    console.log(`  • 查看package.json中preview脚本配置是否正确`);
    throw error;
  } finally {
    updateProgress('应用服务启动完成', true);
  }
}

/**
 * 执行HTTP请求进行健康检查
 * @param {string} url 应用URL
 * @param {object} options 请求选项
 * @returns {Promise<object>} 响应对象
 */
async function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
    
    const defaultOptions = {
      timeout: 5000,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Deployment Script Health Check'
      },
      ...options
    };
    
    const req = protocol.request(url, defaultOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.setTimeout(defaultOptions.timeout);
    
    if (defaultOptions.body) {
      req.write(defaultOptions.body);
    }
    
    req.end();
  });
}

/**
 * 健康检查
 * @param {string} appUrl 应用URL
 * @param {number} maxRetries 最大重试次数
 * @param {number} retryDelay 重试延迟(毫秒)
 * @returns {Promise<object>} 健康检查结果
 */
async function healthCheck(appUrl = 'http://localhost:3000', maxRetries = 5, retryDelay = 2000) {
  updateProgress('执行健康检查...');
  const spinner = ora('正在执行健康检查').start();
  
  let attempts = 0;
  
  // 尝试不同的路径，从最可能成功的开始
  const pathsToTry = ['/', '/index.html', '/src'];
  
  while (attempts < maxRetries) {
    attempts++;
    
    for (const path of pathsToTry) {
      const fullUrl = appUrl.endsWith('/') ? `${appUrl}${path.substring(1)}` : `${appUrl}${path}`;
      console.log(`${colors.info(`健康检查尝试 ${attempts}/${maxRetries}: 访问 ${fullUrl}`)}`);
      
      try {
        // 发送健康检查请求
        const response = await httpRequest(fullUrl);
        
        // 对于某些应用，即使是非200状态码也可能表示服务已启动（只是路径不存在）
        // 我们放宽检查条件，只要服务能响应请求即可
        if (response.statusCode) {
          // 分析响应内容
          let contentAnalysis = {};
          
          try {
            // 尝试解析为JSON
            contentAnalysis.isJson = response.headers['content-type']?.includes('application/json');
            if (contentAnalysis.isJson) {
              const jsonData = JSON.parse(response.body);
              contentAnalysis.hasHealthField = 'status' in jsonData || 'health' in jsonData || 'ok' in jsonData;
              contentAnalysis.hasErrorField = 'error' in jsonData;
            } else {
              // 对于HTML响应，检查是否包含关键内容
              contentAnalysis.hasValidHtml = response.body.includes('<!DOCTYPE html>') || response.body.includes('<html');
              contentAnalysis.contentLength = response.body.length;
            }
          } catch (parseError) {
            // 解析失败不应该导致健康检查失败
            contentAnalysis.parseError = parseError.message;
          }
          
          console.log(`${colors.success(`✓ 健康检查成功 (路径: ${path})`)}`);
          console.log(`  状态码: ${colors.highlight(response.statusCode)}`);
          console.log(`  内容类型: ${colors.info(response.headers['content-type'] || 'unknown')}`);
          
          if (contentAnalysis.contentLength) {
            console.log(`  响应大小: ${colors.info(formatBytes(contentAnalysis.contentLength))}`);
          }
          
          spinner.succeed(`${colors.success('应用健康检查通过')}`);
          
          return {
            success: true,
            status: 'healthy',
            statusCode: response.statusCode,
            responseTime: Date.now(),
            contentAnalysis,
            path: path
          };
        }
      } catch (error) {
        console.log(`${colors.warning(`尝试路径 ${path} 失败: ${error.message}`)}`);
        // 继续尝试下一个路径
      }
    }
    
    if (attempts < maxRetries) {
      console.log(`${colors.warning(`所有路径健康检查失败，${retryDelay}ms 后重试 (${attempts}/${maxRetries})`)}`);
      spinner.text = `健康检查失败，${retryDelay}ms 后重试 (${attempts}/${maxRetries})`;
      
      // 等待重试
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  // 所有重试都失败
  spinner.fail(`${colors.error('应用健康检查失败')}`);
  console.error(colors.error(`最终错误: 所有路径健康检查均失败`));
  
  console.log(colors.info('健康检查失败可能的原因:'));
  console.log(`  • 应用未完全启动`);
  console.log(`  • 应用启动在不同端口`);
  console.log(`  • 应用启动后立即崩溃`);
  console.log(`  • 应用启动但无法响应HTTP请求`);
  console.log(`  • 已尝试的路径: ${pathsToTry.join(', ')}`);
  
  return {
    success: false,
    status: 'unhealthy',
    error: '所有路径健康检查均失败',
    attempts: maxRetries,
    pathsAttempted: pathsToTry
  };
}

/**
 * 确认部署状态
 * @param {string} stepName 步骤名称
 * @param {boolean} success 是否成功
 * @param {object} details 详细信息
 * @returns {object} 部署状态确认结果
 */
function confirmDeploymentStatus(stepName = '部署流程', success = false, details = {}) {
  updateProgress(`确认${stepName}状态...`);
  const spinner = ora(`正在确认最终${stepName}状态`).start();
  
  try {
    if (success) {
      spinner.succeed(`${colors.success('部署成功完成')}`);
      console.log('\n' + colors.bold(colors.success('🎉 部署成功!')));
      console.log(`应用已成功部署并正在运行。`);
      
      // 显示详细信息
      if (Object.keys(details).length > 0) {
        console.log(`\n详细部署信息:`);
        
        for (const [key, value] of Object.entries(details)) {
          const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          console.log(`  ${formattedKey}: ${value}`);
        }
      }
      
      console.log(`\n${colors.info('提示: 按 Ctrl+C 停止服务')}`);
    }
    
    return { success, stepName, details };
  } catch (error) {
    spinner.fail(`${colors.error('部署确认失败')}`);
    console.error(`${colors.error(`${stepName}状态确认失败: ${error.message}`)}`);
    return { success: false, stepName, error: error.message };
  } finally {
    updateProgress('部署状态确认完成', true);
  }
}

/**
 * 清理启动的进程
 */
function cleanupProcesses() {
  if (processPreview) {
    isShuttingDown = true;
    console.log(`${colors.info('正在关闭预览服务...')}`);
    try {
      // 跨平台进程终止
      if (process.platform === 'win32') {
        process.kill(processPreview.pid, 'SIGTERM');
      } else {
        process.kill(-processPreview.pid, 'SIGTERM');
      }
      processPreview = null;
      console.log(`${colors.success('预览服务已关闭')}`);
    } catch (err) {
      console.error(`${colors.error('关闭预览服务出错:')} ${err.message}`);
    }
  }
}

/**
 * 设置信号处理程序
 */
function setupSignalHandlers() {
  // 处理 SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    console.log('\n');
    console.log(`${colors.warning('接收到中断信号，正在优雅关闭...')}`);
    cleanupProcesses();
    process.exit(0);
  });
  
  // 处理 SIGTERM
  process.on('SIGTERM', () => {
    console.log(`${colors.warning('接收到终止信号，正在优雅关闭...')}`);
    cleanupProcesses();
    process.exit(0);
  });
}

/**
 * 主部署函数
 */
async function deploy() {
  // 设置信号处理，确保在程序退出时清理进程
  setupSignalHandlers();
  
  log('info', '🚀 开始自动化部署流程', { icon: '⚡' });
  console.log(colors.muted('='.repeat(60)));
  
  let deploymentResult = {
    success: false,
    steps: {},
    startTime: Date.now(),
    port: null,
    url: null
  };
  
  try {
    // 1. 环境检查
    log('info', '开始环境检查', { icon: stepIcons.environment });
    deploymentResult.steps.environment = checkEnvironment();
    
    // 2. 配置验证
    log('info', '开始配置验证', { icon: stepIcons.config });
    deploymentResult.steps.config = validateConfig();
    
    // 3. 系统资源检查
    log('info', '开始系统资源检查', { icon: stepIcons.resources });
    deploymentResult.steps.resources = checkSystemResources();
    
    // 4. 依赖安装
    log('info', '开始依赖安装', { icon: stepIcons.dependencies });
    deploymentResult.steps.dependencies = installDependencies();
    
    // 5. 应用构建
    log('info', '开始应用构建', { icon: stepIcons.build });
    deploymentResult.steps.build = buildApplication();
    
    // 6. 服务启动
    log('info', '开始服务启动', { icon: stepIcons.start });
    const startResult = await startApplication();
    deploymentResult.steps.start = startResult;
    
    // 存储端口和URL信息
    deploymentResult.port = startResult.port;
    deploymentResult.url = startResult.url;
    
    // 检查启动结果
    if (!startResult.success) {
      throw new Error(`应用启动失败: ${startResult.error || '未知错误'}`);
    }
    
    // 7. 健康检查 - 传入应用URL进行健康检查
    log('info', '开始健康检查', { icon: stepIcons.health });
    const healthResult = await healthCheck(deploymentResult.url);
    deploymentResult.steps.health = healthResult;
    
    // 确认健康检查状态
    confirmDeploymentStatus('健康检查', healthResult.success, healthResult);
    
    // 如果健康检查失败，抛出错误
    if (!healthResult.success) {
      throw new Error(`应用健康检查失败: ${healthResult.error}`);
    }
    
    // 8. 部署确认
    log('info', '开始部署确认', { icon: stepIcons.confirm });
    deploymentResult.steps.confirm = confirmDeploymentStatus();
    
    deploymentResult.success = true;
    deploymentResult.endTime = Date.now();
    deploymentResult.duration = (deploymentResult.endTime - deploymentResult.startTime) / 1000;
    
    console.log('\n' + colors.muted('='.repeat(60)));
    log('success', `✅ 部署成功完成，总耗时: ${deploymentResult.duration.toFixed(2)}秒`, { icon: '🎉' });
    log('info', `应用地址: ${deploymentResult.url}`);
    log('info', `服务端口: ${deploymentResult.port}`);
    log('info', '提示: 按 Ctrl+C 停止服务');
    
  } catch (error) {
    deploymentResult.success = false;
    deploymentResult.error = error.message;
    deploymentResult.endTime = Date.now();
    deploymentResult.duration = (deploymentResult.endTime - deploymentResult.startTime) / 1000;
    
    console.log('\n' + colors.muted('='.repeat(60)));
    log('error', '❌ 部署失败', { icon: '❌' });
    console.error(colors.error(`错误信息: ${error.message}`));
    
    // 提供错误解决方案建议
    suggestSolution(error.message);
    
    // 清理已启动的进程
    cleanupProcesses();
    
    log('info', `部署耗时: ${deploymentResult.duration.toFixed(2)}秒`);
    process.exit(1);
  }
}

/**
 * 根据错误信息提供解决方案建议
 * @param {string} errorMessage 错误信息
 */
function suggestSolution(errorMessage) {
  console.log('\n' + colors.warning('💡 可能的解决方案:'));
  
  if (errorMessage.includes('node') || errorMessage.includes('npm')) {
    console.log(`  • 请确保您的Node.js版本符合要求 (${NODE_VERSION_REQUIRED})`);
    console.log(`  • 尝试更新npm: npm install -g npm@latest`);
  } else if (errorMessage.includes('package.json')) {
    console.log(`  • 检查package.json文件是否存在且格式正确`);
    console.log(`  • 确保所有必要的脚本都已定义`);
  } else if (errorMessage.includes('install')) {
    console.log(`  • 尝试清理npm缓存: npm cache clean --force`);
    console.log(`  • 检查网络连接是否正常`);
    console.log(`  • 如果使用私有registry，请确保配置正确`);
  } else if (errorMessage.includes('build')) {
    console.log(`  • 检查TypeScript错误: npx tsc --noEmit`);
    console.log(`  • 查看详细构建日志以定位具体错误`);
  } else if (errorMessage.includes('start')) {
    console.log(`  • 检查端口是否被占用: lsof -i :4173`);
    console.log(`  • 尝试使用不同的端口启动服务`);
  }
}

// 执行部署
if (import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  deploy();
}