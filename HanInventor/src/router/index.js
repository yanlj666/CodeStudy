import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue' // 导入 App.vue 组件

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: App // 将根路径指向 App.vue
    }
  ],
})

export default router
