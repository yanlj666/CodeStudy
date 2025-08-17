<script setup>
import { ref, reactive, onMounted, watch, nextTick } from 'vue';
import StatusDisplay from './components/StatusDisplay.vue';
import InventionWorkbench from './components/InventionWorkbench.vue';
import NarrativeDisplay from './components/NarrativeDisplay.vue';
import {
  saveGameState,
  loadGameState,
  clearGameState,
  getInitialGameState,
  hasSavedGameState
} from './services/gameState.js';
import { getNewQuest } from './services/aiService.js';

// 游戏状态管理
const currentChapter = ref("第一章：立足蜀中，获得信任")
const nationalPower = ref(0)
const maxNationalPower = ref(1000)

// 当前机遇任务（由AI动态生成）
const currentQuest = ref('')

// 发明成果数据
const inventionResults = reactive({
  "曲辕犁": {
    title: '天工开物：曲辕犁',
    description: '此物构造精巧，转弯自如，极大提升了农作效率。蜀中农人无不交口称赞，预计来年粮产可增两成！',
    power: 150
  },
  "肥皂": {
    title: '奇物"皂"之制法',
    description: '此物去污除垢，功效卓绝。军士用之，可有效避免伤口感染，军医处大喜过望。',
    power: 100
  }
})

// 历史事件和研发状态
const historicalEvents = reactive([])
const isInventing = ref(false)
const gameStateLoaded = ref(false);

// 获取当前游戏状态对象
const getCurrentGameState = () => {
  return {
    nationalPower: nationalPower.value,
    maxNationalPower: maxNationalPower.value,
    currentChapter: currentChapter.value,
    historicalEvents: [...historicalEvents],
    inventionResults: { ...inventionResults },
    currentQuest: currentQuest.value,
    isInventing: isInventing.value
  };
};

// 应用游戏状态
const applyGameState = (state) => {
  nationalPower.value = state.nationalPower || 50;
  maxNationalPower.value = state.maxNationalPower || 100;
  currentChapter.value = state.currentChapter || '东汉末年';

  historicalEvents.length = 0;
  if (state.historicalEvents) {
    historicalEvents.push(...state.historicalEvents);
  }

  Object.keys(inventionResults).forEach(key => {
    delete inventionResults[key];
  });
  if (state.inventionResults) {
    Object.assign(inventionResults, state.inventionResults);
  }

  currentQuest.value = state.currentQuest || '';
  isInventing.value = state.isInventing || false;
};

// 处理发明完成事件
// 处理发明完成事件
const handleInventionCompleted = async (data) => {
  console.log('收到发明完成事件:', data);

  isInventing.value = true;

  try {
    const { conversationHistory, inventionResult } = data;

    // 模拟研发时间
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 更新国力值
    const powerIncrease = inventionResult.nationalPowerIncrease || 10;
    nationalPower.value = Math.min(nationalPower.value + powerIncrease, maxNationalPower.value);

    // 添加历史事件 - 优化数据结构
    const newEvent = {
      id: Date.now(),
      type: 'invention',
      title: `发明了${inventionResult.name}`,
      description: inventionResult.description,
      impact: `国力提升 +${powerIncrease}`,
      powerIncrease: powerIncrease, // 添加数值字段便于显示
      timestamp: new Date().toLocaleString('zh-CN'),
      conversationHistory: conversationHistory // 保存完整的对话历史
    };

    historicalEvents.unshift(newEvent);

    // 保存发明结果
    inventionResults[inventionResult.name] = {
      ...inventionResult,
      powerIncrease: powerIncrease, // 确保发明结果也包含国力增加值
      conversationHistory: conversationHistory,
      createdAt: Date.now()
    };

    console.log('发明完成，游戏状态已更新');

    // 获取新的机遇任务
    try {
      currentQuest.value = '天工正在思考新的机遇...';
      const newQuest = await getNewQuest(currentChapter.value);
      currentQuest.value = newQuest;
      console.log('新任务已生成:', newQuest);
    } catch (error) {
      console.error('获取新任务失败:', error);
      currentQuest.value = '暂时无法获取新任务，请稍后再试。';
    }

  } catch (error) {
    console.error('处理发明完成事件失败:', error);
  } finally {
    isInventing.value = false;
  }
};

// 重新开始游戏
const restartGame = () => {
  if (confirm('确定要重新开始游戏吗？这将清除所有进度。')) {
    // 清除本地缓存
    clearGameState();

    // 重置所有状态为初始值
    const initialState = getInitialGameState();
    applyGameState(initialState);

    console.log('游戏已重新开始');
    alert('游戏已重新开始！');
  }
};

// 组件挂载时加载游戏状态
onMounted(async () => {
  console.log('App组件已挂载，尝试加载游戏状态...');

  if (hasSavedGameState()) {
    const savedState = loadGameState();
    if (savedState) {
      applyGameState(savedState);
      console.log('游戏状态已恢复:', savedState);
    }
  } else {
    console.log('未找到保存的游戏状态，使用初始状态');
  }

  // 如果没有当前任务，获取新任务
  if (!currentQuest.value) {
    try {
      currentQuest.value = '天工正在思考新的机遇...';
      const newQuest = await getNewQuest(currentChapter.value);
      currentQuest.value = newQuest;
      console.log('初始任务已生成:', newQuest);
    } catch (error) {
      console.error('获取初始任务失败:', error);
      currentQuest.value = '暂时无法获取任务，请稍后再试。';
    }
  }

  gameStateLoaded.value = true;

  // 等待下一个tick后开始监听状态变化
  await nextTick();

  // 监听所有核心状态的变化，实时保存
  watch(
    () => getCurrentGameState(),
    (newState) => {
      console.log('检测到游戏状态变化，自动保存:', newState);
      saveGameState(newState);
    },
    { deep: true }
  );
});
</script>

<template>
  <div id="app">
    <StatusDisplay
      :current-chapter="currentChapter"
      :national-power="nationalPower"
      :max-national-power="maxNationalPower"
      @restart-game="restartGame"
    />

    <InventionWorkbench 
      :current-quest="currentQuest"
      @invention-completed="handleInventionCompleted" 
    />

    <NarrativeDisplay :events="historicalEvents" />

    <!-- 游戏状态提示 -->
    <div v-if="gameStateLoaded" class="game-state-indicator">
      <span class="indicator-text">✅ 游戏进度已自动保存</span>
    </div>
  </div>
</template>

<style>
#app {
  font-family: '微软雅黑', Arial, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #FFF8DC 0%, #F5E6D3 100%);
  min-height: 100vh;
}

.game-state-indicator {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(34, 139, 34, 0.9);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  z-index: 1000;
  animation: fadeInOut 3s ease-in-out;
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}

.indicator-text {
  display: flex;
  align-items: center;
  gap: 5px;
}

.status-section {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
  border: 2px solid #d4af37;
}

.workbench-section {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #fff8dc;
  border-radius: 8px;
  border: 2px solid #8b4513;
}

.narrative-section {
  padding: 15px;
  background-color: #f0f8ff;
  border-radius: 8px;
  border: 2px solid #4682b4;
  max-height: 400px;
  overflow-y: auto;
}
</style>
