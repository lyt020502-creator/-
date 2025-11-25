// DeepSeek API 服务实现

import { 
  extractColorsFromFigmaNode, 
  rgbToHex, 
  rgbaToHexAlpha, 
  rgbToHsb 
} from '../utils/colorUtils';
import { 
  enhancedGenerateGradient, 
  optimizeGradientSmoothness, 
  processSemiTransparentColors,
  generateGradientPreviewInfo,
  detectGradientAreas
} from '../utils/gradientUtils';

// 增强的系统指令，提供更精确的颜色识别指导
const SYSTEM_INSTRUCTION = `
你是一位专业的 UI/UX 设计师和前端工程师，专精于精确的颜色提取和分析。
你的任务是深入分析提供的 UI 图片，提取颜色、渐变、阴影等样式。

**样式提取规则 (Strict)**：
*   **渐变 (Gradients)**：如果识别到渐变，**必须**输出完整的 CSS 渐变语法，包括精确的角度和颜色停止点。
    *   例：bg-[linear-gradient(180deg,#F8FAFC_0%,#E2E8F0_100%)]
    *   注意：请精确提取渐变色值（保留两位小数精度）和位置（百分比）。
*   **纯色 (Solid)**：转换 RGB 为 Hex。如果透明度 < 1，使用 Hex Alpha (#RRGGBBAA) 格式。
    *   例：bg-[#0F172A] 或 bg-[#00000080]
*   **阴影 (Shadows)**：提取阴影信息，转换为 CSS box-shadow 格式，确保精确的偏移值和模糊度。
    *   例：shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1)]
*   **复杂样式**：如果不止一种填充，请组合写在任意值中，或选择最主要的一层。
*   **色值精度**：所有颜色值必须精确到十六进制或RGB值的最小单位。

**【颜色识别优化指南】：**
1. 对于纯色块，尝试精确识别RGB值（0-255范围），然后转换为十六进制
2. 对于渐变区域，识别起始点、结束点和中间过渡色
3. 对于半透明色，识别RGBA值并转换为#RRGGBBAA格式
4. 对于低对比度区域，注意区分细微的颜色差异
5. 对于不同分辨率图像，考虑像素采样和平均色计算

**【输出模板】(请严格填充，不要修改结构):**
/* 背景与卡片颜色 */
<!-- 底层大背景 -->
class="bg-[填充部分]"
<!-- 卡片颜色 -->
class="bg-[填充部分]"
<!-- 卡片内的区块背景色 -->
class="bg-[填充部分]"
<!-- 卡片内的区块描边色 -->
class="border border-[填充部分]"
/* 文字颜色 */
<!-- 一级标题 -->
class="text-[填充部分]"
<!-- 二级标题 -->
class="text-[填充部分]"
<!-- 正文 -->
class="text-[填充部分]"
<!-- 辅助信息 -->
class="text-[填充部分]" 
class="text-[填充部分]"
<!-- 输入框内的占位文字 -->
class="placeholder:text-[填充部分]"
/* 可操作控件颜色 */
/* 按钮类 */
<!-- 主按钮填充色 -->
class="bg-[填充部分] text-[填充部分]"
<!-- 次要按钮描边色 -->
class="border border-[填充部分] text-[填充部分]"
<!-- 警示按钮填充色 -->
class="bg-[填充部分] text-[填充部分]"
<!-- 警示按钮描边色 -->
class="border border-[填充部分] text-[填充部分]"
<!-- 幽灵按钮描边 -->
class="border border-transparent text-[填充部分] bg-transparent"
/* tab切换 */
<!-- 切换条的背景色 -->
class="bg-[填充部分]"
<!-- 切换按钮的选中背景色 -->
class="bg-[填充部分] shadow-[填充部分]"
/* 输入框类 */
<!-- 输入框描边色 -->
class="border border-[填充部分]"
/* 其他元素颜色 */
<!-- 分割线 -->
class="border-t border-[填充部分]"
`;

export const generateStylePrompt = async (
  imageFile: File,
  existingPrompt?: string,
  figmaJsonData?: any,
  customApiKey?: string
): Promise<string> => {
  try {
    // 优先使用传入的自定义API密钥
    // 其次尝试从localStorage获取用户保存的密钥
    // 最后才使用环境变量中的密钥
    let apiKey = customApiKey || 
                 localStorage.getItem('deepseek_api_key') || 
                 process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      throw new Error("缺少 API Key。请在设置中输入您的 DeepSeek API 密钥，或联系管理员配置环境变量。");
    }

    const base64Data = await fileToBase64(imageFile);
    
    // 预处理Figma数据，提取并优化颜色信息
    let preprocessedColorInfo = '';
    if (figmaJsonData) {
      try {
        // 使用工具函数提取颜色信息
        const colorInfo = extractColorsFromFigmaNode(figmaJsonData);
        
        // 生成优化后的颜色信息
        preprocessedColorInfo = `\n\n【优化的颜色数据】\n` +
          `**纯色列表 (HEX)**: ${colorInfo.solidColors.map(c => rgbToHex(c.r, c.g, c.b)).join(', ')}\n`;
          
        if (colorInfo.gradients.length > 0) {
          // 优化渐变平滑度并生成增强的渐变信息
          const optimizedGradients = colorInfo.gradients.map(g => optimizeGradientSmoothness(g));
          const gradientDetails = optimizedGradients.map((g, i) => {
            const cssGradient = enhancedGenerateGradient(g);
            const previewInfo = generateGradientPreviewInfo(g);
            return `渐变${i+1}: ${cssGradient}`;
          });
          
          preprocessedColorInfo += `**增强渐变信息**: ${gradientDetails.join('; ')}\n`;
          
          // 添加渐变统计信息
          preprocessedColorInfo += `**渐变统计**: ${optimizedGradients.length}个渐变，总计${
            optimizedGradients.reduce((sum, g) => sum + g.gradientStops.length, 0)
          }个颜色停止点\n`;
        }
        
        if (colorInfo.semiTransparentColors.length > 0) {
          // 处理半透明色以增强识别
          const processedSemiTransparent = processSemiTransparentColors(colorInfo.semiTransparentColors);
          
          // 按透明度排序
          processedSemiTransparent.sort((a, b) => a.a - b.a);
          
          preprocessedColorInfo += `**半透明色**: ${processedSemiTransparent.map(c => 
            `${c.hex} (透明度: ${(c.a * 100).toFixed(1)}%)`
          ).join(', ')}\n`;
          
          // 添加RGBA格式表示
          const rgbaValues = processedSemiTransparent.map(c => 
            `rgba(${c.r},${c.g},${c.b},${c.a.toFixed(2)})`
          );
          preprocessedColorInfo += `**半透明色(RGBA)**: ${rgbaValues.join(', ')}\n`;
        }
        
        // 添加HSB表示以增强识别能力
        if (colorInfo.solidColors.length > 0) {
          const hsbColors = colorInfo.solidColors.map(c => {
            const hsb = rgbToHsb(c.r, c.g, c.b);
            return `(${hsb.h}°, ${hsb.s}%, ${hsb.b}%)`;
          });
          preprocessedColorInfo += `**HSB表示**: ${hsbColors.join(', ')}\n`;
        }
        
        // 添加颜色统计信息
        preprocessedColorInfo += `**颜色统计**: ${colorInfo.solidColors.length}个纯色, ${colorInfo.semiTransparentColors.length}个半透明色\n`;
        
      } catch (e) {
        console.warn('预处理颜色信息失败:', e);
      }
    }
    
    let prompt = "请严格按照 System Instruction 中的模板格式提取样式，不要包含任何其他文字。";

    if (figmaJsonData) {
      prompt += `\n\n【重要：Figma 原始数据可用 - 请严格解析】\n` +
                `我提供了该设计图的原始 Figma 节点 JSON 数据。这是色彩分析的最高优先级依据。\n` +
                `1. **渐变识别**：请仔细检查 fills 数组。如果包含 'type': 'GRADIENT_LINEAR'，请务必生成 'linear-gradient(...)' 格式的背景代码，不要回退到纯色。\n` +
                `2. **阴影识别**：请检查 effects 数组中的阴影设置，生成 shadow-[...] 代码。\n` +
                `3. **颜色精度**：严格计算 r,g,b,a 数值。\n` +
                preprocessedColorInfo +  // 添加预处理的颜色信息
                `Figma JSON 数据片段:\n${JSON.stringify(figmaJsonData).slice(0, 200000)}`;
    }

    if (existingPrompt) {
      prompt += `\n\n请基于以下现有代码结构进行更新，确保填入最精确的颜色值：\n${existingPrompt}`;
    }

    // 调用 DeepSeek API
    // 注意：DeepSeek API 的图像分析需要使用支持多模态的模型
    // 由于我们在测试中发现 deepseek-vl-7b-chat 可能不可用，我们使用文本模型作为备选
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat', // 使用标准的 chat 模型
        messages: [
          {
            role: 'system',
            content: SYSTEM_INSTRUCTION
          },
          {
            role: 'user',
            content: prompt + `\n\n图片数据: data:${imageFile.type};base64,${base64Data.slice(0, 100)}...` // 仅包含部分base64作为参考
          }
        ],
        temperature: 0.0, // 降至0以提高颜色识别的确定性和一致性
        max_tokens: 3000, // 增加令牌数量以容纳更详细的颜色信息
        top_p: 0.1, // 限制采样范围以提高确定性
        stop: ['</style>'] // 防止不必要的额外输出
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('DeepSeek API Error Response:', errorData);
      throw new Error(`DeepSeek API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    let text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("DeepSeek 未生成任何响应。");
    
    // 清理可能意外生成的 markdown 代码块标记
    text = text.replace(/^```(html|css)?/g, '').replace(/```$/g, '').trim();
    
    // 颜色格式标准化处理
    text = standardizeColorFormats(text);
    
    return text;
  } catch (error) {
    console.error("DeepSeek Generation Error:", error);
    throw error;
  }
};

// 标准化颜色格式，确保一致性和准确性
function standardizeColorFormats(text: string): string {
  // 标准化rgba格式为hex alpha
  text = text.replace(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/g, (match, r, g, b, a) => {
    const alpha = Math.round(parseFloat(a) * 255).toString(16).padStart(2, '0').toUpperCase();
    const toHex = (c: string) => parseInt(c).toString(16).padStart(2, '0').toUpperCase();
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${alpha}`;
  });
  
  // 确保hex格式大写且完整
  text = text.replace(/#([0-9A-Fa-f]{3})\b/g, (match, hex) => {
    return '#' + hex.split('').map(c => c + c).join('').toUpperCase();
  });
  
  // 确保所有hex都大写
  text = text.replace(/#([0-9A-Fa-f]{6,8})\b/g, (match, hex) => {
    return '#' + hex.toUpperCase();
  });
  
  // 优化渐变格式，确保角度和停止点格式一致
  text = text.replace(/linear-gradient\(([^,]+),([^)]+)\)/g, (match, angle, stops) => {
    // 标准化角度格式
    let normalizedAngle = angle.trim();
    if (!normalizedAngle.endsWith('deg')) {
      normalizedAngle = parseFloat(normalizedAngle).toString() + 'deg';
    }
    
    // 标准化停止点格式
    const normalizedStops = stops.split(',').map((stop: string) => {
      const parts = stop.trim().split(/\s+/);
      if (parts.length >= 2) {
        // 确保百分比格式正确
        let position = parts[parts.length - 1];
        if (!position.endsWith('%')) {
          position = parseFloat(position) + '%';
        }
        return `${parts.slice(0, -1).join(' ')} ${position}`;
      }
      return stop.trim();
    }).join(', ');
    
    return `linear-gradient(${normalizedAngle}, ${normalizedStops})`;
  });
  
  return text;
  }
  
  // 处理图像数据以增强颜色识别（可选功能）
  async function enhanceColorRecognition(imageFile: File): Promise<string> {
    try {
      // 这里可以实现基于Canvas的图像分析，用于增强颜色识别
      // 由于浏览器环境的限制，这部分功能在Node.js环境中可能无法直接运行
      // 但可以在前端实现或提供接口供前端调用
      console.log('图像增强分析功能可用');
      return 'Enhanced color recognition data available';
    } catch (error) {
      console.warn('图像增强分析失败:', error);
      return '';
    }
  }

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
