<template>
  <div class="narrative-display">
    <h3>📚 历史记录</h3>
    
    <div v-if="events.length === 0" class="empty-state">
      <p>🌟 你的发明历程即将开始...</p>
      <p>每一个成功的发明都将被记录在这里，见证你改变历史的伟大时刻！</p>
    </div>
    
    <div v-else class="events-container">
      <div 
        v-for="(event, index) in events" 
        :key="index"
        class="event-card"
      >
        <h4 class="event-title">{{ event.title }}</h4>
        <p class="event-description">{{ event.description }}</p>
        <div class="event-meta">
          <span class="event-time">{{ event.time }}</span>
          <span class="event-reward" v-if="event.reward">
            +{{ event.reward }} 国力
          </span>
        </div>
      </div>
    </div>
    
    <!-- 示例历史事件 -->
    <div class="sample-events">
      <h4>💫 即将到来的精彩</h4>
      <div class="sample-card">
        <p><strong>发明成功：</strong>当你完成第一个发明时，将获得国力奖励并推进游戏进程</p>
      </div>
      <div class="sample-card">
        <p><strong>历史转折：</strong>你的发明将影响三国历史的走向</p>
      </div>
      <div class="sample-card">
        <p><strong>章节推进：</strong>达到国力目标后将解锁新的章节和挑战</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// 接收父组件传递的事件数据
const props = defineProps({
  events: {
    type: Array,
    required: true,
    default: () => []
  }
})
</script>

<style scoped>
.narrative-display h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 20px;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: #7f8c8d;
  font-style: italic;
}

.empty-state p {
  margin: 10px 0;
  line-height: 1.6;
}

.events-container {
  margin-bottom: 30px;
}

.event-title {
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 16px;
}

.event-description {
  color: #34495e;
  line-height: 1.5;
  margin-bottom: 10px;
}

.event-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.event-time {
  color: #95a5a6;
}

.event-reward {
  background: #27ae60;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: bold;
}

.sample-events {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px dashed #bdc3c7;
}

.sample-events h4 {
  color: #8e44ad;
  margin-bottom: 15px;
  font-size: 16px;
}

.sample-card {
  background: #f8f9fa;
  border-left: 3px solid #8e44ad;
  padding: 10px;
  margin: 8px 0;
  border-radius: 5px;
  font-size: 14px;
}

.sample-card p {
  margin: 0;
  color: #2c3e50;
  line-height: 1.4;
}
</style>