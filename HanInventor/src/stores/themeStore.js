import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref('day')
  function toggleTheme() {
    currentTheme.value = currentTheme.value === 'day' ? 'night' : 'day'
  }
  return { currentTheme, toggleTheme }
})
