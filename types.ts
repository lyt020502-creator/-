export interface PromptTemplate {
  id: string;
  name: string;
  tags: string[];
  coverImageUrl: string;
  promptText: string;
  createdAt: number;
  updatedAt: number;
  metadata?: {
    sourceUrl?: string;
    savedAt?: string;
    [key: string]: any;
  };
}

/**
 * 分享状态接口
 */
export interface ShareState {
  templates: PromptTemplate[];
}

export enum ViewMode {
  READ = 'READ',
  EDIT = 'EDIT'
}

export interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

// API密钥配置相关类型
export interface ApiKeyConfig {
  apiKey?: string;
  saveToLocalStorage: boolean;
}

export const MOCK_TEMPLATES: PromptTemplate[] = [
  {
    id: '1',
    name: '现代 SaaS 仪表盘',
    tags: ['SaaS', '仪表盘', '浅色'],
    coverImageUrl: 'https://picsum.photos/seed/saas/800/600',
    promptText: `/* 背景与卡片颜色 */
<!-- 底层大背景 -->
class="bg-[#F8FAFC]"
<!-- 卡片颜色 -->
class="bg-[#FFFFFF]"
<!-- 卡片内的区块背景色 -->
class="bg-[#F1F5F9]"
<!-- 卡片内的区块描边色 -->
class="border border-[#E2E8F0]"
/* 文字颜色 */
<!-- 一级标题 -->
class="text-[#0F172A]"
<!-- 二级标题 -->
class="text-[#334155]"
<!-- 正文 -->
class="text-[#475569]"
<!-- 辅助信息 -->
class="text-[#94A3B8]" 
class="text-[#64748B]"
<!-- 输入框内的占位文字 -->
class="placeholder:text-[#94A3B8]"
/* 可操作控件颜色 */
/* 按钮类 */
<!-- 主按钮填充色 -->
class="bg-[#2563EB] text-[#FFFFFF]"
<!-- 次要按钮描边色 -->
class="border border-[#CBD5E1] text-[#334155]"
<!-- 警示按钮填充色 -->
class="bg-[#DC2626] text-[#FFFFFF]"
<!-- 警示按钮描边色 -->
class="border border-[#FECACA] text-[#DC2626]"
<!-- 幽灵按钮描边 -->
class="border border-transparent text-[#475569] bg-transparent"
/* tab切换 */
<!-- 切换条的背景色 -->
class="bg-[#F1F5F9]"
<!-- 切换按钮的选中背景色 -->
class="bg-[#FFFFFF] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]"
/* 输入框类 */
<!-- 输入框描边色 -->
class="border border-[#CBD5E1]"
/* 其他元素颜色 */
<!-- 分割线 -->
class="border-t border-[#E2E8F0]"`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '2',
    name: '暗黑模式分析页',
    tags: ['暗色', '数据分析', '霓虹'],
    coverImageUrl: 'https://picsum.photos/seed/dark/800/600',
    promptText: `/* 背景与卡片颜色 */
<!-- 底层大背景 -->
class="bg-[#0F172A]"
<!-- 卡片颜色 -->
class="bg-[#1E293B]"
<!-- 卡片内的区块背景色 -->
class="bg-[#1E293B]"
<!-- 卡片内的区块描边色 -->
class="border border-[#334155]"
/* 文字颜色 */
<!-- 一级标题 -->
class="text-[#FFFFFF]"
<!-- 二级标题 -->
class="text-[#E2E8F0]"
<!-- 正文 -->
class="text-[#94A3B8]"
<!-- 辅助信息 -->
class="text-[#64748B]" 
class="text-[#475569]"
<!-- 输入框内的占位文字 -->
class="placeholder:text-[#475569]"
/* 可操作控件颜色 */
/* 按钮类 */
<!-- 主按钮填充色 -->
class="bg-[#6366F1] text-[#FFFFFF]"
<!-- 次要按钮描边色 -->
class="border border-[#475569] text-[#CBD5E1]"
<!-- 警示按钮填充色 -->
class="bg-[#450A0A] text-[#F87171]"
<!-- 警示按钮描边色 -->
class="border border-[#7F1D1D] text-[#F87171]"
<!-- 幽灵按钮描边 -->
class="border border-transparent text-[#94A3B8] bg-transparent"
/* tab切换 */
<!-- 切换条的背景色 -->
class="bg-[#1E293B]"
<!-- 切换按钮的选中背景色 -->
class="bg-[#334155] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]"
/* 输入框类 */
<!-- 输入框描边色 -->
class="border border-[#475569]"
/* 其他元素颜色 */
<!-- 分割线 -->
class="border-t border-[#334155]"`,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  }
];