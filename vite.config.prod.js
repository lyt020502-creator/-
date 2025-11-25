import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    // 生产构建优化配置
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser', // 使用terser进行代码压缩
    terserOptions: {
      compress: {
        drop_console: true, // 移除console.log语句
        drop_debugger: true // 移除以debugger语句
      }
    },
    sourcemap: false, // 生产环境不生成sourcemap以保护代码
    rollupOptions: {
      output: {
        // 代码分割配置
        manualChunks: {
          // 将第三方库拆分成独立的chunk
          'react-vendor': ['react', 'react-dom'],
          'google-genai': ['@google/genai'],
          'lucide-icons': ['lucide-react']
        },
        // 文件名哈希，便于缓存控制
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // 增加构建并发数以加快构建速度
    chunkSizeWarningLimit: 1000 // 警告限制提高到1000kb
  },
  // 服务器配置，用于部署前的本地预览测试
  server: {
    host: true,
    port: 3000,
    open: false
  },
  // 环境变量配置
  envPrefix: 'VITE_',
  // CSS优化
  css: {
    modules: {
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    },
    preprocessorOptions: {
      // 如果使用了CSS预处理器，可以在这里配置
    }
  }
})