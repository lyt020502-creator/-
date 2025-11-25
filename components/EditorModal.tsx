
import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Wand2, Save, Loader2, ImagePlus, Link as LinkIcon, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { PromptTemplate } from '../types';
import { generateStylePrompt } from '../services/deepseekService';
import { fetchFigmaData } from '../services/figmaService';

interface EditorModalProps {
  isOpen: boolean;
  initialData: PromptTemplate | null;
  onClose: () => void;
  onSave: (template: PromptTemplate) => void;
  apiKey?: string;
}

type UploadTab = 'image' | 'figma';

export const EditorModal: React.FC<EditorModalProps> = ({ isOpen, initialData, onClose, onSave, apiKey }) => {
  const [name, setName] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [promptText, setPromptText] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Figma State
  const [activeTab, setActiveTab] = useState<UploadTab>('image');
  const [figmaUrl, setFigmaUrl] = useState('');
  const [figmaToken, setFigmaToken] = useState('');
  const [isEditingToken, setIsEditingToken] = useState(true); // 控制是否显示 Token 输入框
  // 存储 Figma 原始数据以供后续重新生成使用
  const [figmaRawData, setFigmaRawData] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setTags(initialData.tags);
        setPromptText(initialData.promptText);
        setCoverImage(initialData.coverImageUrl);
        setImageFile(null);
      } else {
        setName('新风格模板');
        setTags([]);
        setPromptText('');
        setCoverImage(null);
        setImageFile(null);
      }
      setError(null);
      setFigmaUrl('');
      setFigmaRawData(null);
      
      // Try to load token from local storage
      const savedToken = localStorage.getItem('figma_pat');
      if (savedToken) {
        setFigmaToken(savedToken);
        setIsEditingToken(false); // Token 存在，默认为非编辑状态
      } else {
        setFigmaToken('');
        setIsEditingToken(true);
      }
      setActiveTab('image');
    }
  }, [isOpen, initialData]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('请上传有效的图片文件 (JPG, PNG)。');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过 5MB。');
      return;
    }

    setImageFile(file);
    setFigmaRawData(null); // Clear figma data if user manually uploads image
    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFigmaFetch = async () => {
    if (!figmaUrl.trim()) {
      setError('请输入 Figma 链接。');
      return;
    }
    if (!figmaToken.trim()) {
      setError('请输入 Figma Access Token。');
      return;
    }

    setIsGenerating(true);
    setError(null);
    localStorage.setItem('figma_pat', figmaToken);
    setIsEditingToken(false); // 成功发起请求后，锁定 Token 输入框

    try {
      // 1. 获取 Figma 数据（包含图片 Blob 和 节点 JSON）
      const { blob, nodeData, name: figmaName } = await fetchFigmaData(figmaUrl, figmaToken);
      
      const file = new File([blob], "figma_export.png", { type: "image/png" });
      setImageFile(file);
      setFigmaRawData(nodeData);

      // Auto fill name if empty
      if (!name || name === '新风格模板') {
        if (figmaName) setName(figmaName);
      }

      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string);
      };
      reader.readAsDataURL(blob);

      // 2. Generate Prompt using both Image and JSON Data
      const generatedText = await generateStylePrompt(file, promptText, nodeData, apiKey);
      setPromptText(generatedText);

    } catch (err: any) {
      setError(err.message || '获取 Figma 内容失败。');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGeneratePrompt = async () => {
    if (!imageFile && !initialData?.coverImageUrl) {
      setError('请先上传图片。');
      return;
    }

    if (!imageFile) {
        setError('如需生成新配置，请重新上传源图片。');
        return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Pass figmaRawData if available
      const generatedText = await generateStylePrompt(imageFile, promptText, figmaRawData, apiKey);
      setPromptText(generatedText);
    } catch (err: any) {
      setError(err.message || '生成配置失败，请重试。');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('请输入模板名称。');
      return;
    }
    if (!promptText.trim()) {
      setError('内容不能为空。');
      return;
    }
    if (!coverImage) {
      setError('请上传或生成封面图片。');
      return;
    }

    const template: PromptTemplate = {
      id: initialData ? initialData.id : Date.now().toString(),
      name,
      tags,
      coverImageUrl: coverImage,
      promptText,
      createdAt: initialData ? initialData.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    onSave(template);
    onClose();
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const toggleTokenEdit = () => {
    setIsEditingToken(!isEditingToken);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-10">
          <div className="flex-1">
             <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xl font-bold text-slate-800 border-none focus:ring-0 p-0 placeholder-slate-300 w-full max-w-md"
              placeholder="模板名称..."
            />
             <div className="text-xs text-slate-400 mt-1">{initialData ? '编辑模板' : '创建新模板'}</div>
          </div>
         
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {/* Left Column: Image Source */}
          <div className="w-full lg:w-[450px] bg-slate-50 border-r border-slate-200 flex flex-col overflow-y-auto">
            
            {/* Source Tabs */}
            <div className="flex border-b border-slate-200 bg-white">
              <button
                onClick={() => setActiveTab('image')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'image' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Upload className="w-4 h-4" /> 图片上传
              </button>
              <button
                onClick={() => setActiveTab('figma')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'figma' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <LinkIcon className="w-4 h-4" /> Figma 链接
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6">
              
              {/* Preview Area (Shared) - Aspect Ratio 1000:1150 */}
              <div 
                className={`aspect-[1000/1150] w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden transition-colors shadow-sm
                  ${!coverImage ? 'border-slate-300 bg-slate-100' : 'border-slate-200 bg-white'}`}
              >
                {coverImage ? (
                  <>
                    <img src={coverImage} alt="Preview" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center group">
                       {activeTab === 'image' && (
                         <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="opacity-0 group-hover:opacity-100 bg-white/90 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all"
                        >
                          <ImagePlus className="w-4 h-4" /> 更换图片
                        </button>
                       )}
                    </div>
                  </>
                ) : (
                   <div className="text-center p-6">
                      {activeTab === 'image' ? (
                        <>
                          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <ImagePlus className="w-8 h-8" />
                          </div>
                          <p className="text-sm text-slate-500 mb-4">支持 JPG, PNG (Max 5MB)</p>
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
                          >
                            选择本地文件
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                          <LinkIcon className="w-8 h-8 mb-2" />
                          <span className="text-xs">输入链接并点击提取</span>
                        </div>
                      )}
                   </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/png, image/jpeg" 
                  onChange={handleImageUpload}
                />
              </div>

              {/* Figma Inputs */}
              {activeTab === 'figma' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Figma 链接</label>
                    <input 
                      type="text" 
                      value={figmaUrl}
                      onChange={(e) => setFigmaUrl(e.target.value)}
                      placeholder="https://www.figma.com/design/..."
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <p className="text-[10px] text-slate-400">请使用具体的节点链接（包含 ?node-id=）以获得最佳数据精度</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-500">Personal Access Token</label>
                      <a href="https://www.figma.com/developers/api#access-tokens" target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 hover:underline">
                        如何获取?
                      </a>
                    </div>
                    
                    {!isEditingToken && figmaToken ? (
                      <div className="flex items-center justify-between p-2 bg-slate-100 border border-slate-200 rounded-lg">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Lock className="w-3 h-3 text-green-600" />
                          <span className="text-xs font-medium">Token 已保存</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({figmaToken.slice(0, 4)}...{figmaToken.slice(-4)})
                          </span>
                        </div>
                        <button 
                          onClick={toggleTokenEdit}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                        >
                          修改
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input 
                          type="password" 
                          value={figmaToken}
                          onChange={(e) => setFigmaToken(e.target.value)}
                          placeholder="figd_..."
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none pr-16"
                        />
                         {!isEditingToken && (
                           <button 
                              onClick={toggleTokenEdit} 
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                            >
                              取消
                           </button>
                         )}
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={handleFigmaFetch}
                    disabled={isGenerating}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    提取并分析
                  </button>

                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800 leading-relaxed">
                      系统将同时获取<strong>渲染图</strong>和<strong>节点原始数据(JSON)</strong>，通过双重验证确保色彩提取与设计稿完全一致（0误差）。
                    </p>
                  </div>
                </div>
              )}

              {/* Tag Editor */}
              <div className="pt-4 border-t border-slate-200">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">标签</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md font-medium flex items-center gap-1">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="添加标签..."
                  />
                  <button onClick={addTag} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200">
                    添加
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Prompt Editor */}
          <div className="flex-1 flex flex-col bg-white h-full overflow-hidden">
             <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-indigo-600" />
                    样式配置代码
                  </h3>
                  {figmaRawData && (
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-medium border border-green-200">
                      Figma 数据已连接
                    </span>
                  )}
                </div>
                <button 
                  onClick={handleGeneratePrompt}
                  disabled={isGenerating || (!imageFile && !initialData)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${isGenerating 
                      ? 'bg-slate-100 text-slate-400 cursor-wait' 
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 shadow-sm'}`}
                >
                  {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  {isGenerating ? '分析中...' : '重新生成'}
                </button>
             </div>

             <div className="flex-1 p-0 relative h-full">
                <textarea 
                  className="w-full h-full p-6 resize-none focus:outline-none text-slate-700 leading-relaxed font-mono text-sm bg-slate-50/30"
                  placeholder={activeTab === 'image' ? "上传图片后点击生成..." : "粘贴 Figma 链接后点击提取..."}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                ></textarea>
                
                {error && (
                  <div className="absolute bottom-4 left-4 right-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 shadow-lg">
                    <X className="w-4 h-4 cursor-pointer flex-shrink-0" onClick={() => setError(null)} />
                    {error}
                  </div>
                )}
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3 z-10 flex-shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-600 font-medium text-sm hover:bg-slate-50 rounded-lg transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-slate-900 text-white font-medium text-sm rounded-lg hover:bg-slate-800 shadow-sm transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> 保存模板
          </button>
        </div>

      </div>
    </div>
  );
};
