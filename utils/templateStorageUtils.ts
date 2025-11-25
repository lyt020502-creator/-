import { PromptTemplate } from '../types';

// 模板库文件名
const TEMPLATE_LIBRARY_FILE = 'src/templateLibrary.ts';

/**
 * 模板库管理工具
 * 用于将模板保存到代码库中，实现持久化存储
 */

/**
 * 将模板保存到代码库中
 * @param templates 要保存的模板数组
 * @param libraryName 模板库名称
 * @returns 保存结果
 */
export const saveTemplatesToCodeLibrary = async (
  templates: PromptTemplate[],
  libraryName: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // 添加元数据信息
    const enhancedTemplates = templates.map(template => ({
      ...template,
      metadata: {
        ...(template.metadata || {}),
        savedToLibrary: true,
        savedAt: new Date().toISOString(),
        libraryName
      }
    }));

    // 创建模板库内容
    const libraryContent = generateTemplateLibraryContent(enhancedTemplates, libraryName);
    
    // 在实际环境中，这里会将内容写入到模板库文件
    // 由于在浏览器环境中无法直接修改文件系统，我们模拟这个过程
    // 并提供下载功能让用户手动更新代码库
    
    // 提供下载功能
    downloadTemplateLibrary(libraryContent, libraryName);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('保存模板到代码库失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
};

/**
 * 生成模板库文件内容
 * @param templates 模板数组
 * @param libraryName 模板库名称
 * @returns 模板库文件内容
 */
const generateTemplateLibraryContent = (
  templates: PromptTemplate[],
  libraryName: string
): string => {
  return `// ${libraryName} - 生成于 ${new Date().toLocaleString()}
import { PromptTemplate } from '../types';

export const ${camelCase(libraryName)}Templates: PromptTemplate[] = ${JSON.stringify(
    templates,
    null,
    2
  )};

export const ${camelCase(libraryName)}Library = {
  name: '${libraryName}',
  templates: ${camelCase(libraryName)}Templates,
  version: '1.0.0',
  updatedAt: '${new Date().toISOString()}'
};
`;
};

/**
 * 下载模板库文件
 * @param content 文件内容
 * @param libraryName 库名称
 */
const downloadTemplateLibrary = (content: string, libraryName: string): void => {
  const blob = new Blob([content], { type: 'text/typescript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${kebabCase(libraryName)}-library.ts`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * 驼峰命名转换
 * @param str 原始字符串
 * @returns 驼峰命名字符串
 */
const camelCase = (str: string): string => {
  return str
    .replace(/[^\w\s]/g, '')
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('');
};

/**
 * 短横线命名转换
 * @param str 原始字符串
 * @returns 短横线命名字符串
 */
const kebabCase = (str: string): string => {
  return str
    .replace(/[^\w\s]/g, '')
    .toLowerCase()
    .split(/\s+/)
    .join('-');
};

/**
 * 创建分享代码库链接
 * @param templates 模板数组
 * @param libraryName 库名称
 * @returns 包含模板库信息的分享链接
 */
export const createLibraryShareLink = (
  templates: PromptTemplate[],
  libraryName: string
): string => {
  // 为了在浏览器环境中实现持久化，我们使用localStorage临时存储
  // 同时生成一个唯一标识符用于在其他会话中恢复
  const libraryId = `${libraryName}-${Date.now()}`;
  
  // 保存到localStorage
  localStorage.setItem(
    `template_library_${libraryId}`,
    JSON.stringify({
      name: libraryName,
      templates,
      createdAt: new Date().toISOString()
    })
  );
  
  // 创建包含libraryId的分享链接
  const baseUrl = window.location.origin + window.location.pathname;
  const searchParams = new URLSearchParams();
  searchParams.set('library_id', libraryId);
  
  return `${baseUrl}?${searchParams.toString()}`;
};

/**
 * 从分享链接加载模板库
 * @param libraryId 模板库ID
 * @returns 模板库数据或null
 */
export const loadTemplatesFromShareLink = (libraryId: string): {
  name: string;
  templates: PromptTemplate[];
  createdAt: string;
} | null => {
  try {
    const libraryData = localStorage.getItem(`template_library_${libraryId}`);
    if (!libraryData) {
      return null;
    }
    return JSON.parse(libraryData);
  } catch (error) {
    console.error('加载模板库失败:', error);
    return null;
  }
};

/**
 * 获取URL中的模板库ID参数
 * @returns 模板库ID或null
 */
export const getLibraryIdFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('library_id');
};
