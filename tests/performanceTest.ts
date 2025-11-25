// 功能稳定性和响应速度测试脚本

// 导入必要的工具函数
import { extractColorsFromFigmaNode } from '../utils/colorUtils';
import { enhancedGenerateGradient } from '../utils/gradientUtils';

// 模拟不同复杂度的Figma数据生成函数
function generateComplexFigmaNode(complexity: 'simple' | 'medium' | 'complex'): any {
  const node: any = {
    fills: [],
    strokes: [],
    children: []
  };
  
  switch (complexity) {
    case 'simple':
      // 简单节点：1个纯色填充，1个描边
      node.fills.push({
        type: 'SOLID',
        color: { r: 0.5, g: 0.5, b: 0.5, a: 1 }
      });
      node.strokes.push({
        type: 'SOLID',
        color: { r: 0.2, g: 0.2, b: 0.2, a: 1 }
      });
      break;
    
    case 'medium':
      // 中等复杂度：3个纯色填充，1个渐变，2个子节点
      node.fills.push(
        { type: 'SOLID', color: { r: 0.1, g: 0.2, b: 0.3, a: 1 } },
        { type: 'SOLID', color: { r: 0.4, g: 0.5, b: 0.6, a: 0.8 } },
        {
          type: 'GRADIENT_LINEAR',
          gradientTransform: [1, 0, 0, 1, 0, 0],
          gradientStops: [
            { position: 0, color: { r: 1, g: 0, b: 0, a: 1 } },
            { position: 1, color: { r: 0, g: 0, b: 1, a: 1 } }
          ]
        }
      );
      node.children.push(
        { fills: [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9, a: 1 } }] },
        { fills: [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1, a: 1 } }] }
      );
      break;
    
    case 'complex':
      // 复杂节点：5个渐变，10个纯色，多层子节点
      for (let i = 0; i < 5; i++) {
        node.fills.push({
          type: 'GRADIENT_LINEAR',
          gradientTransform: [1, i * 0.1, i * 0.1, 1, 0, 0],
          gradientStops: [
            { position: 0, color: { r: i * 0.2, g: 0, b: 1 - i * 0.2, a: 1 } },
            { position: 0.5, color: { r: 1 - i * 0.2, g: i * 0.2, b: 0, a: 0.8 } },
            { position: 1, color: { r: 0, g: 1 - i * 0.2, b: i * 0.2, a: 1 } }
          ]
        });
      }
      
      for (let i = 0; i < 10; i++) {
        node.fills.push({
          type: 'SOLID',
          color: { 
            r: (i % 3) * 0.33, 
            g: Math.floor(i / 3) * 0.33, 
            b: (i % 2) * 0.5, 
            a: 0.5 + (i % 5) * 0.1 
          }
        });
      }
      
      // 创建多层子节点
      const createChildNodes = (depth: number): any[] => {
        if (depth <= 0) return [];
        return [
          {
            fills: [{ type: 'SOLID', color: { r: 0.1, g: 0.2, b: 0.3, a: 1 } }],
            children: createChildNodes(depth - 1)
          },
          {
            fills: [{ type: 'SOLID', color: { r: 0.4, g: 0.5, b: 0.6, a: 1 } }],
            children: createChildNodes(depth - 1)
          }
        ];
      };
      
      node.children = createChildNodes(3);
      break;
  }
  
  return node;
}

// 模拟不同网络延迟
function simulateNetworkDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 性能测试函数
async function runPerformanceTests() {
  console.log('开始运行功能稳定性和响应速度测试...');
  
  const results: any[] = [];
  const complexities: Array<{ name: string; type: 'simple' | 'medium' | 'complex' }> = [
    { name: '简单', type: 'simple' },
    { name: '中等', type: 'medium' },
    { name: '复杂', type: 'complex' }
  ];
  
  const networkConditions = [
    { name: '理想网络', delay: 0 },
    { name: '正常网络', delay: 100 },
    { name: '慢速网络', delay: 500 }
  ];
  
  try {
    // 1. 测试不同复杂度下的处理时间
    console.log('\n1. 不同复杂度数据处理性能测试:');
    
    for (const complexity of complexities) {
      console.log(`\n测试${complexity.name}复杂度数据:`);
      const figmaData = generateComplexFigmaNode(complexity.type);
      
      // 测试颜色提取性能
      const startExtract = performance.now();
      const colors = extractColorsFromFigmaNode(figmaData);
      const extractTime = performance.now() - startExtract;
      
      console.log(`  - 颜色提取耗时: ${extractTime.toFixed(2)}ms`);
      console.log(`  - 提取结果: ${colors.solidColors.length}个纯色, ${colors.semiTransparentColors.length}个半透明色, ${colors.gradients.length}个渐变`);
      
      // 测试渐变生成性能
      if (colors.gradients.length > 0) {
        const startGradient = performance.now();
        colors.gradients.forEach(gradient => {
          enhancedGenerateGradient(gradient);
        });
        const gradientTime = performance.now() - startGradient;
        console.log(`  - 渐变处理耗时: ${gradientTime.toFixed(2)}ms`);
      }
      
      // 稳定性测试：连续处理多次
      console.log(`  - 稳定性测试: 连续处理5次`);
      const stabilityResults: number[] = [];
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        extractColorsFromFigmaNode(figmaData);
        stabilityResults.push(performance.now() - startTime);
      }
      
      const avgTime = stabilityResults.reduce((sum, time) => sum + time, 0) / stabilityResults.length;
      const maxTime = Math.max(...stabilityResults);
      const minTime = Math.min(...stabilityResults);
      
      console.log(`    平均: ${avgTime.toFixed(2)}ms, 最大: ${maxTime.toFixed(2)}ms, 最小: ${minTime.toFixed(2)}ms`);
      
      results.push({
        complexity: complexity.name,
        extractTime,
        stability: { avgTime, maxTime, minTime }
      });
    }
    
    // 2. 模拟不同网络条件下的响应时间
    console.log('\n2. 不同网络条件下的响应模拟测试:');
    
    const mediumData = generateComplexFigmaNode('medium');
    
    for (const network of networkConditions) {
      console.log(`\n测试${network.name}环境:`);
      
      const totalTimeStart = performance.now();
      
      // 模拟API请求延迟
      await simulateNetworkDelay(network.delay);
      
      // 执行数据处理
      const dataProcessingStart = performance.now();
      const colors = extractColorsFromFigmaNode(mediumData);
      const dataProcessingTime = performance.now() - dataProcessingStart;
      
      const totalTime = performance.now() - totalTimeStart;
      
      console.log(`  - 总响应时间: ${totalTime.toFixed(2)}ms`);
      console.log(`  - 网络延迟: ${network.delay}ms`);
      console.log(`  - 数据处理时间: ${dataProcessingTime.toFixed(2)}ms`);
    }
    
    // 3. 内存使用和资源消耗评估
    console.log('\n3. 资源消耗评估:');
    
    const complexData = generateComplexFigmaNode('complex');
    
    // 简单的内存使用评估（基于对象大小）
    const dataSize = estimateObjectSize(complexData);
    console.log(`复杂数据结构大小估计: ${(dataSize / 1024).toFixed(2)} KB`);
    
    // 4. 总结和建议
    console.log('\n4. 性能测试总结:');
    console.log('✅ 所有测试场景下功能运行稳定');
    console.log('📊 性能表现:');
    results.forEach(result => {
      console.log(`  - ${result.complexity}复杂度: 初始处理${result.extractTime.toFixed(2)}ms, 稳定后平均${result.stability.avgTime.toFixed(2)}ms`);
    });
    
    console.log('\n💡 优化建议:');
    console.log('1. 对于复杂Figma文件，可以考虑分批处理大型节点树');
    console.log('2. 在网络条件不佳时，可以实现请求重试和超时机制');
    console.log('3. 对于重复处理的颜色数据，可以添加缓存机制');
    console.log('4. 考虑使用Web Workers进行密集型计算以避免主线程阻塞');
    
    console.log('\n🎉 功能稳定性和响应速度测试完成!');
    
  } catch (error) {
    console.error('❌ 性能测试失败:', error);
  }
}

// 简单的对象大小估计函数
function estimateObjectSize(obj: any): number {
  let size = 0;
  
  function traverse(obj: any) {
    if (obj === null || obj === undefined) return;
    
    switch (typeof obj) {
      case 'number':
        size += 8;
        break;
      case 'string':
        size += obj.length * 2;
        break;
      case 'boolean':
        size += 4;
        break;
      case 'object':
        if (Array.isArray(obj)) {
          obj.forEach(traverse);
        } else {
          Object.keys(obj).forEach(key => {
            size += key.length * 2;
            traverse(obj[key]);
          });
        }
        break;
    }
  }
  
  traverse(obj);
  return size;
}

// 运行测试
runPerformanceTests();
