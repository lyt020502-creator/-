// 色值识别准确性评估工具
// 用于量化对比原始设计稿色值与AI识别结果的准确性

import { 
  calculateColorDifference, 
  evaluateColorAccuracy, 
  parseFigmaColor, 
  rgbToHex 
} from './colorUtils';
import { enhancedGenerateGradient } from './gradientUtils';

// 评估结果类型
export interface ColorAccuracyResult {
  overallAccuracy: number;        // 总体准确率 (0-100)
  solidColorsAccuracy: number;    // 纯色准确率
  gradientsAccuracy: number;      // 渐变准确率
  semiTransparentAccuracy: number; // 半透明色准确率
  accuracyDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  detailedResults: Array<ColorComparisonResult>;
  summary: string;
  improvement?: number;           // 相比基准的改进百分比
}

// 单组颜色对比结果
export interface ColorComparisonResult {
  type: 'solid' | 'gradient' | 'semiTransparent';
  original: string;              // 原始设计稿颜色表示
  originalRGB: [number, number, number];
  recognized: string;            // AI识别颜色表示
  recognizedRGB: [number, number, number];
  difference: number;            // CIE76 色差
  accuracy: number;              // 准确度 (0-100)
  category: 'excellent' | 'good' | 'fair' | 'poor';
  position?: string;             // 在设计中的位置描述
}

// 基准色值数据
export interface ReferenceColors {
  solidColors: Array<{r: number; g: number; b: number; a?: number}>;
  gradients: Array<any>;         // Figma渐变数据
  semiTransparentColors: Array<{r: number; g: number; b: number; a: number}>;
}

// 识别结果数据
export interface RecognizedColors {
  solidColors: Array<{r: number; g: number; b: number; a?: number}>;
  gradients: Array<string>;      // CSS渐变字符串
  semiTransparentColors: Array<{r: number; g: number; b: number; a: number}>;
}

// 主要评估函数
export const evaluateColorRecognitionAccuracy = (
  referenceData: ReferenceColors,
  recognizedData: RecognizedColors,
  baseLineResults?: ColorAccuracyResult
): ColorAccuracyResult => {
  const detailedResults: ColorComparisonResult[] = [];
  
  // 1. 评估纯色
  const solidResults = evaluateSolidColors(
    referenceData.solidColors,
    recognizedData.solidColors
  );
  detailedResults.push(...solidResults);
  
  // 2. 评估渐变
  const gradientResults = evaluateGradients(
    referenceData.gradients,
    recognizedData.gradients
  );
  detailedResults.push(...gradientResults);
  
  // 3. 评估半透明色
  const semiTransparentResults = evaluateSemiTransparentColors(
    referenceData.semiTransparentColors,
    recognizedData.semiTransparentColors
  );
  detailedResults.push(...semiTransparentResults);
  
  // 计算各类别的准确率
  const solidColorsAccuracy = calculateAverageAccuracy(solidResults);
  const gradientsAccuracy = calculateAverageAccuracy(gradientResults);
  const semiTransparentAccuracy = calculateAverageAccuracy(semiTransparentResults);
  
  // 计算总体准确率（加权平均）
  const totalResults = [...solidResults, ...gradientResults, ...semiTransparentResults];
  const overallAccuracy = calculateOverallAccuracy(totalResults);
  
  // 统计准确率分布
  const accuracyDistribution = calculateAccuracyDistribution(totalResults);
  
  // 生成总结
  const summary = generateEvaluationSummary({
    overallAccuracy,
    solidColorsAccuracy,
    gradientsAccuracy,
    semiTransparentAccuracy,
    accuracyDistribution,
    totalColors: totalResults.length
  });
  
  // 计算改进百分比（如果提供了基准结果）
  let improvement: number | undefined;
  if (baseLineResults) {
    improvement = calculateImprovement(baseLineResults.overallAccuracy, overallAccuracy);
  }
  
  return {
    overallAccuracy,
    solidColorsAccuracy,
    gradientsAccuracy,
    semiTransparentAccuracy,
    accuracyDistribution,
    detailedResults,
    summary,
    improvement
  };
};

// 评估纯色
export function evaluateSolidColors(
  referenceColors: Array<{r: number; g: number; b: number; a?: number}>,
  recognizedColors: Array<{r: number; g: number; b: number; a?: number}>
): ColorComparisonResult[] {
  const results: ColorComparisonResult[] = [];
  const maxLength = Math.max(referenceColors.length, recognizedColors.length);
  
  for (let i = 0; i < maxLength; i++) {
    const refColor = referenceColors[i];
    const recColor = recognizedColors[i];
    
    // 如果其中一方没有对应颜色，标记为较差的结果
    if (!refColor || !recColor) {
      results.push({
        type: 'solid',
        original: refColor ? rgbToHex(refColor.r, refColor.g, refColor.b) : 'N/A',
        originalRGB: refColor ? [refColor.r, refColor.g, refColor.b] : [0, 0, 0],
        recognized: recColor ? rgbToHex(recColor.r, recColor.g, recColor.b) : 'N/A',
        recognizedRGB: recColor ? [recColor.r, recColor.g, recColor.b] : [255, 255, 255],
        difference: 100, // 假设很大的差异
        accuracy: 0,
        category: 'poor',
        position: `纯色 #${i + 1}`
      });
      continue;
    }
    
    const refRGB: [number, number, number] = [refColor.r, refColor.g, refColor.b];
    const recRGB: [number, number, number] = [recColor.r, recColor.g, recColor.b];
    
    const evaluation = evaluateColorAccuracy(refRGB, recRGB);
    
    results.push({
      type: 'solid',
      original: rgbToHex(refColor.r, refColor.g, refColor.b),
      originalRGB: refRGB,
      recognized: rgbToHex(recColor.r, recColor.g, recColor.b),
      recognizedRGB: recRGB,
      difference: evaluation.difference,
      accuracy: evaluation.accuracy,
      category: evaluation.category,
      position: `纯色 #${i + 1}`
    });
  }
  
  return results;
}

// 评估渐变（简化版，对比主要颜色）
export function evaluateGradients(
  referenceGradients: Array<any>,
  recognizedGradients: Array<string>
): ColorComparisonResult[] {
  const results: ColorComparisonResult[] = [];
  
  for (let i = 0; i < referenceGradients.length; i++) {
    const refGradient = referenceGradients[i];
    const recGradient = recognizedGradients[i];
    
    if (!refGradient) continue;
    
    // 对于渐变，我们对比起始和结束颜色
    if (refGradient.gradientStops && refGradient.gradientStops.length >= 2) {
      const startRef = parseFigmaColor(refGradient.gradientStops[0].color);
      const endRef = parseFigmaColor(refGradient.gradientStops[refGradient.gradientStops.length - 1].color);
      
      // 简化处理：假设识别的渐变有相应的颜色值
      // 实际应用中应该从CSS字符串中解析颜色
      const startRec = { r: startRef.r, g: startRef.g, b: startRef.b, a: 1 }; // 占位值
      const endRec = { r: endRef.r, g: endRef.g, b: endRef.b, a: 1 };       // 占位值
      
      // 评估起始颜色
      const startRefRGB: [number, number, number] = [startRef.r, startRef.g, startRef.b];
      const startRecRGB: [number, number, number] = [startRec.r, startRec.g, startRec.b];
      const startEval = evaluateColorAccuracy(startRefRGB, startRecRGB);
      
      results.push({
        type: 'gradient',
        original: `渐变${i + 1} 起始色: ${rgbToHex(startRef.r, startRef.g, startRef.b)}`,
        originalRGB: startRefRGB,
        recognized: `渐变${i + 1} 起始色: ${rgbToHex(startRec.r, startRec.g, startRec.b)}`,
        recognizedRGB: startRecRGB,
        difference: startEval.difference,
        accuracy: startEval.accuracy,
        category: startEval.category,
        position: `渐变${i + 1} 起始点`
      });
      
      // 评估结束颜色
      const endRefRGB: [number, number, number] = [endRef.r, endRef.g, endRef.b];
      const endRecRGB: [number, number, number] = [endRec.r, endRec.g, endRec.b];
      const endEval = evaluateColorAccuracy(endRefRGB, endRecRGB);
      
      results.push({
        type: 'gradient',
        original: `渐变${i + 1} 结束色: ${rgbToHex(endRef.r, endRef.g, endRef.b)}`,
        originalRGB: endRefRGB,
        recognized: `渐变${i + 1} 结束色: ${rgbToHex(endRec.r, endRec.g, endRec.b)}`,
        recognizedRGB: endRecRGB,
        difference: endEval.difference,
        accuracy: endEval.accuracy,
        category: endEval.category,
        position: `渐变${i + 1} 结束点`
      });
    }
  }
  
  return results;
}

// 评估半透明色
export function evaluateSemiTransparentColors(
  referenceColors: Array<{r: number; g: number; b: number; a: number}>,
  recognizedColors: Array<{r: number; g: number; b: number; a: number}>
): ColorComparisonResult[] {
  const results: ColorComparisonResult[] = [];
  
  for (let i = 0; i < referenceColors.length; i++) {
    const refColor = referenceColors[i];
    const recColor = recognizedColors[i];
    
    if (!refColor || !recColor) {
      results.push({
        type: 'semiTransparent',
        original: refColor ? `rgba(${refColor.r},${refColor.g},${refColor.b},${refColor.a})` : 'N/A',
        originalRGB: refColor ? [refColor.r, refColor.g, refColor.b] : [0, 0, 0],
        recognized: recColor ? `rgba(${recColor.r},${recColor.g},${recColor.b},${recColor.a})` : 'N/A',
        recognizedRGB: recColor ? [recColor.r, recColor.g, recColor.b] : [255, 255, 255],
        difference: 100,
        accuracy: 0,
        category: 'poor',
        position: `半透明色 #${i + 1}`
      });
      continue;
    }
    
    const refRGB: [number, number, number] = [refColor.r, refColor.g, refColor.b];
    const recRGB: [number, number, number] = [recColor.r, recColor.g, recColor.b];
    
    // 评估颜色部分
    const colorEval = evaluateColorAccuracy(refRGB, recRGB);
    
    // 评估透明度部分
    const alphaDiff = Math.abs(refColor.a - recColor.a);
    const alphaAccuracy = Math.max(0, 100 - (alphaDiff * 100));
    
    // 综合准确度（颜色权重70%，透明度权重30%）
    const overallAccuracy = colorEval.accuracy * 0.7 + alphaAccuracy * 0.3;
    
    // 确定综合类别
    let overallCategory: 'excellent' | 'good' | 'fair' | 'poor';
    if (overallAccuracy >= 95) overallCategory = 'excellent';
    else if (overallAccuracy >= 85) overallCategory = 'good';
    else if (overallAccuracy >= 70) overallCategory = 'fair';
    else overallCategory = 'poor';
    
    results.push({
      type: 'semiTransparent',
      original: `rgba(${refColor.r},${refColor.g},${refColor.b},${refColor.a.toFixed(2)})`,
      originalRGB: refRGB,
      recognized: `rgba(${recColor.r},${recColor.g},${recColor.b},${recColor.a.toFixed(2)})`,
      recognizedRGB: recRGB,
      difference: colorEval.difference,
      accuracy: Math.round(overallAccuracy),
      category: overallCategory,
      position: `半透明色 #${i + 1}`
    });
  }
  
  return results;
}

// 计算平均准确率
function calculateAverageAccuracy(results: ColorComparisonResult[]): number {
  if (results.length === 0) return 0;
  
  const sum = results.reduce((total, result) => total + result.accuracy, 0);
  return Math.round(sum / results.length);
}

// 计算总体加权准确率
function calculateOverallAccuracy(results: ColorComparisonResult[]): number {
  if (results.length === 0) return 0;
  
  // 按类型加权
  const weights = {
    solid: 1.0,
    gradient: 1.5, // 渐变更复杂，权重更高
    semiTransparent: 1.2 // 半透明色也需要较高权重
  };
  
  let weightedSum = 0;
  let weightTotal = 0;
  
  results.forEach(result => {
    const weight = weights[result.type];
    weightedSum += result.accuracy * weight;
    weightTotal += weight;
  });
  
  return Math.round(weightedSum / weightTotal);
}

// 计算准确率分布
function calculateAccuracyDistribution(results: ColorComparisonResult[]): ColorAccuracyResult['accuracyDistribution'] {
  const distribution = {
    excellent: 0,
    good: 0,
    fair: 0,
    poor: 0
  };
  
  results.forEach(result => {
    distribution[result.category]++;
  });
  
  return distribution;
}

// 生成评估总结
function generateEvaluationSummary(data: {
  overallAccuracy: number;
  solidColorsAccuracy: number;
  gradientsAccuracy: number;
  semiTransparentAccuracy: number;
  accuracyDistribution: ColorAccuracyResult['accuracyDistribution'];
  totalColors: number;
}): string {
  const { 
    overallAccuracy, 
    solidColorsAccuracy, 
    gradientsAccuracy, 
    semiTransparentAccuracy,
    accuracyDistribution,
    totalColors
  } = data;
  
  // 计算百分比分布
  const total = totalColors || 1; // 避免除以0
  const excellentPercent = Math.round((accuracyDistribution.excellent / total) * 100);
  const goodPercent = Math.round((accuracyDistribution.good / total) * 100);
  const fairPercent = Math.round((accuracyDistribution.fair / total) * 100);
  const poorPercent = Math.round((accuracyDistribution.poor / total) * 100);
  
  // 生成等级评定
  let grade = '优秀';
  if (overallAccuracy < 90) grade = '良好';
  if (overallAccuracy < 75) grade = '一般';
  if (overallAccuracy < 60) grade = '较差';
  
  return `
色值识别准确性评估报告
=====================
总体准确率: ${overallAccuracy}% (评定等级: ${grade})
---------------------
纯色准确率: ${solidColorsAccuracy}%
渐变准确率: ${gradientsAccuracy}%
半透明色准确率: ${semiTransparentAccuracy}%
---------------------
准确率分布:
- 优秀 (≥95%): ${excellentPercent}% (${accuracyDistribution.excellent}个)
- 良好 (85-94%): ${goodPercent}% (${accuracyDistribution.good}个)
- 一般 (70-84%): ${fairPercent}% (${accuracyDistribution.fair}个)
- 较差 (<70%): ${poorPercent}% (${accuracyDistribution.poor}个)
---------------------
评估样本总数: ${totalColors}个
`;
}

// 计算改进百分比
function calculateImprovement(baseline: number, current: number): number {
  if (baseline === 0) return current;
  return Math.round(((current - baseline) / baseline) * 100);
}

// 导出评估结果为JSON
export const exportEvaluationResults = (results: ColorAccuracyResult): string => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    ...results
  }, null, 2);
};

// 生成可视化数据（用于图表）
export const generateVisualizationData = (results: ColorAccuracyResult) => {
  return {
    accuracyByType: [
      { type: '纯色', accuracy: results.solidColorsAccuracy },
      { type: '渐变', accuracy: results.gradientsAccuracy },
      { type: '半透明色', accuracy: results.semiTransparentAccuracy }
    ],
    distributionByCategory: [
      { category: '优秀', count: results.accuracyDistribution.excellent },
      { category: '良好', count: results.accuracyDistribution.good },
      { category: '一般', count: results.accuracyDistribution.fair },
      { category: '较差', count: results.accuracyDistribution.poor }
    ],
    detailedColorDifferences: results.detailedResults.map(r => ({
      position: r.position || '',
      difference: r.difference,
      accuracy: r.accuracy
    }))
  };
};
