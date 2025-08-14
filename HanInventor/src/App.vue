<template>
  <div id="game-container">
    <header class="status-area">
      <StatusDisplay 
        :currentChapter="currentChapter"
        :nationalPower="nationalPower"
        :maxNationalPower="maxNationalPower"
      />
    </header>
    
    <main class="workbench-area">
      <InventionWorkbench />
    </main>
    
    <aside class="narrative-area">
      <NarrativeDisplay :events="historicalEvents" />
    </aside>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import StatusDisplay from './components/StatusDisplay.vue'
import InventionWorkbench from './components/InventionWorkbench.vue'
import NarrativeDisplay from './components/NarrativeDisplay.vue'

// 全局状态管理
const currentChapter = ref('第一章：获得信任')
const nationalPower = ref(0)
const maxNationalPower = ref(1000)
const historicalEvents = ref([])
</script>