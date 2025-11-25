import React, { useState, useEffect } from 'react';
import { ApiKeyConfig } from '../types';

interface ApiKeySettingsProps {
  onApiKeyChange: (config: ApiKeyConfig) => void;
  onTestApiKey: (apiKey: string) => Promise<boolean>;
}

const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({ onApiKeyChange, onTestApiKey }) => {
  const [apiKey, setApiKey] = useState('');
  const [saveToLocalStorage, setSaveToLocalStorage] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  // 从localStorage加载已保存的API密钥
  useEffect(() => {
    const savedApiKey = localStorage.getItem('deepseek_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setSaveToLocalStorage(true);
    }
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
    // 重置测试结果
    setTestResult('idle');
    setTestMessage('');
  };

  const handleSaveToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSaveToLocalStorage(e.target.checked);
  };

  const handleSave = () => {
    const config: ApiKeyConfig = {
      apiKey,
      saveToLocalStorage
    };

    // 根据用户选择保存或移除localStorage中的密钥
    if (saveToLocalStorage && apiKey) {
      localStorage.setItem('deepseek_api_key', apiKey);
    } else {
      localStorage.removeItem('deepseek_api_key');
    }

    onApiKeyChange(config);
  };

  const handleTest = async () => {
    if (!apiKey) {
      setTestResult('error');
      setTestMessage('请输入API密钥');
      return;
    }

    setIsTesting(true);
    setTestResult('idle');
    setTestMessage('正在测试连接...');

    try {
      const success = await onTestApiKey(apiKey);
      if (success) {
        setTestResult('success');
        setTestMessage('API密钥有效！连接成功。');
      } else {
        setTestResult('error');
        setTestMessage('API密钥无效或连接失败。');
      }
    } catch (error) {
      setTestResult('error');
      setTestMessage('测试失败：' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-white dark:bg-gray-800">
      <h3 className="text-lg font-medium">DeepSeek API 密钥设置</h3>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium">API 密钥</label>
        <div className="flex space-x-2">
          <input
            type="password"
            value={apiKey}
            onChange={handleApiKeyChange}
            placeholder="输入您的 DeepSeek API 密钥"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
          <button
            onClick={handleTest}
            disabled={isTesting}
            className={`px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition ${isTesting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isTesting ? '测试中...' : '测试'}
          </button>
        </div>
        
        {testResult !== 'idle' && (
          <div className={`text-sm ${testResult === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {testMessage}
          </div>
        )}
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="save-to-storage"
          checked={saveToLocalStorage}
          onChange={handleSaveToggle}
          className="mr-2"
        />
        <label htmlFor="save-to-storage" className="text-sm">
          保存到本地存储（便于下次使用）
        </label>
      </div>

      <div className="pt-2">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          保存设置
        </button>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>注意：</strong> API密钥将仅保存在您的本地浏览器中，不会上传到服务器。
          要获取API密钥，请访问 <a href="https://platform.deepseek.com/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">DeepSeek Developer Platform</a>。
        </p>
      </div>
    </div>
  );
};

export default ApiKeySettings;