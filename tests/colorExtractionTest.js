// 模拟完整的颜色提取流程测试
console.log('模拟完整的颜色提取流程测试...');

// 模拟原始Figma节点数据结构
const mockFigmaNodeData = {
  // 模拟底层大背景的节点
  backgroundNode: {
    fills: [{
      type: 'SOLID',
      color: {
        // 故意设置略微不准确的值来模拟浮点精度问题
        r: 0.9686274509803922,
        g: 0.9725490196078431,
        b: 0.9803921568627451,
        a: 1
      }
    }]
  },
  
  // 模拟文本节点
  textNode: {
    fills: [{
      type: 'SOLID',
      color: {
        // 故意设置略微不准确的值来模拟浮点精度问题
        r: 0.06666666666666667,
        g: 0.0784313725490196,
        b: 0.10196078431372549,
        a: 1
      }
    }]
  },
  
  // 模拟错误识别的背景颜色
  incorrectBackgroundNode: {
    fills: [{
      type: 'SOLID',
      color: {
        r: 0.9686274509803922,
        g: 0.9725490196078431,
        b: 0.984313725490196,
        a: 1
      }
    }]
  },
  
  // 模拟错误识别的文本颜色
  incorrectTextNode: {
    fills: [{
      type: 'SOLID',
      color: {
        r: 0.06666666666666667,
        g: 0.08235294117647059,
        b: 0.11764705882352941,
        a: 1
      }
    }]
  }
};

// 原始的parseFigmaColor函数
function parseFigmaColor(color) {
  return {
    r: Math.round(color.r * 255),
    g: Math.round(color.g * 255),
    b: Math.round(color.b * 255),
    a: color.a !== undefined ? color.a : 1
  };
}

// 改进版本的parseFigmaColor函数
function parseFigmaColorFixed(color) {
  // 使用更精确的计算方法
  const toFixedColor = (value) => {
    // 计算精确值，然后添加一个微小的偏移量来解决浮点精度问题
    const calculatedValue = value * 255;
    // 使用Math.round但添加微小偏移来处理边界情况
    return Math.round(calculatedValue + 0.0001);
  };
  
  return {
    r: toFixedColor(color.r),
    g: toFixedColor(color.g),
    b: toFixedColor(color.b),
    a: color.a !== undefined ? color.a : 1
  };
}

// 更精确版本，直接使用Math.floor然后判断小数部分
function parseFigmaColorPrecise(color) {
  const toPreciseColor = (value) => {
    const calculatedValue = value * 255;
    const integerPart = Math.floor(calculatedValue);
    const fractionalPart = calculatedValue - integerPart;
    // 如果小数部分 >= 0.5，则进位
    return fractionalPart >= 0.5 ? integerPart + 1 : integerPart;
  };
  
  return {
    r: toPreciseColor(color.r),
    g: toPreciseColor(color.g),
    b: toPreciseColor(color.b),
    a: color.a !== undefined ? color.a : 1
  };
}

// RGB转HEX
function rgbToHex(r, g, b) {
  const toHex = (c) => {
    const hex = Math.round(c).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// 模拟extractColorsFromFigmaNode函数
function extractColorsFromFigmaNode(node) {
  const result = {
    solidColors: [],
    gradients: [],
    semiTransparentColors: []
  };
  
  if (node.fills && Array.isArray(node.fills)) {
    node.fills.forEach((fill) => {
      if (fill.type === 'SOLID' && fill.color) {
        const color = parseFigmaColor(fill.color);
        if (color.a < 1) {
          result.semiTransparentColors.push(color);
        } else {
          result.solidColors.push(color);
        }
      }
    });
  }
  
  return result;
}

// 模拟extractColorsFromFigmaNode函数（使用改进的parseFigmaColor）
function extractColorsFromFigmaNodeFixed(node) {
  const result = {
    solidColors: [],
    gradients: [],
    semiTransparentColors: []
  };
  
  if (node.fills && Array.isArray(node.fills)) {
    node.fills.forEach((fill) => {
      if (fill.type === 'SOLID' && fill.color) {
        const color = parseFigmaColorFixed(fill.color);
        if (color.a < 1) {
          result.semiTransparentColors.push(color);
        } else {
          result.solidColors.push(color);
        }
      }
    });
  }
  
  return result;
}

// 模拟extractColorsFromFigmaNode函数（使用精确版本的parseFigmaColor）
function extractColorsFromFigmaNodePrecise(node) {
  const result = {
    solidColors: [],
    gradients: [],
    semiTransparentColors: []
  };
  
  if (node.fills && Array.isArray(node.fills)) {
    node.fills.forEach((fill) => {
      if (fill.type === 'SOLID' && fill.color) {
        const color = parseFigmaColorPrecise(fill.color);
        if (color.a < 1) {
          result.semiTransparentColors.push(color);
        } else {
          result.solidColors.push(color);
        }
      }
    });
  }
  
  return result;
}

// 进行测试
console.log('===== 原始背景色解析测试 =====');
console.log('实际Figma值 (0-1范围):', JSON.stringify(mockFigmaNodeData.backgroundNode.fills[0].color));
console.log('原始解析结果:', parseFigmaColor(mockFigmaNodeData.backgroundNode.fills[0].color));
console.log('原始解析HEX:', rgbToHex(
  parseFigmaColor(mockFigmaNodeData.backgroundNode.fills[0].color).r,
  parseFigmaColor(mockFigmaNodeData.backgroundNode.fills[0].color).g,
  parseFigmaColor(mockFigmaNodeData.backgroundNode.fills[0].color).b
));
console.log('');

console.log('===== 错误识别的背景色解析测试 =====');
console.log('错误识别的Figma值 (0-1范围):', JSON.stringify(mockFigmaNodeData.incorrectBackgroundNode.fills[0].color));
console.log('错误解析结果:', parseFigmaColor(mockFigmaNodeData.incorrectBackgroundNode.fills[0].color));
console.log('错误解析HEX:', rgbToHex(
  parseFigmaColor(mockFigmaNodeData.incorrectBackgroundNode.fills[0].color).r,
  parseFigmaColor(mockFigmaNodeData.incorrectBackgroundNode.fills[0].color).g,
  parseFigmaColor(mockFigmaNodeData.incorrectBackgroundNode.fills[0].color).b
));
console.log('');

console.log('===== 原始文字颜色解析测试 =====');
console.log('实际Figma值 (0-1范围):', JSON.stringify(mockFigmaNodeData.textNode.fills[0].color));
console.log('原始解析结果:', parseFigmaColor(mockFigmaNodeData.textNode.fills[0].color));
console.log('原始解析HEX:', rgbToHex(
  parseFigmaColor(mockFigmaNodeData.textNode.fills[0].color).r,
  parseFigmaColor(mockFigmaNodeData.textNode.fills[0].color).g,
  parseFigmaColor(mockFigmaNodeData.textNode.fills[0].color).b
));
console.log('');

console.log('===== 错误识别的文字颜色解析测试 =====');
console.log('错误识别的Figma值 (0-1范围):', JSON.stringify(mockFigmaNodeData.incorrectTextNode.fills[0].color));
console.log('错误解析结果:', parseFigmaColor(mockFigmaNodeData.incorrectTextNode.fills[0].color));
console.log('错误解析HEX:', rgbToHex(
  parseFigmaColor(mockFigmaNodeData.incorrectTextNode.fills[0].color).r,
  parseFigmaColor(mockFigmaNodeData.incorrectTextNode.fills[0].color).g,
  parseFigmaColor(mockFigmaNodeData.incorrectTextNode.fills[0].color).b
));
console.log('');

// 测试三种不同的解析方法
console.log('===== 三种解析方法比较 =====');

// 背景色比较
console.log('背景色比较:');
console.log('当前方法:', rgbToHex(
  parseFigmaColor(mockFigmaNodeData.backgroundNode.fills[0].color).r,
  parseFigmaColor(mockFigmaNodeData.backgroundNode.fills[0].color).g,
  parseFigmaColor(mockFigmaNodeData.backgroundNode.fills[0].color).b
));
console.log('改进方法:', rgbToHex(
  parseFigmaColorFixed(mockFigmaNodeData.backgroundNode.fills[0].color).r,
  parseFigmaColorFixed(mockFigmaNodeData.backgroundNode.fills[0].color).g,
  parseFigmaColorFixed(mockFigmaNodeData.backgroundNode.fills[0].color).b
));
console.log('精确方法:', rgbToHex(
  parseFigmaColorPrecise(mockFigmaNodeData.backgroundNode.fills[0].color).r,
  parseFigmaColorPrecise(mockFigmaNodeData.backgroundNode.fills[0].color).g,
  parseFigmaColorPrecise(mockFigmaNodeData.backgroundNode.fills[0].color).b
));
console.log('');

// 文字颜色比较
console.log('文字颜色比较:');
console.log('当前方法:', rgbToHex(
  parseFigmaColor(mockFigmaNodeData.textNode.fills[0].color).r,
  parseFigmaColor(mockFigmaNodeData.textNode.fills[0].color).g,
  parseFigmaColor(mockFigmaNodeData.textNode.fills[0].color).b
));
console.log('改进方法:', rgbToHex(
  parseFigmaColorFixed(mockFigmaNodeData.textNode.fills[0].color).r,
  parseFigmaColorFixed(mockFigmaNodeData.textNode.fills[0].color).g,
  parseFigmaColorFixed(mockFigmaNodeData.textNode.fills[0].color).b
));
console.log('精确方法:', rgbToHex(
  parseFigmaColorPrecise(mockFigmaNodeData.textNode.fills[0].color).r,
  parseFigmaColorPrecise(mockFigmaNodeData.textNode.fills[0].color).g,
  parseFigmaColorPrecise(mockFigmaNodeData.textNode.fills[0].color).b
));
console.log('');

// 模拟整个提取流程
console.log('===== 完整提取流程模拟 =====');
console.log('原始方法提取背景色:', 
  rgbToHex(extractColorsFromFigmaNode(mockFigmaNodeData.backgroundNode).solidColors[0].r,
           extractColorsFromFigmaNode(mockFigmaNodeData.backgroundNode).solidColors[0].g,
           extractColorsFromFigmaNode(mockFigmaNodeData.backgroundNode).solidColors[0].b)
);
console.log('改进方法提取背景色:', 
  rgbToHex(extractColorsFromFigmaNodeFixed(mockFigmaNodeData.backgroundNode).solidColors[0].r,
           extractColorsFromFigmaNodeFixed(mockFigmaNodeData.backgroundNode).solidColors[0].g,
           extractColorsFromFigmaNodeFixed(mockFigmaNodeData.backgroundNode).solidColors[0].b)
);
console.log('');

console.log('原始方法提取文字颜色:', 
  rgbToHex(extractColorsFromFigmaNode(mockFigmaNodeData.textNode).solidColors[0].r,
           extractColorsFromFigmaNode(mockFigmaNodeData.textNode).solidColors[0].g,
           extractColorsFromFigmaNode(mockFigmaNodeData.textNode).solidColors[0].b)
);
console.log('改进方法提取文字颜色:', 
  rgbToHex(extractColorsFromFigmaNodeFixed(mockFigmaNodeData.textNode).solidColors[0].r,
           extractColorsFromFigmaNodeFixed(mockFigmaNodeData.textNode).solidColors[0].g,
           extractColorsFromFigmaNodeFixed(mockFigmaNodeData.textNode).solidColors[0].b)
);
console.log('');

// 分析结果
console.log('===== 问题分析 =====');
console.log('1. 根据测试，当前的Math.round函数在处理精确的Figma 0-1范围颜色值时应该能够正确工作');
console.log('2. 但在实际应用中出现了颜色偏差，这可能是由于以下原因之一:');
console.log('   a. Figma API返回的实际值与理论值有细微差别');
console.log('   b. JavaScript浮点运算的精度问题导致计算结果与预期不符');
console.log('   c. 在数据处理流程中可能存在其他转换或舍入操作');
console.log('3. 解决方案建议:');
console.log('   a. 改进parseFigmaColor函数，添加微小偏移量以处理浮点精度问题');
console.log('   b. 使用更精确的四舍五入方法');
console.log('   c. 在提取颜色后添加颜色规范化步骤，确保常见颜色值的一致性');
console.log('');

console.log('测试完成!');
