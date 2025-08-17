<template>
  <div class="invention-workbench">
    <h2>发明工作台</h2>
    
    <!-- 当前机遇任务显示 -->
    <div v-if="currentQuest" class="current-quest">
      <div class="quest-header">
        <h3>📜 当前机遇</h3>
        <button @click="requestNewQuest" class="new-quest-btn" :disabled="isRequestingNewQuest">
          {{ isRequestingNewQuest ? '思考中...' : '获取新机遇' }}
        </button>
      </div>
      <div class="quest-content">
        <div v-if="!showFullQuest" class="quest-summary">
          {{ questSummary }}
          <button v-if="hasMoreContent" @click="toggleQuestDisplay" class="expand-btn">
            展开详情 ▼
          </button>
        </div>
        <div v-else class="quest-full">
          <div class="quest-parsed" v-html="parsedQuestContent"></div>
          <button @click="toggleQuestDisplay" class="collapse-btn">
            收起详情 ▲
          </button>
        </div>
      </div>
    </div>
    
    <!-- 初始输入阶段 -->
    <div v-if="!isConversationStarted" class="initial-input">
      <div class="input-group">
        <label for="invention-input">请描述您想要发明的物品：</label>
        <textarea 
          id="invention-input"
          v-model="userInput" 
          :placeholder="inventionPlaceholder"
          rows="3"
        ></textarea>
      </div>
      <button 
        @click="startConversation" 
        :disabled="!userInput.trim() || isLoading"
        class="start-btn"
      >
        {{ isLoading ? '启动中...' : '开始研发' }}
      </button>
    </div>

    <!-- 多轮对话阶段 -->
    <div v-else class="conversation-area">
      <div class="conversation-history">
        <div 
          v-for="(message, index) in messages" 
          :key="index" 
          :class="['message', message.role]"
        >
          <div class="message-header">
            <span class="role">{{ message.role === 'user' ? '您' : 'AI天工' }}</span>
            <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
          </div>
          <div class="message-content">{{ message.content }}</div>
        </div>
      </div>

      <!-- 当前AI问题显示 -->
      <div v-if="currentAIQuestion && !isConversationComplete" class="current-question">
        <div class="message ai">
          <div class="message-header">
            <span class="role">AI天工</span>
            <span class="timestamp">{{ formatTime(Date.now()) }}</span>
          </div>
          <div class="message-content">{{ currentAIQuestion }}</div>
        </div>
      </div>

      <!-- 用户回答输入 -->
      <div v-if="!isConversationComplete" class="user-input">
        <textarea 
          v-model="currentUserAnswer" 
          placeholder="请回答AI天工的问题..."
          rows="3"
          :disabled="isLoading"
        ></textarea>
        <button 
          @click="submitAnswer" 
          :disabled="!currentUserAnswer.trim() || isLoading"
          class="submit-btn"
        >
          {{ isLoading ? '思考中...' : '提交回答' }}
        </button>
      </div>

      <!-- 对话完成提示 -->
      <div v-if="isConversationComplete" class="completion-area">
        <div class="completion-message">
          <h3>🎉 发明方案已完善！</h3>
          <p>AI天工已收集到足够的信息，正在为您生成最终的发明方案...</p>
        </div>
        <button @click="generateFinalInvention" :disabled="isGenerating" class="generate-btn">
          {{ isGenerating ? '生成中...' : '生成发明方案' }}
        </button>
      </div>

      <!-- 重新开始按钮 -->
      <button @click="resetConversation" class="reset-btn">重新开始</button>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { getNextInventionQuestion, generateInvention } from '../services/aiService.js';

export default {
  name: 'InventionWorkbench',
  props: {
    currentQuest: {
      type: String,
      default: ''
    }
  },
  emits: ['invention-completed'],
  setup(props, { emit }) {
    // 响应式状态
    const userInput = ref('');
    const currentUserAnswer = ref('');
    const currentAIQuestion = ref('');
    const isLoading = ref(false);
    const isGenerating = ref(false);
    const isConversationStarted = ref(false);
    const isConversationComplete = ref(false);
    const messages = reactive([]);
    const showFullQuest = ref(false);
    const inventionSuggestions = ref([]);
    const isRequestingNewQuest = ref(false);
    
    // 解析任务内容，提取核心信息
    const parseQuestContent = (content) => {
      if (!content) return { summary: '', full: '', hasMore: false };
      
      // 移除AI调用过程的描述
      let cleanContent = content
        .replace(/好的，我将为.*?生成.*?任务。/g, '')
        .replace(/调用.*?工具.*?如下：/g, '')
        .replace(/---\s*/g, '')
        .replace(/此任务旨在.*$/g, '')
        .replace(/希望这个任务.*$/g, '')
        .trim();
      
      // 提取任务标题和描述
      const titleMatch = cleanContent.match(/\*\*机遇任务：《(.+?)》\*\*/);
      const descMatch = cleanContent.match(/\*\*任务描述：\*\*\s*([\s\S]*?)(?=\*\*任务目标：|$)/);
      const goalMatch = cleanContent.match(/\*\*任务目标：\*\*\s*([\s\S]*?)(?=\*\*任务难度：|$)/);
      const difficultyMatch = cleanContent.match(/\*\*任务难度：\*\*\s*([\s\S]*?)(?=\*\*奖励：|$)/);
      
      const title = titleMatch ? titleMatch[1] : '';
      const description = descMatch ? descMatch[1].trim() : '';
      const goal = goalMatch ? goalMatch[1].trim() : '';
      const difficulty = difficultyMatch ? difficultyMatch[1].trim() : '';
      
      // 生成简要摘要（标题 + 简短描述）
      let summary = '';
      if (title) {
        summary = `《${title}》`;
        if (description) {
          const shortDesc = description.length > 60 ? description.substring(0, 60) + '...' : description;
          summary += `\n${shortDesc}`;
        }
      } else {
        // 如果没有结构化内容，取前100个字符
        summary = cleanContent.length > 100 ? cleanContent.substring(0, 100) + '...' : cleanContent;
      }
      
      // 生成格式化的完整内容
      let fullContent = '';
      if (title) {
        fullContent += `<h4>《${title}》</h4>`;
      }
      if (description) {
        fullContent += `<p><strong>任务描述：</strong>${description}</p>`;
      }
      if (goal) {
        fullContent += `<p><strong>任务目标：</strong>${goal}</p>`;
      }
      if (difficulty) {
        fullContent += `<p><strong>难度：</strong>${difficulty}</p>`;
      }
      
      // 如果没有结构化内容，使用原始内容
      if (!fullContent) {
        fullContent = cleanContent.replace(/\n/g, '<br>');
      }
      
      return {
        summary: summary,
        full: fullContent,
        hasMore: cleanContent.length > 100 || (title && (description || goal))
      };
    };
    
    // 计算属性
    const questSummary = computed(() => {
      const parsed = parseQuestContent(props.currentQuest);
      return parsed.summary;
    });
    
    const parsedQuestContent = computed(() => {
      const parsed = parseQuestContent(props.currentQuest);
      return parsed.full;
    });
    
    const hasMoreContent = computed(() => {
      const parsed = parseQuestContent(props.currentQuest);
      return parsed.hasMore;
    });
    
    // 监听全局发明建议变化
    const updateInventionSuggestions = () => {
      const globalSuggestions = window.currentInventionSuggestions || [];
      inventionSuggestions.value = [...globalSuggestions];
    };
    
    // 组件挂载时初始化发明建议
    onMounted(() => {
      updateInventionSuggestions();
      // 定期检查全局状态变化
      const interval = setInterval(updateInventionSuggestions, 500);
      // 组件卸载时清理定时器
      return () => clearInterval(interval);
    });
    
    // 监听任务变化，更新发明建议
    watch(() => props.currentQuest, () => {
      // 延迟一点时间确保全局状态已更新
      setTimeout(updateInventionSuggestions, 100);
    });
    
    // 动态生成发明建议的placeholder
    const inventionPlaceholder = computed(() => {
      // 检查任务是否正在加载中
      if (props.currentQuest === '天工正在思考新的机遇...') {
        return '天工正在思考发明建议中...';
      }
      
      if (inventionSuggestions.value.length > 0) {
        const examples = inventionSuggestions.value.slice(0, 2).map(s => s.name).join('、');
        return `例如：${examples}等`;
      }
      return '例如：一种能够快速清洁衣物的工具';
    });
    
    // 切换任务显示状态
    const toggleQuestDisplay = () => {
      showFullQuest.value = !showFullQuest.value;
    };

    // 开始对话
    const startConversation = async () => {
      if (!userInput.value.trim()) return;
      
      isLoading.value = true;
      isConversationStarted.value = true;
      
      // 添加用户初始输入到消息历史
      const initialMessage = {
        role: 'user',
        content: userInput.value,
        timestamp: Date.now()
      };
      messages.push(initialMessage);
      
      try {
        // 获取AI的第一个问题
        const aiQuestion = await getNextInventionQuestion([initialMessage]);
        
        if (isConversationDone(aiQuestion)) {
          // 如果AI认为信息已足够，直接完成对话
          isConversationComplete.value = true;
        } else {
          currentAIQuestion.value = aiQuestion;
        }
      } catch (error) {
        console.error('启动对话失败:', error);
        alert('启动对话失败，请重试');
        resetConversation();
      } finally {
        isLoading.value = false;
      }
    };

    // 提交用户回答
    const submitAnswer = async () => {
      if (!currentUserAnswer.value.trim()) return;
      
      isLoading.value = true;
      
      // 添加AI问题到消息历史
      messages.push({
        role: 'assistant',
        content: currentAIQuestion.value,
        timestamp: Date.now() - 1000 // 稍微早一点的时间戳
      });
      
      // 添加用户回答到消息历史
      const userMessage = {
        role: 'user',
        content: currentUserAnswer.value,
        timestamp: Date.now()
      };
      messages.push(userMessage);
      
      try {
        // 获取AI的下一个问题
        const nextQuestion = await getNextInventionQuestion([...messages]);
        
        if (isConversationDone(nextQuestion)) {
          // 对话完成
          isConversationComplete.value = true;
          currentAIQuestion.value = '';
        } else {
          // 继续对话
          currentAIQuestion.value = nextQuestion;
        }
        
        // 清空当前回答
        currentUserAnswer.value = '';
      } catch (error) {
        console.error('提交回答失败:', error);
        alert('提交回答失败，请重试');
      } finally {
        isLoading.value = false;
      }
    };

    // 生成最终发明方案
    const generateFinalInvention = async () => {
      isGenerating.value = true;
      
      try {
        // 将完整的对话历史转换为单一的发明描述
        const conversationSummary = messages
          .filter(msg => msg.role === 'user')
          .map(msg => msg.content)
          .join(' ');
        
        // 调用原有的发明生成API
        const inventionResult = await generateInvention(conversationSummary);
        
        // 将完整的会话历史和发明结果传递给父组件
        emit('invention-completed', {
          conversationHistory: [...messages],
          inventionResult: inventionResult,
          originalInput: userInput.value
        });
        
        // 重置组件状态
        resetConversation();
      } catch (error) {
        console.error('生成发明方案失败:', error);
        
        // 根据错误类型提供更具体的错误信息
        let errorMessage = '生成发明方案失败，请重试';
        
        if (error.message.includes('JSON')) {
          errorMessage = 'AI响应格式错误，请稍后重试';
        } else if (error.message.includes('API错误')) {
          errorMessage = 'API调用失败，请检查网络连接或稍后重试';
        } else if (error.message.includes('工具调用参数')) {
          errorMessage = 'AI返回数据格式异常，请重新生成';
        } else if (error.message.includes('未收到预期的工具调用')) {
          errorMessage = 'AI未能正确生成发明方案，请重新尝试';
        }
        
        alert(errorMessage);
      } finally {
        isGenerating.value = false;
      }
    };

    // 重置对话
    const resetConversation = () => {
      userInput.value = '';
      currentUserAnswer.value = '';
      currentAIQuestion.value = '';
      isConversationStarted.value = false;
      isConversationComplete.value = false;
      isLoading.value = false;
      isGenerating.value = false;
      messages.length = 0; // 清空数组
    };

    /**
     * 安全的会话完成检测函数
     * 防止注入攻击，使用多重验证机制
     * @param {string} response - AI的响应内容
     * @returns {boolean} 是否为会话完成标记
     */
    const isConversationDone = (response) => {
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
    };

    // 格式化时间
    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // 请求新机遇任务
    const requestNewQuest = async () => {
      isRequestingNewQuest.value = true;
      try {
        // 发送事件到父组件处理
        await emit('request-new-quest');
      } catch (error) {
        console.error('请求新机遇失败:', error);
      } finally {
        // 延迟一点时间再恢复按钮状态，确保用户能看到加载效果
        setTimeout(() => {
          isRequestingNewQuest.value = false;
        }, 1000);
      }
    };

    return {
      userInput,
      currentUserAnswer,
      currentAIQuestion,
      isLoading,
      isGenerating,
      isConversationStarted,
      isConversationComplete,
      messages,
      showFullQuest,
      questSummary,
      parsedQuestContent,
      hasMoreContent,
      inventionSuggestions,
      inventionPlaceholder,
      isRequestingNewQuest,
      toggleQuestDisplay,
      startConversation,
      submitAnswer,
      generateFinalInvention,
      resetConversation,
      requestNewQuest,
      formatTime
    };
  }
};
</script>

<style scoped>
.invention-workbench {
  padding: 20px;
  border: 2px solid #8B4513;
  border-radius: 10px;
  background: linear-gradient(135deg, #F5E6D3 0%, #E8D5B7 100%);
  margin: 20px 0;
}

.invention-workbench h2 {
  color: #8B4513;
  text-align: center;
  margin-bottom: 20px;
  font-family: '楷体', serif;
}

.input-group {
  margin-bottom: 15px;
}

.input-group label {
  display: block;
  margin-bottom: 5px;
  color: #8B4513;
  font-weight: bold;
}

.current-quest {
  background: linear-gradient(135deg, #FFF8DC 0%, #F0E68C 100%);
  border: 2px solid #DAA520;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.quest-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.current-quest h3 {
  color: #B8860B;
  margin: 0;
  font-family: '楷体', serif;
  font-size: 18px;
}

.new-quest-btn {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: bold;
}

.new-quest-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #FF5252 0%, #FF6B6B 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(255, 107, 107, 0.3);
}

.new-quest-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.quest-content {
  color: #8B4513;
  line-height: 1.6;
  font-size: 14px;
}

.quest-summary {
  white-space: pre-line;
}

.quest-full {
  animation: fadeIn 0.3s ease-in-out;
}

.quest-parsed {
  margin-bottom: 10px;
}

.quest-parsed h4 {
  color: #B8860B;
  margin: 0 0 10px 0;
  font-size: 16px;
}

.quest-parsed p {
  margin: 8px 0;
  line-height: 1.5;
}

.quest-parsed strong {
  color: #8B4513;
}

.expand-btn, .collapse-btn {
  background: linear-gradient(135deg, #DAA520 0%, #B8860B 100%);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  margin-top: 8px;
  transition: all 0.2s ease;
}

.expand-btn:hover, .collapse-btn:hover {
  background: linear-gradient(135deg, #B8860B 0%, #DAA520 100%);
  transform: translateY(-1px);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.input-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #D2B48C;
  border-radius: 5px;
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;
}

.start-btn, .submit-btn, .generate-btn {
  background: linear-gradient(135deg, #DAA520 0%, #B8860B 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.start-btn:hover, .submit-btn:hover, .generate-btn:hover {
  background: linear-gradient(135deg, #B8860B 0%, #DAA520 100%);
  transform: translateY(-2px);
}

.start-btn:disabled, .submit-btn:disabled, .generate-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.conversation-area {
  max-height: 600px;
  overflow-y: auto;
}

.conversation-history {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 20px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 5px;
}

.message {
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 8px;
}

.message.user {
  background: #E6F3FF;
  margin-left: 20px;
}

.message.assistant {
  background: #FFF8DC;
  margin-right: 20px;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 12px;
  color: #666;
}

.role {
  font-weight: bold;
}

.message-content {
  font-size: 14px;
  line-height: 1.5;
}

.current-question {
  margin-bottom: 20px;
}

.user-input {
  margin-bottom: 20px;
}

.user-input textarea {
  width: 100%;
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #D2B48C;
  border-radius: 5px;
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;
}

.completion-area {
  text-align: center;
  padding: 20px;
  background: rgba(144, 238, 144, 0.3);
  border-radius: 8px;
  margin-bottom: 20px;
}

.completion-message h3 {
  color: #228B22;
  margin-bottom: 10px;
}

.completion-message p {
  color: #666;
  margin-bottom: 20px;
}

.reset-btn {
  background: #DC143C;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  float: right;
}

.reset-btn:hover {
  background: #B22222;
}
</style>