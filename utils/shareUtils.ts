import { PromptTemplate, ShareState } from '../types';

// ShareState接口已移至types.ts文件

/**
 * 序列化状态为URL参数
 * @param templates 模板数组
 * @returns 编码后的URL参数
 */
export const serializeToUrl = (templates: PromptTemplate[]): string => {
  try {
    const state: ShareState = { templates };
    // 将状态转换为JSON字符串
    const jsonString = JSON.stringify(state);
    
    // 压缩和编码 - 使用base64的URL安全版本
    const encoded = btoa(unescape(encodeURIComponent(jsonString)));
    
    return encoded;
  } catch (error) {
    console.error('序列化失败:', error);
    throw new Error('无法序列化状态');
  }
};

/**
 * 从URL参数反序列化状态
 * @param urlParam URL中的编码参数
 * @returns 恢复的模板数组
 */
export const deserializeFromUrl = (urlParam: string): PromptTemplate[] => {
  try {
    // 解码和减压
    const jsonString = decodeURIComponent(escape(atob(urlParam)));
    
    // 解析JSON
    const state: ShareState = JSON.parse(jsonString);
    
    // 验证数据格式
    if (!Array.isArray(state.templates)) {
      throw new Error('无效的数据格式');
    }
    
    return state.templates;
  } catch (error) {
    console.error('反序列化失败:', error);
    throw new Error('无法解析URL参数');
  }
};

/**
 * 检查URL参数长度是否超过限制
 * @param templates 模板数组
 * @returns 是否安全
 */
export const isUrlShareSafe = (templates: PromptTemplate[]): boolean => {
  try {
    const encoded = serializeToUrl(templates);
    // URL总长度限制通常为2048字符，留一些余量
    const maxLength = 2000;
    // 考虑'?s='前缀的长度
    return `?s=${encoded}`.length < maxLength;
  } catch (error) {
    console.error('检查URL长度失败:', error);
    return false;
  }
};

/**
 * 从当前URL获取分享参数
 * @returns 分享参数，如果不存在则返回null
 */
export const getShareParamFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('s');
};

/**
 * 生成分享链接
 * @param templates 模板数组
 * @param selectedTemplateIds 可选的选定模板ID数组，用于只分享特定模板
 * @returns 完整的分享URL
 */
export const generateShareUrl = (templates: PromptTemplate[], selectedTemplateIds?: string[]): string => {
  // 如果提供了selectedTemplateIds，则只分享选定的模板
  const templatesToShare = selectedTemplateIds ? 
    templates.filter(template => selectedTemplateIds.includes(template.id)) : 
    templates;
  
  if (!isUrlShareSafe(templatesToShare)) {
    if (selectedTemplateIds) {
      // 如果选定的模板仍然过大，抛出更具体的错误
      throw new Error('选定的模板数据量过大，无法生成分享链接');
    } else {
      // 如果全部模板过大，建议用户选择部分模板
      throw new Error('模板数量过多，建议选择部分模板进行分享');
    }
  }
  
  const encoded = serializeToUrl(templatesToShare);
  const url = new URL(window.location.href);
  url.searchParams.set('s', encoded);
  return url.toString();
};

/**
 * 尝试分享单个模板
 * @param template 单个模板
 * @returns 分享链接
 */
export const shareSingleTemplate = (template: PromptTemplate): string => {
  return generateShareUrl([template]);
};