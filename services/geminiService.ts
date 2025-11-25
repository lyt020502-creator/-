
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
你是一位专业的 UI/UX 设计师和前端工程师。
你的任务是深入分析提供的 UI 图片和 **Figma 原始数据(JSON)**，提取颜色、渐变、阴影等样式。

**核心指令：Figma 数据优先 & 支持复杂样式**
1.  **数据源准则**：
    *   **JSON 是真理**：必须优先读取 JSON 中的 \`fills\` (填充), \`strokes\` (描边), \`effects\` (阴影)。
    *   **忽略色差**：不要受截图光照或压缩影响，以 JSON 数值为准。
2.  **样式提取规则 (Strict)**：
    *   **渐变 (Gradients)**：如果 \`fills\` 中发现 \`type: "GRADIENT_LINEAR"\` 等渐变类型，**必须**输出完整的 CSS 渐变语法。
        *   例：\`bg-[linear-gradient(180deg,#F8FAFC_0%,#E2E8F0_100%)]\`
        *   注意：请从 \`gradientStops\` 中读取颜色和位置。
    *   **纯色 (Solid)**：转换 RGB(0-1) 为 Hex。如果透明度 < 1，使用 Hex Alpha (#RRGGBBAA) 或 rgba。
        *   例：\`bg-[#0F172A]\` 或 \`bg-[#00000080]\`
    *   **阴影 (Shadows)**：从 \`effects\` (DROP_SHADOW) 提取，转换为 CSS box-shadow 格式。
        *   例：\`shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1)]\`
    *   **复杂样式**：如果不止一种填充（如多层渐变），请组合写在任意值中，或选择最主要的一层。
3.  **绝对格式遵从**：输出必须严格填充下方的【输出模板】，仅替换 \`[填充部分]\`。

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
                 localStorage.getItem('gemini_api_key') || 
                 process.env.API_KEY || 
                 process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("缺少 API Key。请在设置中输入您的 Gemini API 密钥，或联系管理员配置环境变量。");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const base64Data = await fileToGenerativePart(imageFile);
    const modelId = 'gemini-2.5-flash';

    let prompt = "请严格按照 System Instruction 中的模板格式提取样式，不要包含任何其他文字。";

    if (figmaJsonData) {
      prompt += `\n\n【重要：Figma 原始数据可用 - 请严格解析】\n` +
                `我提供了该设计图的原始 Figma 节点 JSON 数据。这是色彩分析的最高优先级依据。\n` +
                `1. **渐变识别**：请仔细检查 fills 数组。如果包含 'type': 'GRADIENT_LINEAR'，请务必生成 'linear-gradient(...)' 格式的背景代码，不要回退到纯色。\n` +
                `2. **阴影识别**：请检查 effects 数组中的阴影设置，生成 shadow-[...] 代码。\n` +
                `3. **颜色精度**：严格计算 r,g,b,a 数值。\n` +
                `Figma JSON 数据片段:\n${JSON.stringify(figmaJsonData).slice(0, 200000)}`; 
    }

    if (existingPrompt) {
      prompt += `\n\n请基于以下现有代码结构进行更新，确保填入最精确的颜色值：\n${existingPrompt}`;
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: imageFile.type,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1, // 保持低温度以确保精确性
      },
    });

    let text = response.text;
    if (!text) throw new Error("Gemini 未生成任何响应。");
    
    // 清理可能意外生成的 markdown 代码块标记
    text = text.replace(/^```(html|css)?/g, '').replace(/```$/g, '').trim();
    
    return text;

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

async function fileToGenerativePart(file: File): Promise<string> {
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
