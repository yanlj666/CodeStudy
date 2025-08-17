/**
 * 游戏状态管理服务
 * 使用localStorage实现游戏进度的本地持久化
 */

import { storyline } from '../constants/storyline.js';

const GAME_STATE_KEY = 'hanInventor_gameState';

/**
 * 保存游戏状态到本地存储
 * @param {Object} state - 包含所有游戏核心数据的对象
 */
export function saveGameState(state) {
  try {
    const gameStateData = {
      nationalPower: state.nationalPower,
      maxNationalPower: state.maxNationalPower,
      currentChapter: state.currentChapter,
      historicalEvents: state.historicalEvents || [],
      inventionResults: state.inventionResults || {},
      currentQuest: state.currentQuest || '', // 保存当前任务
      inventionSuggestions: window.currentInventionSuggestions || [], // 保存发明建议
      isInventing: state.isInventing,
      timestamp: Date.now() // 添加时间戳用于调试
    };
    
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameStateData));
  } catch (error) {
    console.error('保存游戏状态失败:', error);
  }
}

/**
 * 从本地存储加载游戏状态
 * @returns {Object|null} 游戏状态对象，如果不存在则返回null
 */
export function loadGameState() {
  try {
    const savedState = localStorage.getItem(GAME_STATE_KEY);
    if (!savedState) {
      return null;
    }
    
    const gameState = JSON.parse(savedState);
    return gameState;
  } catch (error) {
    console.error('加载游戏状态失败:', error);
    return null;
  }
}

/**
 * 清除本地存储中的游戏状态
 */
export function clearGameState() {
  try {
    localStorage.removeItem(GAME_STATE_KEY);
  } catch (error) {
    console.error('清除游戏状态失败:', error);
  }
}

/**
 * 获取初始游戏状态
 * @returns {Object} 初始游戏状态对象
 */
export function getInitialGameState() {
  return {
    nationalPower: 0, // 修正初始值与App.vue保持一致
    maxNationalPower: 1000, // 修正初始值与App.vue保持一致
    currentChapter: '第一章：立足蜀中，获得信任', // 修正初始值与App.vue保持一致
    historicalEvents: [],
    inventionResults: {},
    questQueue: storyline[0].subStages[0].tasks,
    isInventing: false
  };
}

/**
 * 检查是否有保存的游戏状态
 * @returns {boolean} 如果有保存的状态返回true，否则返回false
 */
export function hasSavedGameState() {
  return localStorage.getItem(GAME_STATE_KEY) !== null;
}