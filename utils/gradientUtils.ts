// 渐变和半透明色处理工具，增强识别能力

import { parseFigmaColor, rgbToHex, rgbaToHexAlpha } from './colorUtils';

// 渐变类型定义
export interface GradientStop {
  position: number;
  color: {
    r: number;
    g: number;
    b: number;
    a?: number;
  };
}

export interface LinearGradient {
  type: 'GRADIENT_LINEAR';
  gradientTransform: number[];
  gradientStops: GradientStop[];
}

export interface SemiTransparentColor {
  r: number;
  g: number;
  b: number;
  a: number;
  hex: string;
  layerEffect?: 'fill' | 'stroke' | 'background';
}

// 高级渐变角度计算
export const calculateGradientAngle = (transform: number[]): number => {
  if (!transform || transform.length < 4) return 0;
  
  // Figma的gradientTransform是仿射变换矩阵 [a, b, c, d, e, f]
  const [a, b, c, d] = transform;
  
  // 计算主方向向量
  const angle = Math.atan2(b, a) * (180 / Math.PI);
  
  // 转换为CSS渐变角度（0deg表示从下到上，90deg表示从左到右）
  let cssAngle = 90 - angle;
  
  // 归一化到0-360范围
  cssAngle = ((cssAngle % 360) + 360) % 360;
  
  return Math.round(cssAngle);
};

// 增强的渐变生成，支持更多渐变类型和优化
export const enhancedGenerateGradient = (gradient: LinearGradient): string => {
  const angle = calculateGradientAngle(gradient.gradientTransform);
  
  // 优化渐变停止点排序
  const sortedStops = [...gradient.gradientStops].sort((a, b) => a.position - b.position);
  
  // 检查并修复渐变停止点（确保有起始和结束点）
  const optimizedStops = ensureGradientStops(sortedStops);
  
  // 生成渐变停止点字符串
  const stops = optimizedStops.map(stop => {
    const color = parseFigmaColor(stop.color);
    const colorString = color.a < 1 
      ? rgbaToHexAlpha(color.r, color.g, color.b, color.a)
      : rgbToHex(color.r, color.g, color.b);
    
    // 精确到两位小数的百分比
    const position = Math.round(stop.position * 10000) / 100;
    return `${colorString} ${position}%`;
  }).join(', ');
  
  return `linear-gradient(${angle}deg, ${stops})`;
};

// 确保渐变停止点包含0%和100%
function ensureGradientStops(stops: GradientStop[]): GradientStop[] {
  if (stops.length === 0) return stops;
  
  const result = [...stops];
  
  // 确保有起始点 (position: 0)
  if (stops[0].position > 0.01) {
    result.unshift({
      position: 0,
      color: stops[0].color
    });
  }
  
  // 确保有结束点 (position: 1)
  const lastStop = stops[stops.length - 1];
  if (lastStop.position < 0.99) {
    result.push({
      position: 1,
      color: lastStop.color
    });
  }
  
  return result;
}

// 优化半透明色识别
export const processSemiTransparentColors = (colors: Array<{r: number; g: number; b: number; a: number}>): SemiTransparentColor[] => {
  return colors.map(color => ({
    ...color,
    hex: rgbaToHexAlpha(color.r, color.g, color.b, color.a)
  }));
};

// 分析渐变平滑度并优化
export const optimizeGradientSmoothness = (gradient: LinearGradient): LinearGradient => {
  const { gradientStops } = gradient;
  
  // 如果停止点太少，可能需要插值来增强平滑度
  if (gradientStops.length < 3) {
    const optimizedStops = interpolateGradientStops(gradientStops);
    return {
      ...gradient,
      gradientStops: optimizedStops
    };
  }
  
  return gradient;
};

// 插值生成中间渐变停止点以增强平滑度
function interpolateGradientStops(stops: GradientStop[]): GradientStop[] {
  if (stops.length <= 1) return stops;
  
  const result: GradientStop[] = [];
  
  for (let i = 0; i < stops.length - 1; i++) {
    const current = stops[i];
    const next = stops[i + 1];
    
    // 添加当前停止点
    result.push(current);
    
    // 如果两个停止点之间距离足够大，添加中间插值点
    if (next.position - current.position > 0.2) {
      const midPosition = (current.position + next.position) / 2;
      
      // 计算颜色插值
      const currentColor = parseFigmaColor(current.color);
      const nextColor = parseFigmaColor(next.color);
      
      const midColor = {
        r: Math.round((currentColor.r + nextColor.r) / 2),
        g: Math.round((currentColor.g + nextColor.g) / 2),
        b: Math.round((currentColor.b + nextColor.b) / 2),
        a: (currentColor.a + nextColor.a) / 2
      };
      
      result.push({
        position: midPosition,
        color: midColor
      });
    }
  }
  
  // 添加最后一个停止点
  result.push(stops[stops.length - 1]);
  
  return result;
}

// 从图像数据中检测渐变区域（基于像素分析）
export const detectGradientAreas = (imageData: ImageData): Array<{x: number; y: number; width: number; height: number}> => {
  const { data, width, height } = imageData;
  const gradientRegions: Array<{x: number; y: number; width: number; height: number}> = [];
  const processed = new Set<string>();
  
  // 简单的区域检测算法
  for (let y = 0; y < height - 10; y += 5) {
    for (let x = 0; x < width - 10; x += 5) {
      const key = `${x},${y}`;
      if (processed.has(key)) continue;
      
      // 检测是否为渐变区域
      if (isGradientRegion(imageData, x, y, 10, 10)) {
        // 扩展区域
        const region = expandGradientRegion(imageData, x, y, processed);
        gradientRegions.push(region);
      }
    }
  }
  
  return gradientRegions;
};

// 检测小区域是否为渐变
function isGradientRegion(imageData: ImageData, x: number, y: number, width: number, height: number): boolean {
  const { data, width: imgWidth } = imageData;
  let colorVariance = 0;
  let pixelCount = 0;
  let lastColor: [number, number, number] | null = null;
  
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const pos = ((y + py) * imgWidth + (x + px)) * 4;
      const r = data[pos];
      const g = data[pos + 1];
      const b = data[pos + 2];
      
      if (lastColor) {
        const diff = Math.abs(r - lastColor[0]) + 
                    Math.abs(g - lastColor[1]) + 
                    Math.abs(b - lastColor[2]);
        colorVariance += diff;
        pixelCount++;
      }
      
      lastColor = [r, g, b];
    }
  }
  
  // 计算平均颜色变化，超过阈值认为是渐变
  const avgVariance = pixelCount > 0 ? colorVariance / pixelCount : 0;
  return avgVariance > 15; // 阈值可调整
}

// 扩展并获取渐变区域边界
function expandGradientRegion(imageData: ImageData, startX: number, startY: number, processed: Set<string>): {x: number; y: number; width: number; height: number} {
  // 简化实现：返回固定大小的区域
  // 实际应用中应该实现更复杂的区域生长算法
  for (let y = startY; y < startY + 20; y++) {
    for (let x = startX; x < startX + 20; x++) {
      processed.add(`${x},${y}`);
    }
  }
  
  return { x: startX, y: startY, width: 20, height: 20 };
}

// 生成渐变预览信息，用于调试和优化
export const generateGradientPreviewInfo = (gradient: LinearGradient): string => {
  const angle = calculateGradientAngle(gradient.gradientTransform);
  const stops = gradient.gradientStops.map((stop, index) => {
    const color = parseFigmaColor(stop.color);
    const colorString = color.a < 1 
      ? `rgba(${color.r},${color.g},${color.b},${color.a.toFixed(2)})`
      : rgbToHex(color.r, color.g, color.b);
    return `Stop ${index + 1}: ${colorString} at ${Math.round(stop.position * 100)}%`;
  });
  
  return `Linear Gradient (${angle}°)\n${stops.join('\n')}`;
};
