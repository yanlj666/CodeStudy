<script setup>
// 定义Props
const props = defineProps({
  events: {
    type: Array,
    required: true,
    default: () => []
  }
})

// 提取国力增加值的辅助函数
const extractPowerIncrease = (event) => {
  if (event.powerIncrease) {
    return event.powerIncrease;
  }
  if (event.impact && typeof event.impact === 'string') {
    const match = event.impact.match(/\+(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }
  return 0;
};
</script>

<template>
  <div class="narrative-display">
    <h2>📜 发明成果与历史记录</h2>
    
    <div v-if="props.events.length === 0" class="no-events">
      <p>🌟 等待您的第一个发明成果...</p>
    </div>
    
    <div v-else class="events-container">
      <div 
        v-for="(event, index) in props.events" 
        :key="event.id || index" 
        class="event-card"
      >
        <div class="card-header">
          <h3 class="event-title">{{ event.title }}</h3>
          <span class="power-gain">+{{ extractPowerIncrease(event) }} 国力</span>
        </div>
        <p class="event-description">{{ event.description }}</p>
        <div class="card-footer">
          <span class="event-timestamp" v-if="event.timestamp">{{ event.timestamp }}</span>
          <span class="event-number">第 {{ index + 1 }} 项发明</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.narrative-display {
  background-color: #f5f5dc;
  border-radius: 8px;
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.narrative-display h2 {
  color: #8b4513;
  margin-bottom: 20px;
  text-align: center;
  font-size: 1.4em;
}

.no-events {
  text-align: center;
  color: #999;
  font-style: italic;
  padding: 40px 20px;
}

.no-events p {
  margin: 0;
  font-size: 1.1em;
}

.events-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.event-card {
  background: linear-gradient(135deg, #fff8dc 0%, #f0e68c 100%);
  border: 2px solid #daa520;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s ease;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.event-title {
  color: #8b4513;
  margin: 0;
  font-size: 1.2em;
  font-weight: bold;
}

.power-gain {
  background-color: #32cd32;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.9em;
  font-weight: bold;
}

.event-description {
  color: #654321;
  line-height: 1.6;
  margin: 0 0 10px 0;
  font-size: 1em;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.event-timestamp {
  color: #888;
  font-size: 0.8em;
}

.event-number {
  color: #b8860b;
  font-size: 0.9em;
  font-style: italic;
}

/* 滚动条样式 */
.narrative-display::-webkit-scrollbar {
  width: 6px;
}

.narrative-display::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.narrative-display::-webkit-scrollbar-thumb {
  background: #daa520;
  border-radius: 3px;
}

.narrative-display::-webkit-scrollbar-thumb:hover {
  background: #b8860b;
}
</style>