<template>
  <div class="status-display">
    <h2 class="chapter-title">{{ currentChapter }}</h2>
    
    <div class="progress-section">
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: progressPercentage + '%' }"
        ></div>
      </div>
      <p class="power-text">
        国力: {{ nationalPower }} / {{ maxNationalPower }}
      </p>
    </div>
    
    <div class="game-info">
      <p class="game-title">🏛️ 匡扶汉室的发明家</p>
      <p class="game-subtitle">与AI助手"天工"一起改变历史</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// 接收父组件传递的数据
const props = defineProps({
  currentChapter: {
    type: String,
    required: true
  },
  nationalPower: {
    type: Number,
    required: true
  },
  maxNationalPower: {
    type: Number,
    required: true
  }
})

// 计算进度百分比
const progressPercentage = computed(() => {
  return Math.min((props.nationalPower / props.maxNationalPower) * 100, 100)
})
</script>

<style scoped>
.status-display {
  text-align: center;
}

.chapter-title {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: bold;
}

.progress-section {
  margin: 20px 0;
}

.power-text {
  margin-top: 10px;
  font-size: 18px;
  font-weight: bold;
  color: #34495e;
}

.game-info {
  margin-top: 20px;
}

.game-title {
  font-size: 20px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.game-subtitle {
  font-size: 14px;
  color: #7f8c8d;
  font-style: italic;
}
</style>