import { ShareState } from '../types';

/**
 * GitHub表单存储服务
 * 使用GitHub Actions和仓库调度事件存储用户数据
 */
export class GitHubFormStorageService {
  private readonly repoOwner: string;
  private readonly repoName: string;
  private readonly accessToken?: string;

  constructor(repoOwner: string, repoName: string, accessToken?: string) {
    this.repoOwner = repoOwner;
    this.repoName = repoName;
    this.accessToken = accessToken;
  }

  /**
   * 通过GitHub Actions存储用户数据
   * @param data 要存储的分享状态数据
   * @returns 存储结果，包含文件ID或错误信息
   */
  async storeData(data: ShareState): Promise<{ success: boolean; fileId?: string; error?: string }> {
    try {
      const endpoint = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/dispatches`;
      
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      };

      if (this.accessToken) {
        headers['Authorization'] = `token ${this.accessToken}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          event_type: 'store_user_data',
          client_payload: {
            data: {
              timestamp: new Date().toISOString(),
              content: data,
            }
          }
        })
      });

      if (response.status === 204) {
        // 由于GitHub API返回204 No Content，我们无法直接获取文件ID
        // 但可以基于时间戳生成一个临时ID用于显示
        const tempId = `pending_${Date.now()}`;
        return { success: true, fileId: tempId };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `Failed to store data: ${response.status}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * 获取存储的数据列表
   * 注意：由于安全限制，这只能获取公共仓库的数据
   * @returns 数据列表
   */
  async getDataList(): Promise<Array<{ id: string; timestamp: string; data: any }>> {
    try {
      const endpoint = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/data`;
      
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
      };

      if (this.accessToken) {
        headers['Authorization'] = `token ${this.accessToken}`;
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const files = await response.json();
        const result: Array<{ id: string; timestamp: string; data: any }> = [];
        
        // 由于我们无法直接读取文件内容（需要额外的API调用），
        // 这里只返回文件信息，用户可以通过其他API调用获取内容
        for (const file of files) {
          if (file.name.startsWith('user_data_') && file.name.endsWith('.json')) {
            result.push({
              id: file.name.replace('.json', ''),
              timestamp: file.name.replace('user_data_', '').replace('.json', ''),
              data: { url: file.download_url }
            });
          }
        }
        
        return result.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
      } else {
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch data list:', error);
      return [];
    }
  }
}

// 创建一个默认的服务实例
// 尝试从环境变量或localStorage获取token
export const gitHubFormStorage = new GitHubFormStorageService(
  'lyt020502-creator',
  'prompt',
  typeof localStorage !== 'undefined' ? localStorage.getItem('github_token') || undefined : undefined
);

/**
 * 设置GitHub访问令牌
 * @param token GitHub个人访问令牌
 */
export const setGitHubToken = (token: string | null): void => {
  if (typeof localStorage !== 'undefined') {
    if (token) {
      localStorage.setItem('github_token', token);
    } else {
      localStorage.removeItem('github_token');
    }
  }
  // 更新服务实例的token
  if (gitHubFormStorage && typeof gitHubFormStorage === 'object') {
    (gitHubFormStorage as any).accessToken = token || undefined;
  }
};

/**
 * 获取当前设置的GitHub访问令牌
 * @returns 令牌或null
 */
export const getGitHubToken = (): string | null => {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('github_token');
  }
  return null;
}
