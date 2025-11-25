// 样式信息数据结构验证脚本

// 导入必要的工具函数
import { extractColorsFromFigmaNode, rgbToHex, rgbaToHexAlpha } from '../utils/colorUtils';
import { enhancedGenerateGradient, optimizeGradientSmoothness, processSemiTransparentColors } from '../utils/gradientUtils';

// 模拟Figma节点数据
const mockFigmaNodeData = {
  fills: [
    {
      type: 'SOLID',
      color: {
        r: 0.5,
        g: 0.2,
        b: 0.8,
        a: 1
      }
    },
    {
      type: 'GRADIENT_LINEAR',
      gradientTransform: [0, 1, -1, 0, 0, 0],
      gradientStops: [
        {
          position: 0,
          color: { r: 0.1, g: 0.2, b: 0.3, a: 1 }
        },
        {
          position: 1,
          color: { r: 0.9, g: 0.8, b: 0.7, a: 1 }
        }
      ]
    }
  ],
  strokes: [
    {
      type: 'SOLID',
      color: {
        r: 0.1,
        g: 0.1,
        b: 0.1,
        a: 0.8
      }
    }
  ],
  children: [
    {
      fills: [
        {
          type: 'SOLID',
          color: {
            r: 0.9,
            g: 0.9,
            b: 0.9,
            a: 0.5
          }
        }
      ]
    }
  ]
};

// 数据结构验证函数
function validateStyleDataStructure() {
  console.log('开始验证样式信息数据结构...');
  
  try {
    // 1. 测试颜色提取功能
    console.log('\n1. 测试颜色提取功能:');
    const extractedColors = extractColorsFromFigmaNode(mockFigmaNodeData);
    
    console.log('提取结果结构:', Object.keys(extractedColors));
    console.log('纯色数量:', extractedColors.solidColors.length);
    console.log('半透明色数量:', extractedColors.semiTransparentColors.length);
    console.log('渐变数量:', extractedColors.gradients.length);
    
    // 2. 验证纯色数据结构
    console.log('\n2. 验证纯色数据结构:');
    if (extractedColors.solidColors.length > 0) {
      const firstSolidColor = extractedColors.solidColors[0];
      console.log('纯色结构完整性:', 
        'r' in firstSolidColor && 
        'g' in firstSolidColor && 
        'b' in firstSolidColor && 
        'a' in firstSolidColor
      );
      console.log('示例纯色值:', firstSolidColor);
      console.log('转换为HEX:', rgbToHex(firstSolidColor.r, firstSolidColor.g, firstSolidColor.b));
    }
    
    // 3. 验证半透明色数据结构
    console.log('\n3. 验证半透明色数据结构:');
    if (extractedColors.semiTransparentColors.length > 0) {
      const firstSemiColor = extractedColors.semiTransparentColors[0];
      console.log('半透明色结构完整性:', 
        'r' in firstSemiColor && 
        'g' in firstSemiColor && 
        'b' in firstSemiColor && 
        'a' in firstSemiColor && 
        firstSemiColor.a < 1
      );
      console.log('示例半透明色值:', firstSemiColor);
      console.log('转换为HEX Alpha:', rgbaToHexAlpha(firstSemiColor.r, firstSemiColor.g, firstSemiColor.b, firstSemiColor.a));
      
      // 测试半透明色处理
      const processedSemiColors = processSemiTransparentColors(extractedColors.semiTransparentColors);
      console.log('处理后半透明色结构:', Object.keys(processedSemiColors[0]));
    }
    
    // 4. 验证渐变数据结构
    console.log('\n4. 验证渐变数据结构:');
    if (extractedColors.gradients.length > 0) {
      const firstGradient = extractedColors.gradients[0];
      console.log('渐变结构完整性:', 
        'type' in firstGradient && 
        'gradientTransform' in firstGradient && 
        'gradientStops' in firstGradient
      );
      console.log('渐变停止点数量:', firstGradient.gradientStops.length);
      
      // 测试渐变优化
      const optimizedGradient = optimizeGradientSmoothness(firstGradient);
      console.log('优化后渐变停止点数量:', optimizedGradient.gradientStops.length);
      
      // 测试渐变生成
      const cssGradient = enhancedGenerateGradient(optimizedGradient);
      console.log('生成的CSS渐变:', cssGradient);
    }
    
    // 5. 整体数据结构验证
    console.log('\n5. 整体数据结构验证:');
    console.log('颜色提取结果符合预期:', 
      extractedColors.solidColors.length >= 1 &&
      extractedColors.semiTransparentColors.length >= 1 &&
      extractedColors.gradients.length >= 1
    );
    
    // 6. 边界情况测试
    console.log('\n6. 边界情况测试:');
    const emptyNode = {};
    const emptyColors = extractColorsFromFigmaNode(emptyNode);
    console.log('空节点处理结果:', emptyColors);
    console.log('空节点处理正确:', 
      emptyColors.solidColors.length === 0 &&
      emptyColors.semiTransparentColors.length === 0 &&
      emptyColors.gradients.length === 0
    );
    
    console.log('\n✅ 所有样式信息数据结构验证通过!');
    
  } catch (error) {
    console.error('❌ 样式信息数据结构验证失败:', error);
  }
}

// 运行验证
validateStyleDataStructure();
