# 样式配置代码 - 颜色和透明度设置

## 概述
本文档汇总了风格提示词管理器应用中所有包含颜色和透明度设置的样式代码。这些样式定义了应用的视觉外观，包括按钮、导航栏、模态框等UI元素的颜色和透明度属性。

## 主要颜色方案
- **主色调**: indigo-600（蓝色）- 用于主要按钮和高亮元素
- **辅助色**: 
  - 红色 (red-600): 用于删除操作
  - 绿色 (green-600): 用于保存操作
- **中性色**: 
  - slate系列: 用于背景、文字和边框
  - white: 用于卡片和模态框背景

## 透明度方案
- 80% 透明度: 用于导航栏背景
- 60% 透明度: 用于模态框背景遮罩
- 50% 透明度: 用于提示背景遮罩
- 50% 透明度: 用于悬停状态的背景

## 透明度设置

1. 导航栏背景透明度
```tsx
<header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
```

2. 创建新模板占位符悬停背景透明度
```tsx
<button 
  onClick={openCreateModal}
  className="group flex flex-col items-center justify-center min-h-[320px] rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
>
```

3. 删除确认模态框背景透明度
```tsx
<div 
  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
  onClick={() => setDeleteConfirmId(null)}
/>
```

4. 保存原始操作提示背景透明度
```tsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
```

5. GitHub认证模态框背景透明度
```tsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
```

## 导航栏相关

1. Logo背景色
```tsx
<div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-indigo-200 shadow-md">
   <LayoutGrid className="w-5 h-5 text-white" />
</div>
```

2. 标题文字颜色
```tsx
h1 className="text-lg font-bold text-slate-800 tracking-tight">风格提示词管理器</h1>
```

3. 模式切换按钮颜色
```tsx
<button
  onClick={() => setMode(ViewMode.READ)}
  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === ViewMode.READ ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
>
  预览模式
</button>

<button
  onClick={() => setMode(ViewMode.EDIT)}
  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === ViewMode.EDIT ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
>
  编辑模式
</button>
```

## 按钮样式

1. 导入模板按钮
```tsx
<button
  onClick={handleImport}
  className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
  title="导入模板"
>
  <Download className="w-5 h-5" />
</button>
```

2. API密钥设置按钮
```tsx
<button
  onClick={() => setShowApiKeySettings(!showApiKeySettings)}
  className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
  title="API密钥设置"
>
  <Key className="w-5 h-5" />
</button>
```

3. 导出模板按钮
```tsx
<button
  onClick={handleExport}
  className="flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-indigo-50 text-indigo-600 border border-indigo-600 rounded-lg font-medium text-sm transition-all active:scale-95"
  title="导出模板"
>
  <Upload className="w-4 h-4" />
  <span>导出模版</span>
</button>
```

4. 创建模板按钮
```tsx
<button 
  onClick={openCreateModal}
  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-all shadow-sm hover:shadow-md active:scale-95"
>
  <Plus className="w-4 h-4" />
  <span className="hidden sm:inline">创建模板</span>
</button>
```

## 搜索框样式
```tsx
<input 
  type="text"
  placeholder="搜索模板..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm shadow-sm transition-shadow"
/>
```

## 标签筛选按钮
```tsx
<button 
  onClick={() => setSelectedTag(null)}
  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${selectedTag === null ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
>
  全部
</button>

{allTags.map(tag => (
  <button 
    key={tag}
    onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${selectedTag === tag ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
  >
    {tag}
  </button>
))}
```

## 模板卡片相关

1. 复选框样式
```tsx
<input
  type="checkbox"
  className="absolute top-2 right-2 z-10 w-5 h-5 bg-white rounded border-2 border-slate-300 focus:ring-2 focus:ring-indigo-500"
  checked={selectedTemplateIds.includes(template.id)}
  onChange={(e) => handleSelectTemplate(template.id, e.target.checked)}
/>
```

2. 创建新模板占位符
```tsx
<button 
  onClick={openCreateModal}
  className="group flex flex-col items-center justify-center min-h-[320px] rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
>
  <div className="w-12 h-12 bg-slate-100 group-hover:bg-white rounded-full flex items-center justify-center mb-4 text-slate-400 group-hover:text-indigo-600 group-hover:shadow-md transition-all">
    <Plus className="w-6 h-6" />
  </div>
  <span className="font-medium text-slate-600 group-hover:text-indigo-700">创建新模板</span>
</button>
```

## 空状态样式
```tsx
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
```

## 模态框样式

1. 删除确认模态框按钮
```tsx
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
```

2. 保存原始操作提示按钮
```tsx
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
```

3. GitHub认证模态框按钮
```tsx
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
```

4. 输入框样式
```tsx
<input
  type="password"
  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
  value={githubToken}
  onChange={(e) => setGithubToken(e.target.value)}
  placeholder="输入您的GitHub令牌"
/>
```