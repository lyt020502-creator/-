import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // 根路径配置，适用于Vercel部署
      // 注意：URL中包含/prompt/前缀，所以base需要设置为/prompt/
      base: '/prompt/',
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
        // 配置CSS模块命名规则
        modules: {
          generateScopedName: '[name]__[local]__[hash:base64:5]'
        }
        // 注意：preprocessorOptions只支持scss、sass、less、stylus等预处理器，不支持直接配置css
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
