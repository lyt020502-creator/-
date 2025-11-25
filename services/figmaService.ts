
// 确保在Node.js环境中也能正常工作
export interface FigmaData {
  blob: any; // 使用any类型以兼容Node.js和浏览器环境
  nodeData: any | null;
  name?: string;
}

// 提供fetch的兼容性实现
const fetchImplementation = typeof fetch !== 'undefined' ? fetch : (() => {
  try {
    return require('node-fetch');
  } catch (e) {
    throw new Error('fetch API not available and node-fetch not installed');
  }
})();

// 提供Blob的兼容性实现
const BlobImplementation = typeof Blob !== 'undefined' ? Blob : (() => {
  try {
    return require('buffer').Buffer;
  } catch (e) {
    throw new Error('Blob not available and buffer module not found');
  }
})();

// 辅助：清洗 Node ID (处理浏览器 URL 格式与 API 格式差异)
const cleanNodeId = (id: string) => {
  if (id.includes('-') && !id.includes(':')) {
    return id.replace(/-/g, ':');
  }
  return id;
};

// 辅助：解析 Figma URL
export const parseFigmaUrl = (url: string) => {
  const keyMatch = url.match(/figma\.com\/(?:file|design|proto)\/([a-zA-Z0-9]+)/);
  const fileKey = keyMatch ? keyMatch[1] : null;
  
  const nodeIdMatch = url.match(/[?&]node-id=([^&]+)/);
  const nodeId = nodeIdMatch ? cleanNodeId(decodeURIComponent(nodeIdMatch[1])) : null;

  return { fileKey, nodeId };
};

export const fetchFigmaData = async (fileUrl: string, token: string): Promise<FigmaData> => {
  const { fileKey, nodeId } = parseFigmaUrl(fileUrl);

  if (!fileKey) {
    throw new Error("无法解析 Figma URL，请确保链接包含文件 Key (如 figma.com/design/KEY...)。");
  }

  const headers = {
    'X-Figma-Token': token
  };

  let imageUrl: string | null = null;
  let nodeData: any = null;
  let name: string | undefined = undefined;

  try {
    // 1. 获取视觉图像 (Image)
    if (nodeId) {
      // 获取特定节点的渲染图 (scale=2 保证清晰度)
      const imageResp = await fetchImplementation(`https://api.figma.com/v1/images/${fileKey}?ids=${nodeId}&format=png&scale=2`, { headers });
      const imageData = await imageResp.json();
      
      if (!imageResp.ok) throw new Error(imageData.err || `Figma Image API 请求失败 (${imageResp.status})`);
      
      // 尝试获取 URL
      imageUrl = imageData.images[nodeId];
      if (!imageUrl && imageData.images) {
          const values = Object.values(imageData.images);
          if (values.length > 0) imageUrl = values[0] as string;
      }

      // 2. 并行获取节点原始数据 (Node Data) - 用于精确色彩提取
      try {
        const nodeResp = await fetchImplementation(`https://api.figma.com/v1/files/${fileKey}/nodes?ids=${nodeId}`, { headers });
        if (nodeResp.ok) {
          const nodeJson = await nodeResp.json();
          const node = nodeJson.nodes?.[nodeId];
          if (node) {
            nodeData = node.document; // 包含 fills, strokes 等原始数据
            name = node.document?.name;
          }
        }
      } catch (e) {
        console.warn("获取 Figma 节点数据失败，将降级为仅使用图像分析:", e);
      }

    } else {
      // 如果没有 nodeId，仅获取文件缩略图
      const fileResp = await fetchImplementation(`https://api.figma.com/v1/files/${fileKey}`, { headers });
      const fileData = await fileResp.json();
      if (!fileResp.ok) throw new Error(fileData.err || `Figma File API 请求失败 (${fileResp.status})`);
      imageUrl = fileData.thumbnailUrl;
      name = fileData.name;
    }

    if (!imageUrl) {
      throw new Error("Figma 未返回图片 URL，请检查 Node ID 是否存在或是否有权访问。");
    }

    // 3. 下载图片资源
    const imgResponse = await fetchImplementation(imageUrl);
    if (!imgResponse.ok) throw new Error("下载 Figma 图片资源失败");
    
    // 根据环境获取适当的二进制数据
    let blob;
    if (typeof window !== 'undefined') {
      // 浏览器环境
      blob = await imgResponse.blob();
    } else {
      // Node.js环境
      const arrayBuffer = await imgResponse.arrayBuffer();
      const buffer = require('buffer').Buffer.from(arrayBuffer);
      blob = buffer;
    }
    
    return { blob, nodeData, name };

  } catch (error: any) {
    console.error("Figma Service Error:", error);
    throw new Error(error.message || "连接 Figma 失败");
  }
};

// 保持向后兼容（如果其他地方有用到）
export const getFigmaImage = async (fileUrl: string, token: string): Promise<Blob> => {
    const { blob } = await fetchFigmaData(fileUrl, token);
    return blob;
};
