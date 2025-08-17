// AI服务模块 - 封装所有对外部AI API的调用
import { 
  createGuidedQAPrompt,
  INVENTION_SYSTEM_PROMPT,
  QUEST_SYSTEM_PROMPT,
  createInventionUserPrompt,
  createQuestUserPrompt
} from '../prompts.js';
import {
  getInventionTools,
  getQuestWithSuggestionsTools
} from '../tools.js';

// 使用代理路径而非直接调用外部API
const ALIYUN_API_ENDPOINT = '/api/dashscope/compatible-mode/v1/chat/completions';
// 在文件顶部统一定义
const API_KEY = import.meta.env.VITE_ALIYUN_API_KEY;

/**
 * 安全的会话完成检测函数
 * 防止注入攻击，使用多重验证机制
 * @param {string} response - AI的响应内容
 * @returns {boolean} 是否为会话完成标记
 */
function isConversationDone(response) {
  if (!response || typeof response !== 'string') return false;
  
  const trimmed = response.trim();
  
  // 1. 精确匹配：只包含##DONE##（忽略大小写和空白字符）
  if (/^\s*##DONE##\s*$/i.test(trimmed)) return true;
  
  // 2. 包含匹配：包含##DONE##但长度限制在50字符内（防止长文本注入）
  if (/##DONE##/i.test(trimmed) && trimmed.length <= 50) {
    // 额外验证：确保不包含可疑的脚本标签或特殊字符
    const suspiciousPatterns = [/<script/i, /javascript:/i, /on\w+=/i, /eval\(/i];
    return !suspiciousPatterns.some(pattern => pattern.test(trimmed));
  }
  
  return false;
}
/**
 * 使用Function Calling方式生成发明数据
 * @param {Object} playerInputs - 玩家输入的发明构想
 * @returns {Object} 发明数据对象
 */
export async function generateInvention(playerInputs) {
  if (!API_KEY || API_KEY === 'your_actual_api_key_here') {
    throw new Error('API密钥未配置，请在.env.local文件中设置VITE_ALIYUN_API_KEY');
  }

  try {
    const userPrompt = createInventionUserPrompt(playerInputs);
    const tools = getInventionTools();
    
    console.log('=== 使用Function Calling生成发明 ===');
    console.log('发送给AI的System Prompt:', INVENTION_SYSTEM_PROMPT);
    console.log('发送给AI的User Prompt:', userPrompt);
    console.log('可用工具:', tools);
    
    const requestBody = {
      model: 'qwen-plus',
      messages: [
        {
          role: 'system',
          content: INVENTION_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.8,
      max_tokens: 1500,
      top_p: 0.9,
      tools: tools,
      tool_choice: {
        "type": "function",
        "function": {
          "name": "saveInventionBlueprint"
        }
      },
      stream: false
    };
    
    console.log('完整请求体:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(ALIYUN_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API请求失败的原始响应:', errorText);
      throw new Error(`API请求失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('=== Function Calling响应 ===');
    console.log('AI原始响应:', JSON.stringify(data, null, 2));
    
    // 验证响应结构
    if (!data || typeof data !== 'object') {
      console.error('无效的响应数据:', data);
      throw new Error('API返回的响应数据格式无效');
    }
    
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error('响应中缺少choices数组:', data);
      throw new Error('API响应格式异常：缺少choices数组');
    }

    // 处理工具调用响应 - OpenAI兼容格式
    const choice = data?.choices?.[0];
    console.log('Choice结构:', JSON.stringify(choice, null, 2));
    
    if (choice?.message?.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      console.log('工具调用结构:', JSON.stringify(toolCall, null, 2));
      
      const functionName = toolCall.function?.name;
      console.log('函数名称:', functionName);
      
      // 安全解析 JSON 参数，添加错误处理
      let functionArgs;
      try {
        const argsString = toolCall.function.arguments;
        console.log('工具调用参数字符串:', argsString);
        
        if (!argsString || argsString.trim() === '') {
          console.error('工具调用参数为空');
          throw new Error('AI返回的工具调用参数为空');
        }
        
        functionArgs = JSON.parse(argsString);
      } catch (parseError) {
        console.error('JSON解析失败:', parseError);
        console.error('原始参数字符串:', toolCall.function.arguments);
        throw new Error(`AI返回的工具调用参数格式错误: ${parseError.message}`);
      }
      
      console.log('AI调用工具:', functionName, functionArgs);
      
      if (functionName === 'saveInventionBlueprint') {
        return functionArgs;
      }
    }
    
    // 如果没有工具调用，检查是否有普通文本响应
    if (choice?.message?.content) {
      console.log('AI返回普通文本响应:', choice.message.content);
      console.log('提示：AI可能没有理解工具调用要求，请检查提示词配置');
    }
    
    // 检查是否有API错误
    if (data?.error) {
      console.error('API返回错误:', data.error);
      throw new Error(`API错误: ${data.error.message || '未知错误'}`);
    }
    
    throw new Error('AI响应格式异常：未收到预期的工具调用，请检查模型配置和提示词');

  } catch (error) {
    console.error('生成发明失败:', error);
    throw error;
  }
}

/**
 * 生成图片（当前阶段返回占位图片）
 * @param {string} imagePrompt - 图片生成提示
 * @returns {Promise<string>} 图片URL
 */
export async function generateImage() {
  // 当前阶段返回固定的占位图片URL
  return 'https://via.placeholder.com/400x300/4a5568/ffffff?text=' + encodeURIComponent('发明图纸');
}

/**
 * 获取AI的下一个引导问题
 * 用于多轮会话中的启发式问答
 * @param {Array} messages - 当前会话历史数组
 * @returns {Promise<string>} AI的下一个问题或结束标志
 */
// 在getNextInventionQuestion函数中使用统一的端点
export async function getNextInventionQuestion(messages) {
  const apiKey = import.meta.env.VITE_ALIYUN_API_KEY;
  
  if (!apiKey || apiKey === 'your_actual_api_key_here') {
    console.error('API密钥未配置，请在.env.local文件中设置VITE_ALIYUN_API_KEY');
    return '请先配置API密钥';
  }

  try {
    // 优化：只保留最近的4轮对话（最多8条消息）以减少token使用
    const recentMessages = messages.length > 10 ? messages.slice(-10) : messages;
    console.log('发送多轮会话请求，最近消息历史:', recentMessages);
    
    const prompt = createGuidedQAPrompt(recentMessages);
    console.log('生成的引导提示词:', prompt);

    const response = await fetch(ALIYUN_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API请求失败的原始响应:', errorText);
      throw new Error(`API请求失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('AI多轮会话原始响应:', JSON.stringify(data, null, 2));

    // OpenAI兼容接口响应处理逻辑
    let aiResponse = null;
    
    // 标准OpenAI格式路径
    if (data?.choices?.[0]?.message?.content) {
      aiResponse = data.choices[0].message.content;
    }
    // 检查是否有错误信息
    else if (data?.error || data?.code || data?.message) {
      console.error('API返回错误:', {
        error: data.error,
        code: data.code,
        message: data.message,
        request_id: data.request_id
      });
      return '##DONE##';
    }
    
    if (aiResponse && typeof aiResponse === 'string') {
      const trimmedResponse = aiResponse.trim();
      // 使用安全的完成标记检测
      if (isConversationDone(trimmedResponse)) {
        console.log('检测到会话完成标记');
        return '##DONE##';
      }
      if (trimmedResponse) {
        console.log('AI引导问题:', trimmedResponse);
        return trimmedResponse;
      }
    }
    
    // 如果无法解析响应，输出调试信息
    console.error('无法解析AI响应，响应结构:', {
      hasChoices: !!data?.choices,
      choicesLength: data?.choices?.length || 0,
      fullResponse: data
    });
    
    return '##DONE##';

  } catch (error) {
    console.error('获取AI问题失败:', error);
    return '##DONE##';
  }
}



/**
 * 生成新的机遇任务 - 基于System Prompt + Tools
 * @param {string} chapter - 当前游戏章节
 * @returns {Promise<string>} 机遇任务描述
 */
/**
 * 生成新的机遇任务
 * @param {string} chapter - 当前游戏章节
 * @returns {string} 格式化的任务描述
 */
export async function getNewQuest(chapter, subStage, category) {
  if (!API_KEY || API_KEY === 'your_actual_api_key_here') {
    throw new Error('API密钥未配置，请在.env.local文件中设置VITE_ALIYUN_API_KEY');
  }

  // 验证chapter参数
  if (!chapter || typeof chapter !== 'string' || chapter.trim() === '') {
    console.warn('chapter参数无效，使用默认值');
    chapter = '东汉末年';
  }

  // 验证subStage和category参数
  if (typeof subStage !== 'number' || subStage < 1) {
    subStage = 1;
  }
  if (!category || typeof category !== 'string') {
    category = '民生';
  }

  try {
    const userPrompt = createQuestUserPrompt(chapter, subStage, category);
    const tools = getQuestWithSuggestionsTools();

    console.log('=== 生成机遇任务和发明建议 ===');
    console.log('当前章节:', chapter);
    console.log('当前子阶段:', subStage);
    console.log('任务类别:', category);
    console.log('用户提示词长度:', userPrompt?.length || 0);
    console.log('用户提示词内容:', userPrompt);
    console.log('系统提示词长度:', QUEST_SYSTEM_PROMPT?.length || 0);
    console.log('系统提示词内容:', QUEST_SYSTEM_PROMPT);
    console.log('可用工具:', tools);
    
    // 验证提示词不为空
    if (!userPrompt || userPrompt.trim() === '') {
      throw new Error('用户提示词为空');
    }
    if (!QUEST_SYSTEM_PROMPT || QUEST_SYSTEM_PROMPT.trim() === '') {
      throw new Error('系统提示词为空');
    }
    
    const response = await fetch(ALIYUN_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          {
            role: 'system',
            content: QUEST_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.9,
        max_tokens: 800,
        top_p: 0.9,
        tools: tools,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API请求失败的原始响应:', errorText);
      throw new Error(`API请求失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('AI原始响应:', data);

    // 处理工具调用响应 - OpenAI兼容格式
    const choice = data?.choices?.[0];
    if (choice?.message?.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);
      
      console.log('AI调用工具:', functionName, functionArgs);
      
      if (functionName === 'generateQuestWithSuggestions') {
        // 返回包含任务和发明建议的结果对象
        return {
          quest: functionArgs.quest,
          inventionSuggestions: functionArgs.inventionSuggestions
        };
      }
      
      if (functionName === 'generateQuestTask') {
        // 兼容旧的工具调用格式
        return `【${functionArgs.title}】\n\n${functionArgs.description}\n\n难度：${functionArgs.difficulty} | 类别：${functionArgs.category} | 潜在奖励：${functionArgs.reward}国力`;
      }
    }
    
    // 如果没有工具调用，尝试解析普通文本响应
    let aiResponse = null;
    if (choice?.message?.content) {
      aiResponse = choice.message.content;
    }
    
    if (aiResponse) {
      console.log('AI文本响应:', aiResponse);
      return aiResponse;
    }
    
    throw new Error('AI响应格式异常：无法获取有效的任务数据');

  } catch (error) {
    console.error('生成机遇任务失败:', error);
    // 返回默认任务而不是抛出错误
    return `【${chapter}时期的挑战】\n\n在这个动荡的时代，百姓们面临着各种困难。作为一位发明家，你能否创造出改善民生的发明？\n\n难度：中等 | 类别：民生 | 潜在奖励：50国力`;
  }
}