// AI服务模块 - 封装所有对外部AI API的调用
import { createInventionGeneratorPrompt } from '../prompts.js';
import { createGuidedQAPrompt } from '../prompts.js';

// 使用代理路径而非直接调用外部API
const ALIYUN_API_ENDPOINT = '/api/dashscope/api/v1/services/aigc/text-generation/generation';
// 在文件顶部统一定义
const API_KEY = import.meta.env.VITE_ALIYUN_API_KEY;

// 在generateInvention函数中修改
export async function generateInvention(playerInputs) {
  if (!API_KEY || API_KEY === 'your_actual_api_key_here') {
    throw new Error('API密钥未配置，请在.env.local文件中设置VITE_ALIYUN_API_KEY');
  }

  try {
    const prompt = createInventionGeneratorPrompt(playerInputs);
    console.log('发送给AI的Prompt:', prompt);
    
    const response = await fetch(ALIYUN_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-DashScope-SSE': 'disable'
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        input: {
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        parameters: {
          temperature: 0.8,
          max_tokens: 1500,
          top_p: 0.9
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API请求失败的原始响应:', errorText);
      throw new Error(`API请求失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('AI原始响应:', data);

    // 🔧 修复：使用灵活的响应处理逻辑
    let aiResponse = null;
    
    // 方法1: 标准路径
    if (data?.output?.choices?.[0]?.message?.content) {
      aiResponse = data.output.choices[0].message.content;
    }
    // 方法2: 备用路径
    else if (data?.output?.text) {
      aiResponse = data.output.text;
    }
    // 方法3: 直接文本响应
    else if (typeof data?.output === 'string') {
      aiResponse = data.output;
    }
    // 方法4: 检查是否有错误信息
    else if (data?.code || data?.message) {
      console.error('API返回错误:', {
        code: data.code,
        message: data.message,
        request_id: data.request_id
      });
      throw new Error(`API错误: ${data.message || '未知错误'}`);
    }
    
    if (!aiResponse || typeof aiResponse !== 'string') {
      // 输出详细的响应结构用于调试
      console.error('无法解析AI响应，响应结构:', {
        hasOutput: !!data?.output,
        outputType: typeof data?.output,
        outputKeys: data?.output ? Object.keys(data.output) : [],
        fullResponse: data
      });
      throw new Error('AI响应格式异常：无法获取有效内容');
    }

    console.log('AI响应内容:', aiResponse);
    
    try {
      const inventionData = JSON.parse(aiResponse);
      return inventionData;
    } catch (parseError) {
      console.error('解析AI响应失败:', parseError);
      console.log('原始AI响应:', aiResponse);
      
      return {
        title: '解析失败的发明',
        description: aiResponse,
        impact: '未知影响',
        power: 10,
        category: '其他',
        materials: ['未知材料']
      };
    }

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
    console.log('发送多轮会话请求，消息历史:', messages);
    
    const prompt = createGuidedQAPrompt(messages);
    console.log('生成的引导提示词:', prompt);

    const response = await fetch('/api/dashscope/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        input: {
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        parameters: {
          max_tokens: 200,
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API请求失败的原始响应:', errorText);
      throw new Error(`API请求失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('AI多轮会话原始响应:', JSON.stringify(data, null, 2));

    // 增强的响应处理逻辑
    let aiResponse = null;
    
    // 方法1: 标准路径
    if (data?.output?.choices?.[0]?.message?.content) {
      aiResponse = data.output.choices[0].message.content;
    }
    // 方法2: 备用路径
    else if (data?.output?.text) {
      aiResponse = data.output.text;
    }
    // 方法3: 直接文本响应
    else if (typeof data?.output === 'string') {
      aiResponse = data.output;
    }
    // 方法4: 检查是否有错误信息
    else if (data?.code || data?.message) {
      console.error('API返回错误:', {
        code: data.code,
        message: data.message,
        request_id: data.request_id
      });
      return '##DONE##';
    }
    
    if (aiResponse && typeof aiResponse === 'string') {
      const trimmedResponse = aiResponse.trim();
      if (trimmedResponse) {
        console.log('AI引导问题:', trimmedResponse);
        return trimmedResponse;
      }
    }
    
    // 如果所有方法都失败，输出详细的响应结构用于调试
    console.error('无法解析AI响应，响应结构:', {
      hasOutput: !!data?.output,
      outputType: typeof data?.output,
      outputKeys: data?.output ? Object.keys(data.output) : [],
      fullResponse: data
    });
    
    return '##DONE##';

  } catch (error) {
    console.error('获取AI问题失败:', error);
    return '##DONE##';
  }
}