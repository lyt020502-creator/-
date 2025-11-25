import { PromptTemplate } from '../types';
import { getShareParamFromUrl, deserializeFromUrl } from './shareUtils';
import { gitHubFormStorage } from '../services/GitHubFormStorageService';

/**
 * 从当前URL的分享链接中提取原始操作数据
 * @returns 提取的模板数组，如果没有分享链接则返回null
 */
export const extractOriginalActionsFromUrl = (): PromptTemplate[] | null => {
  try {
    const shareParam = getShareParamFromUrl();
    if (!shareParam) {
      return null;
    }
    
    const templates = deserializeFromUrl(shareParam);
    return templates;
  } catch (error) {
    console.error('提取原始操作失败:', error);
    return null;
  }
};

/**
 * 保存原始操作到GitHub存储
 * @param templates 要保存的模板数组
 * @param sourceUrl 来源URL（可选）
 * @returns 保存结果
 */
export const saveOriginalActionsToStorage = async (
  templates: PromptTemplate[],
  sourceUrl?: string
): Promise<{ success: boolean; fileId?: string; error?: string }> => {
  try {
    // 添加来源信息到存储数据中
    const enhancedTemplates = templates.map(template => ({
      ...template,
      // 添加元数据
      metadata: {
        ...(template.metadata || {}),
        sourceUrl: sourceUrl || window.location.href,
        savedAt: new Date().toISOString()
      }
    }));
    
    const result = await gitHubFormStorage.storeData({ templates: enhancedTemplates });
    return result;
  } catch (error) {
    console.error('保存原始操作失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
};

/**
 * 处理分享链接并保存原始操作
 * @returns 处理结果
 */
export const processShareLinkAndSaveActions = async (): Promise<{
  success: boolean;
  originalActions?: PromptTemplate[];
  saved?: boolean;
  fileId?: string;
  error?: string;
}> => {
  try {
    // 提取原始操作
    const originalActions = extractOriginalActionsFromUrl();
    if (!originalActions || originalActions.length === 0) {
      return {
        success: true,
        originalActions: [],
        saved: false
      };
    }
    
    // 保存原始操作
    const saveResult = await saveOriginalActionsToStorage(originalActions);
    
    if (saveResult.success) {
      return {
        success: true,
        originalActions,
        saved: true,
        fileId: saveResult.fileId
      };
    } else {
      return {
        success: false,
        originalActions,
        saved: false,
        error: saveResult.error
      };
    }
  } catch (error) {
    console.error('处理分享链接失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
};

/**
 * 记录用户操作历史
 * @param actionType 操作类型
 * @param data 操作数据
 */
export const recordUserAction = (actionType: string, data: any = {}): void => {
  try {
    const actionRecord = {
      actionType,
      timestamp: new Date().toISOString(),
      data,
      // 可以添加更多上下文信息
      userAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`
    };
    
    // 这里可以扩展为存储到localStorage或发送到分析服务
    console.log('用户操作记录:', actionRecord);
    
    // 简单存储到localStorage作为示例
    const history = JSON.parse(localStorage.getItem('user_action_history') || '[]');
    history.push(actionRecord);
    // 只保留最近100条记录
    if (history.length > 100) {
      history.shift();
    }
    localStorage.setItem('user_action_history', JSON.stringify(history));
  } catch (error) {
    console.error('记录用户操作失败:', error);
  }
};
