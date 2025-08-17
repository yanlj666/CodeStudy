<template>
  <ul class="quest-list">
    <li
      v-for="(quest, index) in quests"
      :key="quest.id || index"
      :class="['quest-item', quest.category ? `quest-${quest.category}` : '']"
    >
      <span class="category-icon" v-if="quest.category">{{ getIcon(quest.category) }}</span>
      <span class="quest-text">{{ quest.title || quest }}</span>
    </li>
  </ul>
</template>

<script setup>
defineProps({
  quests: {
    type: Array,
    default: () => []
  }
})

function getIcon(category) {
  if (category === 'luxury') {
    return '💎'
  }
  if (category === 'basic') {
    return '🔰'
  }
  return ''
}
</script>

<style scoped>
.quest-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.quest-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 4px;
}

.category-icon {
  margin-right: 8px;
}

.quest-text {
  flex: 1;
}
</style>
