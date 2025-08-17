<script setup>
import { computed } from 'vue'

// 定义Props
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

// 定义事件
const emit = defineEmits(['restart-game'])

// 计算进度百分比
const progressPercentage = computed(() => {
  return Math.min((props.nationalPower / props.maxNationalPower) * 100, 100)
})
</script>

<template>
  <div class="status-display">
    <div class="status-header">
      <h1>{{ currentChapter }} - 匡扶汉室的发明家</h1>
      <button @click="emit('restart-game')" class="restart-btn" title="重新开始游戏">
        <img src="/icons/restart.svg" alt="重新开始" class="icon" />
        重新开始
      </button>
    </div>
    
    <div class="power-display">
      <div class="power-label">国力值</div>
      <div class="power-bar">
        <div 
          class="power-fill" 
          :style="{ width: progressPercentage + '%' }"
        ></div>
        <div class="power-text">{{ nationalPower }} / {{ maxNationalPower }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.icon {
  width: 1.2em;
  height: 1.2em;
  vertical-align: middle;
  margin-right: 4px;
}

.status-display {
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  color: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.status-header h1 {
  margin: 0;
  font-family: '楷体', serif;
  font-size: 24px;
}

.restart-btn {
  background: #DC143C;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.restart-btn:hover {
  background: #B22222;
  transform: scale(1.05);
}

.power-display {
  display: flex;
  align-items: center;
  gap: 15px;
}

.power-label {
  font-weight: bold;
  font-size: 16px;
  min-width: 60px;
}

.power-bar {
  flex: 1;
  height: 30px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  position: relative;
  overflow: hidden;
}

.power-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFD700 0%, #FFA500 100%);
  border-radius: 15px;
  transition: width 0.5s ease;
}

.power-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}
</style>