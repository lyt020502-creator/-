
import React, { useState, useEffect } from 'react';
import { Plus, Search, LayoutGrid, Edit3, SlidersHorizontal, RefreshCw, Key, Settings, Share2, Download, Upload } from 'lucide-react';
import { PromptTemplate, ViewMode, ToastState, MOCK_TEMPLATES, ApiKeyConfig } from './types';
import { TemplateCard } from './components/TemplateCard';
import { EditorModal } from './components/EditorModal';
import { Toast } from './components/Toast';
import ApiKeySettings from './components/ApiKeySettings';
import { generateStylePrompt } from './services/deepseekService';
import { getShareParamFromUrl, deserializeFromUrl } from './utils/shareUtils';
import { processShareLinkAndSaveActions, recordUserAction, saveOriginalActionsToStorage, extractOriginalActionsFromUrl } from './utils/actionStorageUtils';

import { setGitHubToken, getGitHubToken } from './services/GitHubFormStorageService';

function App() {
  // State
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mode, setMode] = useState<ViewMode>(ViewMode.READ);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showSaveOriginalPrompt, setShowSaveOriginalPrompt] = useState(false);
  const [originalActions, setOriginalActions] = useState<PromptTemplate[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [githubToken, setGithubToken] = useState<string>('');
  const [showTokenModal, setShowTokenModal] = useState<boolean>(false);
  
  // 代码库相关状态

    
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });
  
  // API密钥相关状态
  const [apiKeyConfig, setApiKeyConfig] = useState<ApiKeyConfig>({
    apiKey: localStorage.getItem('deepseek_api_key') || process.env.DEEPSEEK_API_KEY,
    saveToLocalStorage: !!localStorage.getItem('deepseek_api_key')
  });
  const [showApiKeySettings, setShowApiKeySettings] = useState(false);

  // Load initial data
  useEffect(() => {
    const initApp = async () => {
      // 首先检查URL参数是否有分享数据
      const shareParam = getShareParamFromUrl();
      
      if (shareParam) {
        try {
          // 从URL参数恢复数据
          const sharedTemplates = deserializeFromUrl(shareParam);
          setTemplates(sharedTemplates);
          showToast('已加载分享的模板', 'info');
          
          // 显示保存原始操作的提示
          setOriginalActions(sharedTemplates);
          setShowSaveOriginalPrompt(true);
        } catch (error) {
          console.error('无法加载分享的模板:', error);
          // 如果分享数据加载失败，尝试从localStorage加载
          const saved = localStorage.getItem('style_prompts_db');
          if (saved) {
            try {
              setTemplates(JSON.parse(saved));
            } catch (e) {
              console.error("Failed to parse templates", e);
              setTemplates(MOCK_TEMPLATES);
            }
          } else {
            setTemplates(MOCK_TEMPLATES);
          }
        }
      } else {
        // 正常从localStorage或默认数据加载
        const saved = localStorage.getItem('style_prompts_db');
        if (saved) {
          try {
            setTemplates(JSON.parse(saved));
          } catch (e) {
            console.error("Failed to parse templates", e);
            setTemplates(MOCK_TEMPLATES);
          }
        } else {
          setTemplates(MOCK_TEMPLATES);
        }
      }
      
      // 加载已保存的GitHub令牌
      const savedToken = getGitHubToken();
      if (savedToken) {
        setGithubToken(savedToken);
      }
      
      setIsLoaded(true);
    };
    
    initApp();
  }, []);

  // Persist data
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('style_prompts_db', JSON.stringify(templates));
    }
  }, [templates, isLoaded]);

  // Actions
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
  };



  // 处理选择模板
  const handleSelectTemplate = (templateId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedTemplateIds(prev => [...prev, templateId]);
    } else {
      setSelectedTemplateIds(prev => prev.filter(id => id !== templateId));
    }
  };

  // 处理GitHub令牌保存
  const handleSaveToken = () => {
    setGitHubToken(githubToken.trim() || null);
    setShowTokenModal(false);
  };
  


  // 处理GitHub存储操作前的认证检查
  const handleStorageOperation = async (operation: () => Promise<void>) => {
    const currentToken = getGitHubToken();
    if (!currentToken) {
      setShowTokenModal(true);
      return;
    }
    try {
      await operation();
    } catch (error) {
      if (error instanceof Error && error.message.includes('Requires authentication')) {
        // 令牌可能过期或无效，让用户重新输入
        setShowTokenModal(true);
      } else {
        throw error;
      }
    }
  };



  // 保存原始操作到GitHub存储
  const handleSaveOriginalActions = async () => {
    await handleStorageOperation(async () => {
      try {
        const result = await saveOriginalActionsToStorage(originalActions);
        if (result.success) {
          setShowSaveOriginalPrompt(false);
          showToast('原始操作已成功保存', 'success');
          recordUserAction('save_original_actions', { templateCount: originalActions.length });
        } else {
          showToast(result.error || '保存失败', 'error');
        }
      } catch (error: any) {
        showToast(error.message || '保存失败', 'error');
      }
    });
  };

  // 关闭保存原始操作提示
  const handleCloseSaveOriginalPrompt = () => {
    setShowSaveOriginalPrompt(false);
  };

  // 导出功能 - 对于数据量大的情况
  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(templates, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `style-prompts-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('模板已导出', 'success');
    } catch (error) {
      console.error('导出失败:', error);
      showToast('导出失败，请稍后重试', 'error');
    }
  };

  // 导入功能
  const handleImport = () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        try {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;
          
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const content = e.target?.result as string;
              // 安全检查：确保内容不为空且是字符串
              if (!content || typeof content !== 'string') {
                throw new Error('文件内容无效');
              }
              
              // 安全解析JSON
              let importedData = null;
              try {
                importedData = JSON.parse(content);
              } catch (parseError) {
                throw new Error('JSON格式错误，请检查文件内容');
              }
              
              let importedTemplates = [];
              
              // 处理单模板和多模板两种情况
              if (Array.isArray(importedData)) {
                importedTemplates = importedData;
              } else if (typeof importedData === 'object' && importedData !== null) {
                importedTemplates = [importedData];
              } else {
                throw new Error('无效的数据格式，需要对象或对象数组');
              }
              
              // 更严格的模板验证和清理
              const validatedTemplates = importedTemplates.filter(template => {
                try {
                  // 更严格的类型检查
                  return (
                    typeof template === 'object' && 
                    template !== null &&
                    typeof template.id === 'string' && 
                    template.id.trim() !== '' &&
                    typeof template.name === 'string' && 
                    template.name.trim() !== '' &&
                    typeof template.promptText === 'string' && 
                    template.promptText.trim() !== ''
                  );
                } catch (err) {
                  console.warn('跳过无效模板:', err, template);
                  return false;
                }
              }).map(template => {
                // 为每个字段提供默认值，确保所有必要字段都有有效值
                return {
                  id: template.id?.toString() || Date.now().toString(),
                  name: template.name?.toString() || '未命名模板',
                  tags: Array.isArray(template.tags) ? template.tags : [],
                  coverImageUrl: typeof template.coverImageUrl === 'string' ? 
                    template.coverImageUrl : 'https://picsum.photos/seed/default/800/600',
                  promptText: template.promptText?.toString() || '',
                  createdAt: typeof template.createdAt === 'number' ? 
                    template.createdAt : Date.now(),
                  updatedAt: typeof template.updatedAt === 'number' ? 
                    template.updatedAt : Date.now(),
                  metadata: typeof template.metadata === 'object' && template.metadata !== null ? 
                    template.metadata : {}
                };
              });
              
              // 避免空数组替换现有模板
              if (validatedTemplates.length === 0) {
                throw new Error('没有找到有效的模板数据');
              }
              
              // 在设置状态前进行最终验证
              if (!Array.isArray(validatedTemplates) || 
                  !validatedTemplates.every(t => typeof t === 'object' && t !== null)) {
                throw new Error('验证后的模板数据无效');
              }
              
              setTemplates(validatedTemplates);
              showToast(`成功导入 ${validatedTemplates.length} 个模板`, 'success');
            } catch (error) {
              console.error('导入失败:', error);
              // 提供更友好的错误信息
              const errorMessage = error instanceof Error ? 
                `导入失败: ${error.message}` : 
                '导入失败: 未知错误';
              showToast(errorMessage, 'error');
              // 确保不修改现有状态
            }
          };
          reader.onerror = () => {
            showToast('文件读取失败', 'error');
          };
          reader.readAsText(file);
        } catch (outerError) {
          console.error('导入过程出错:', outerError);
          showToast('导入过程中发生错误', 'error');
        }
      };
      input.click();
    } catch (error) {
      console.error('创建文件输入失败:', error);
      showToast('无法创建导入组件', 'error');
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('配置已复制到剪贴板！', 'success');
    } catch (err) {
      showToast('复制失败', 'error');
    }
  };

  const handleSaveTemplate = (template: PromptTemplate) => {
    if (editingTemplate) {
      // Update existing
      setTemplates(prev => prev.map(t => t.id === template.id ? template : t));
      showToast('模板更新成功', 'success');
    } else {
      // Create new
      setTemplates(prev => [template, ...prev]);
      showToast('新模板已创建', 'success');
    }
  };

  const handleDeleteTemplate = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      setTemplates(prev => prev.filter(t => t.id !== deleteConfirmId));
      showToast('模板已删除', 'info');
      setDeleteConfirmId(null);
    }
  };

  const handleRestoreDefaults = () => {
    if (window.confirm('确定要恢复默认模板吗？这将覆盖当前列表（如果为空）。')) {
      setTemplates(MOCK_TEMPLATES);
      showToast('默认模板已恢复', 'success');
    }
  };

  const openCreateModal = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const openEditModal = (template: PromptTemplate) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };
  
  // API密钥相关功能
  const handleApiKeyChange = (config: ApiKeyConfig) => {
    setApiKeyConfig(config);
    showToast('API密钥设置已保存', 'success');
  };
  
  const handleTestApiKey = async (apiKey: string): Promise<boolean> => {
    try {
      // 尝试调用DeepSeek API进行密钥验证
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat', // 使用正确的模型名称
          messages: [
            {
              role: 'user',
              content: '验证API密钥'
            }
          ],
          max_tokens: 10
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('DeepSeek API 验证失败:', response.status, errorData);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('API密钥测试异常:', error);
      return false;
    }
  };

  // Filter Logic
  const allTags = Array.from(new Set(templates.flatMap(t => t.tags)));
  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = selectedTag ? t.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-indigo-200 shadow-md">
               <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">风格提示词管理器</h1>
          </div>

          {/* Center: Mode Switcher */}
          <div className="hidden md:flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setMode(ViewMode.READ)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === ViewMode.READ 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              预览模式
            </button>
            <button
              onClick={() => setMode(ViewMode.EDIT)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === ViewMode.EDIT
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              编辑模式
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <div className="md:hidden">
                {/* Mobile Mode Toggle */}
               <button onClick={() => setMode(mode === ViewMode.READ ? ViewMode.EDIT : ViewMode.READ)} className="p-2 text-slate-600">
                 {mode === ViewMode.READ ? <Edit3 className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
               </button>
            </div>
            
            {/* 功能按钮组 */}
            <div className="flex items-center gap-2">
               

               
              <button
                onClick={handleImport}
                className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="导入模板"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
            
            {/* API密钥设置按钮 */}
            <button
              onClick={() => setShowApiKeySettings(!showApiKeySettings)}
              className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="API密钥设置"
            >
              <Key className="w-5 h-5" />
            </button>
            
            <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-indigo-50 text-indigo-600 border border-indigo-600 rounded-lg font-medium text-sm transition-all active:scale-95"
                title="导出模板"
              >
                <Upload className="w-4 h-4" />
                <span>导出模版</span>
              </button>
            
            <button 
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">创建模板</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* API密钥设置面板 */}
        {showApiKeySettings && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <ApiKeySettings
              onApiKeyChange={handleApiKeyChange}
              onTestApiKey={handleTestApiKey}
            />
          </div>
        )}
        
        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="搜索模板..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm shadow-sm transition-shadow"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-2 sm:pb-0 no-scrollbar">
              <SlidersHorizontal className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
              <button 
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                  selectedTag === null 
                  ? 'bg-slate-800 text-white border-slate-800' 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                全部
              </button>
              {allTags.map(tag => (
                <button 
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                    selectedTag === tag 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        {filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map(template => (
              <div className="relative">
                {selectedTemplateIds.length > 0 && (
                  <input
                    type="checkbox"
                    className="absolute top-2 right-2 z-10 w-5 h-5 bg-white rounded border-2 border-slate-300 focus:ring-2 focus:ring-indigo-500"
                    checked={selectedTemplateIds.includes(template.id)}
                    onChange={(e) => handleSelectTemplate(template.id, e.target.checked)}
                  />
                )}
                <TemplateCard 
                  key={template.id} 
                  template={template} 
                  mode={mode}
                  onCopy={handleCopy}
                  onEdit={openEditModal}
                  onDelete={handleDeleteTemplate}
                />
              </div>
            ))}
            
            {/* New Item Placeholder in Edit Mode */}
            {mode === ViewMode.EDIT && (
              <button 
                onClick={openCreateModal}
                className="group flex flex-col items-center justify-center min-h-[320px] rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
              >
                <div className="w-12 h-12 bg-slate-100 group-hover:bg-white rounded-full flex items-center justify-center mb-4 text-slate-400 group-hover:text-indigo-600 group-hover:shadow-md transition-all">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="font-medium text-slate-600 group-hover:text-indigo-700">创建新模板</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
             <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-10 h-10 text-slate-300" />
             </div>
             <p className="text-lg font-medium text-slate-600">未找到模板</p>
             <p className="text-sm">尝试调整搜索关键词或创建一个新模板。</p>
             <div className="flex gap-3 mt-6">
                <button 
                  onClick={openCreateModal}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 shadow-sm"
                >
                  创建模板
                </button>
                <button 
                  onClick={handleRestoreDefaults}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-medium text-sm hover:bg-slate-50 hover:text-slate-800 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  恢复默认
                </button>
             </div>
          </div>
        )}
      </main>

      {/* Modals & Overlays */}
      <EditorModal 
        isOpen={isModalOpen}
        initialData={editingTemplate}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTemplate}
        apiKey={apiKeyConfig.apiKey}
      />
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setDeleteConfirmId(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">确认删除</h3>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              您确定要删除此风格模板吗？此操作无法撤销。
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-slate-600 font-medium text-sm hover:bg-slate-50 rounded-lg transition-colors"
              >
                取消
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white font-medium text-sm rounded-lg hover:bg-red-700 shadow-sm transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Toast state={toast} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
      
      {/* 保存原始操作提示 */}
      {showSaveOriginalPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold mb-4">保存原始操作</h3>
            <p className="mb-6">您是否要将从分享链接获取的原始操作保存到GitHub存储中？</p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={handleCloseSaveOriginalPrompt}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleSaveOriginalActions}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GitHub认证模态框 */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">GitHub认证</h3>
            <p className="mb-4">请输入GitHub个人访问令牌以访问存储功能。您可以在GitHub设置中创建令牌。</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GitHub个人访问令牌
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="输入您的GitHub令牌"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button 
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setShowTokenModal(false)}
              >
                取消
              </button>
              <button 
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                onClick={handleSaveToken}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 保存到代码库模态框 */}


    </div>
  );
}

export default App;
