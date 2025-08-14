<template>
  <div class="invention-workbench">
    <h3>🔬 发明工作台</h3>
    
    <!-- 机遇任务区域 -->
    <div class="quest-area">
      <h4>📜 当前机遇</h4>
      <p class="quest-text">{{ questText }}</p>
    </div>
    
    <!-- 发明输入区域 -->
    <div class="invention-input-section">
      <h4>💡 你的发明构想</h4>
      <input 
        v-model="inventionInput"
        type="text" 
        class="input-field"
        placeholder="请输入你想要发明的物品名称..."
        @keyup.enter="startResearch"
      />
      
      <div class="button-group">
        <button 
          class="btn"
          @click="checkFeasibility"
          :disabled="!inventionInput.trim()"
        >
          🔍 可行性检测
        </button>
        
        <button 
          class="btn"
          @click="startResearch"
          :disabled="!inventionInput.trim()"
        >
          🚀 开始研发
        </button>
      </div>
    </div>
    
    <!-- AI助手天工 -->
    <div class="ai-assistant">
      <h4>🤖 AI助手 "天工"</h4>
      <div class="assistant-message">
        <p>{{ assistantMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 组件状态
const inventionInput = ref('')
const questText = ref('刘备军队缺乏有效的攻城器械，无法攻破敌军坚固的城池。作为穿越而来的发明家，你能否设计出超越时代的攻城利器，帮助蜀汉军队取得战略优势？')
const assistantMessage = ref('欢迎来到三国时代！我是你的AI助手"天工"。请告诉我你想要发明什么，我会帮助你分析可行性并指导研发过程。')

// 可行性检测
const checkFeasibility = () => {
  if (!inventionInput.value.trim()) return
  
  // 这里将来会接入真正的AI API
  assistantMessage.value = `正在分析"${inventionInput.value}"的可行性...\n\n基于当前三国时期的技术水平和材料条件，这个发明构想具有一定的可行性。建议考虑以下几个方面：\n1. 所需材料是否容易获得\n2. 制作工艺是否符合当时技术水平\n3. 实用性和战略价值\n\n点击"开始研发"进入详细设计阶段。`
}

// 开始研发
const startResearch = () => {
  if (!inventionInput.value.trim()) return
  
  // 这里将来会启动引导式问答流程
  assistantMessage.value = `很好！让我们开始研发"${inventionInput.value}"。\n\n我需要了解一些细节来帮助你完善这个发明：\n\n第一个问题：这个发明的主要用途是什么？请详细描述它要解决的具体问题。`
}
</script>

<style scoped>
.invention-workbench {
  height: 100%;
}

.invention-workbench h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 22px;
}

.invention-workbench h4 {
  color: #34495e;
  margin-bottom: 15px;
  font-size: 18px;
}

.quest-text {
  font-size: 16px;
  line-height: 1.6;
  color: #856404;
}

.invention-input-section {
  margin: 20px 0;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.ai-assistant {
  margin-top: 30px;
}

.assistant-message {
  background: #e8f4fd;
  border: 2px solid #3498db;
  border-radius: 10px;
  padding: 15px;
  min-height: 100px;
}

.assistant-message p {
  margin: 0;
  line-height: 1.6;
  white-space: pre-line;
  color: #2c3e50;
}
</style>