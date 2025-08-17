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

// 子阶段与任务队列
const subStages = [
  {
    theme: '巩固蜀中',
    nextThreshold: 200,
    quests: [
      "丞相府邸传来消息，今年的蜀中雨水过多，许多农具因潮湿而加速朽坏，来年春耕恐受影响，百姓忧心忡忡。你是否能构想一种更耐久的材料，或是一种能提升耕作效率的新式农具？",
      "军医处传来简报，军士在潮湿环境下，伤口极易感染恶化，非战斗减员日益增多。寻常的布帛和草药，已难堪大用。你是否有办法创造出更有效的清创和包扎之物？"
    ]
  },
  {
    theme: '蜀中振兴',
    nextThreshold: 500,
    quests: [
      "蜀地贸易逐渐恢复，如何进一步提升物资流通效率？",
      "边境局势紧张，需要一种新式防御工事来保障安全。"
    ]
  },
  {
    theme: '霸业初成',
    nextThreshold: Infinity,
    quests: []
  }
]

const currentSubStageIndex = ref(0)
const questQueue = reactive([...subStages[0].quests])

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
// 移除调试信息变量

// 获取当前游戏状态对象
const getCurrentGameState = () => {
  return {
    nationalPower: nationalPower.value,
    maxNationalPower: maxNationalPower.value,
    currentChapter: currentChapter.value,
    historicalEvents: [...historicalEvents],
    inventionResults: { ...inventionResults },
    currentQuest: currentQuest.value,
    questQueue: [...questQueue],
    currentSubStageIndex: currentSubStageIndex.value,
    inventionSuggestions: window.currentInventionSuggestions || [],
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
  questQueue.length = 0;
  if (state.questQueue) {
    questQueue.push(...state.questQueue);
  } else {
    questQueue.push(...subStages[0].quests);
  }
  currentSubStageIndex.value = state.currentSubStageIndex || 0;
  isInventing.value = state.isInventing || false;
  
  // 恢复发明建议
  if (state.inventionSuggestions) {
    window.currentInventionSuggestions = state.inventionSuggestions;
  } else {
    window.currentInventionSuggestions = [];
  }
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
      // 完成当前任务后，移除队列首项
      questQueue.shift();

      // 检查子阶段升级
      const stage = subStages[currentSubStageIndex.value];
      if (
        nationalPower.value >= stage.nextThreshold &&
        currentSubStageIndex.value < subStages.length - 1
      ) {
        currentSubStageIndex.value++;
        const nextStage = subStages[currentSubStageIndex.value];
        questQueue.splice(0, questQueue.length, ...(nextStage.quests || []));
        historicalEvents.unshift({
          id: Date.now(),
          type: 'subStage',
          title: `进入${nextStage.theme}`,
          description: `新的阶段主题：${nextStage.theme}`,
          timestamp: new Date().toLocaleString('zh-CN')
        });
      }

      await getNewQuestTask();
      console.log('发明完成后，新任务已生成');

      // 立即保存游戏状态，确保所有变化被持久化
      const currentState = getCurrentGameState();
      console.log('发明完成，立即保存游戏状态:', currentState);
      saveGameState(currentState);
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

// 处理获取新机遇请求
const handleRequestNewQuest = async () => {
  // 检查国力值是否足够
  if (nationalPower.value < 10) {
    alert('国力不足！需要至少10点国力值才能获取新机遇。');
    return;
  }

  // 显示确认提示
  const confirmed = confirm('断无此事，消耗10国力值略过当前机遇，获取新的机遇任务？');
  
  if (confirmed) {
    try {
      // 扣除国力值
      nationalPower.value = Math.max(0, nationalPower.value - 10);
      
      // 添加历史事件记录
      const newEvent = {
        id: Date.now(),
        type: 'quest_skip',
        title: '略过机遇任务',
        description: '消耗10国力值，略过当前机遇，获取新的机遇任务',
        impact: '国力消耗 -10',
        powerIncrease: -10,
        timestamp: new Date().toLocaleString('zh-CN')
      };
      
      historicalEvents.unshift(newEvent);
      
      // 获取新的机遇任务
      await getNewQuestTask();
      
      // 立即保存游戏状态，确保国力值变化和新任务被持久化
      const currentState = getCurrentGameState();
      console.log('新机遇已获取，立即保存游戏状态:', currentState);
      saveGameState(currentState);
      
      console.log('已获取新机遇任务，国力值扣除10点');
    } catch (error) {
      console.error('获取新机遇失败:', error);
      // 如果获取失败，退还国力值
      nationalPower.value = Math.min(maxNationalPower.value, nationalPower.value + 10);
      alert('获取新机遇失败，请稍后再试。国力值已退还。');
    }
  }
};

// 获取新机遇任务的函数
const getNewQuestTask = async () => {
  try {
    currentQuest.value = '天工正在思考新的机遇...';
    const questResult = await getNewQuest(currentChapter.value);
    
    // 处理新的返回格式（包含任务和发明建议）
    if (questResult && typeof questResult === 'object' && questResult.quest) {
      // 新格式：包含quest和inventionSuggestions
      const { quest, inventionSuggestions } = questResult;
      currentQuest.value = `《${quest.title}》\n\n${quest.description}\n\n难度：${quest.difficulty}\n类别：${quest.category}\n奖励：${quest.reward}`;
      
      // 将发明建议存储到全局状态中，供InventionWorkbench使用
      window.currentInventionSuggestions = inventionSuggestions;
      console.log('任务和发明建议已生成:', { quest, inventionSuggestions });
    } else {
      // 兼容旧格式：直接是任务字符串
      currentQuest.value = questResult;
      window.currentInventionSuggestions = [];
      console.log('任务已生成（旧格式）:', questResult);
    }
    
    // 立即保存游戏状态，确保任务和发明建议被持久化
    if (gameStateLoaded.value) {
      const currentState = getCurrentGameState();
      console.log('新任务已获取，立即保存游戏状态:', currentState);
      saveGameState(currentState);
    }
  } catch (error) {
    console.error('获取任务失败:', error);
    currentQuest.value = '暂时无法获取任务，请稍后再试。';
    window.currentInventionSuggestions = [];
  }
};

// 组件挂载时加载游戏状态
onMounted(async () => {
  console.log('App组件已挂载，尝试加载游戏状态...');

  if (hasSavedGameState()) {
    const savedState = loadGameState();
    if (savedState) {
      console.log('=== 详细调试信息 ===');
      console.log('savedState.currentQuest:', savedState.currentQuest);
      console.log('savedState.inventionSuggestions:', savedState.inventionSuggestions);
      console.log('savedState完整内容:', JSON.stringify(savedState, null, 2));
      
      applyGameState(savedState);
      console.log('游戏状态已恢复:', savedState);
      
      // 如果有缓存的任务，恢复发明建议
      if (savedState.currentQuest && savedState.inventionSuggestions) {
        window.currentInventionSuggestions = savedState.inventionSuggestions;
        console.log('已从savedState恢复发明建议:', savedState.inventionSuggestions);
      }
    }
  } else {
    console.log('未找到保存的游戏状态，使用初始状态');
  }

  console.log('=== 任务缓存检查 ===');
  console.log('currentQuest.value:', currentQuest.value);
  console.log('currentQuest.value类型:', typeof currentQuest.value);
  console.log('currentQuest.value长度:', currentQuest.value?.length);
  
  // 改进的缓存机制：检查是否有游戏进度数据
  const hasGameProgress = historicalEvents.length > 0 || Object.keys(inventionResults).length > 2; // 初始有2个发明
  const hasValidQuest = currentQuest.value && currentQuest.value.trim() !== '' && currentQuest.value !== '天工正在思考新的机遇...';
  
  // 检查是否需要获取新任务
  if (!hasValidQuest && !hasGameProgress) {
    // 没有游戏进度和有效任务，获取新任务
    await getNewQuestTask();
  } else if (!hasValidQuest && hasGameProgress) {
    // 有游戏进度但缺少任务，尝试从localStorage恢复任务
    const savedState = loadGameState();
    if (savedState && savedState.currentQuest && savedState.currentQuest.trim() !== '') {
      currentQuest.value = savedState.currentQuest;
      if (savedState.inventionSuggestions) {
        window.currentInventionSuggestions = savedState.inventionSuggestions;
      }
    } else {
      // localStorage中也没有有效任务，获取新任务
      await getNewQuestTask();
    }
  } else {
    // 使用缓存的任务
    // 如果有缓存的任务但没有发明建议，尝试从保存的状态中恢复
    if (!window.currentInventionSuggestions || window.currentInventionSuggestions.length === 0) {
      const savedState = loadGameState();
      if (savedState && savedState.inventionSuggestions) {
        window.currentInventionSuggestions = savedState.inventionSuggestions;
      }
    }
  }

  gameStateLoaded.value = true;

  // 移除调试日志代码

  // 等待下一个tick后开始监听状态变化
  await nextTick();

  // 监听所有核心状态的变化，实时保存
  watch(
    [nationalPower, maxNationalPower, currentChapter, currentQuest, isInventing,
     () => [...historicalEvents],
     () => ({ ...inventionResults }),
     () => window.currentInventionSuggestions,
     () => [...questQueue],
     currentSubStageIndex],
    () => {
      if (gameStateLoaded.value) {
        const currentState = getCurrentGameState();
        console.log('检测到游戏状态变化，自动保存:', currentState);
        saveGameState(currentState);
      }
    },
    { deep: true }
  );
  
  // 在onMounted结束时，强制保存一次当前状态
  const finalState = getCurrentGameState();
  console.log('onMounted结束，强制保存最终状态:', finalState);
  saveGameState(finalState);
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
      @request-new-quest="handleRequestNewQuest"
    />

    <NarrativeDisplay :events="historicalEvents" />

    <!-- 游戏状态提示 -->
    <div v-if="gameStateLoaded" class="game-state-indicator">
      <span class="indicator-text">✅ 游戏进度已自动保存</span>
    </div>

    <!-- 移除调试面板 -->
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

/* 移除调试面板样式 */
</style>
