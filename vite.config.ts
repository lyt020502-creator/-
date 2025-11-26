import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // 根路径配置，适用于Vercel部署
      base: '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react({
          // 优化React插件配置
          include: '**/*.{tsx,jsx}'
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // CSS处理配置
      css: {
        // 禁用自动注入CSS，避免引用不存在的文件
        modules: {
          generateScopedName: '[name]__[local]__[hash:base64:5]'
        },
        // 配置CSS预处理器（如果需要）
        preprocessorOptions: {
          css: {
            // 可以在这里添加全局CSS变量等
          }
        }
      },
      // 构建配置
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: mode === 'production' ? false : true,
        // 保持默认的minify设置
        // 确保静态资源路径正确
        rollupOptions: {
          output: {
            assetFileNames: 'assets/[name]-[hash][extname]',
            chunkFileNames: 'assets/[name]-[hash].js',
            entryFileNames: 'assets/[name]-[hash].js'
          },
          // 确保正确处理模块导入
          input: {
            main: path.resolve(__dirname, 'index.html')
          }
        }
      }
    };
});
