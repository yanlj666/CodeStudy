<template>
  <div class="invention-workbench">
    <h2>发明工作台</h2>
    
    <!-- 初始输入阶段 -->
    <div v-if="!isConversationStarted" class="initial-input">
      <div class="input-group">
        <label for="invention-input">请描述您想要发明的物品：</label>
        <textarea 
          id="invention-input"
          v-model="userInput" 
          placeholder="例如：一种能够快速清洁衣物的工具"
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
import { ref, reactive } from 'vue';
import { getNextInventionQuestion, generateInvention } from '../services/aiService.js';

export default {
  name: 'InventionWorkbench',
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
        
        if (aiQuestion === '##DONE##') {
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
        
        if (nextQuestion === '##DONE##') {
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
        alert('生成发明方案失败，请重试');
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

    // 格式化时间
    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      });
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
      startConversation,
      submitAnswer,
      generateFinalInvention,
      resetConversation,
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

.input-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #D2B48C;
  border-radius: 5px;
  font-size: 14px;
  resize: vertical;
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