
import React from 'react';
import { Copy, Edit2, Trash2, ImageIcon } from 'lucide-react';
import { PromptTemplate, ViewMode } from '../types';

interface TemplateCardProps {
  template: PromptTemplate;
  mode: ViewMode;
  onCopy: (text: string) => void;
  onEdit: (template: PromptTemplate) => void;
  onDelete: (id: string) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  mode,
  onCopy,
  onEdit,
  onDelete,
}) => {
  const isViewMode = mode === ViewMode.READ;

  const handleCardClick = () => {
    if (isViewMode) {
      onCopy(template.promptText);
    }
  };

  return (
    <div 
      className={`group relative bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm transition-all duration-200 
        ${isViewMode ? 'hover:shadow-md hover:-translate-y-1 cursor-pointer' : ''}`}
      onClick={handleCardClick}
    >
      {/* Cover Image - Aspect Ratio 1000:1150 */}
      <div className="aspect-[1000/1150] w-full bg-slate-100 relative overflow-hidden">
        {template.coverImageUrl ? (
          <img 
            src={template.coverImageUrl} 
            alt={template.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <ImageIcon className="w-10 h-10" />
          </div>
        )}
        
        {/* View Mode Overlay Hint */}
        {isViewMode && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-slate-800 font-medium text-sm flex items-center gap-2 shadow-lg">
              <Copy className="w-4 h-4" /> 复制配置
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-slate-800 truncate pr-2" title={template.name}>
            {template.name || '未命名模板'}
          </h3>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {template.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md font-medium">
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-xs rounded-md">
              +{template.tags.length - 3}
            </span>
          )}
        </div>

        <div className="text-xs text-slate-400">
            更新于 {new Date(template.updatedAt).toLocaleDateString('zh-CN')}
        </div>
      </div>

      {/* Edit Mode Actions */}
      {!isViewMode && (
        <div className="absolute top-2 right-2 flex gap-2 z-40">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(template);
            }}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors cursor-pointer"
            title="编辑"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(template.id);
            }}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
