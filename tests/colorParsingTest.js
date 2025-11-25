// 测试颜色解析精度问题
console.log('测试颜色解析精度问题...');

// 模拟Figma颜色格式的parseFigmaColor函数
function parseFigmaColor(color) {
  return {
    r: Math.round(color.r * 255),
    g: Math.round(color.g * 255),
    b: Math.round(color.b * 255),
    a: color.a !== undefined ? color.a : 1
  };
}

// 模拟四舍五入改进版本
function parseFigmaColorFixed(color) {
  // 对于接近整数边界的值，我们使用更精确的方法
  const toFixedColor = (value) => {
    const rawValue = value * 255;
    // 添加一个微小的偏移量来解决浮点精度问题
    return Math.round(rawValue + 0.0001);
  };
  
  return {
    r: toFixedColor(color.r),
    g: toFixedColor(color.g),
    b: toFixedColor(color.b),
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

// 测试案例1: 底层大背景颜色 F7F8FA
// 假设Figma中的原始值 (需要找出对应的0-1范围值)
// #F7F8FA = RGB(247, 248, 250)
// 转换为0-1范围: r=247/255≈0.9686, g=248/255≈0.9725, b=250/255≈0.9804
// 但被错误识别为 #F7F8FB = RGB(247, 248, 251)
const bgColor = {
  r: 0.9686,
  g: 0.9725,
  b: 0.9804
};

// 测试案例2: 文字颜色 11141A
// #11141A = RGB(17, 20, 26)
// 转换为0-1范围: r=17/255≈0.0667, g=20/255≈0.0784, b=26/255≈0.1020
// 但被错误识别为 #11151E = RGB(17, 21, 30)
const textColor = {
  r: 0.0667,
  g: 0.0784,
  b: 0.1020
};

// 进行测试
console.log('===== 测试结果 =====');
console.log('');

// 测试背景色
console.log('底层大背景颜色测试:');
console.log('原始Figma值 (0-1范围):', JSON.stringify(bgColor));
console.log('当前解析结果:', parseFigmaColor(bgColor));
console.log('当前解析HEX:', rgbToHex(parseFigmaColor(bgColor).r, parseFigmaColor(bgColor).g, parseFigmaColor(bgColor).b));
console.log('改进解析结果:', parseFigmaColorFixed(bgColor));
console.log('改进解析HEX:', rgbToHex(parseFigmaColorFixed(bgColor).r, parseFigmaColorFixed(bgColor).g, parseFigmaColorFixed(bgColor).b));
console.log('');

// 测试文字颜色
console.log('文字颜色测试:');
console.log('原始Figma值 (0-1范围):', JSON.stringify(textColor));
console.log('当前解析结果:', parseFigmaColor(textColor));
console.log('当前解析HEX:', rgbToHex(parseFigmaColor(textColor).r, parseFigmaColor(textColor).g, parseFigmaColor(textColor).b));
console.log('改进解析结果:', parseFigmaColorFixed(textColor));
console.log('改进解析HEX:', rgbToHex(parseFigmaColorFixed(textColor).r, parseFigmaColorFixed(textColor).g, parseFigmaColorFixed(textColor).b));
console.log('');

// 测试更多可能的边界情况
console.log('===== 边界情况测试 =====');
const edgeCase = {
  r: 0.9999,
  g: 0.0001,
  b: 0.5
};
console.log('边界情况值:', JSON.stringify(edgeCase));
console.log('当前解析结果:', parseFigmaColor(edgeCase));
console.log('改进解析结果:', parseFigmaColorFixed(edgeCase));
console.log('');

// 分析问题根源
console.log('===== 问题分析 =====');
console.log('1. 问题可能是由于JavaScript中的浮点精度问题和Math.round的四舍五入行为导致的');
console.log('2. 在转换0-1范围的值到0-255范围时，由于浮点计算的不精确性，某些本应四舍五入到特定值的计算结果可能会有微小偏差');
console.log('3. 解决方案是在四舍五入前添加一个微小的偏移量(0.0001)，帮助解决浮点精度问题');
console.log('');

console.log('测试完成!');
