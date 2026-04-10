<!-- src/App.vue -->
<script setup lang="ts">
/**
 * App.vue 是 Vue 应用的根组件
 * 负责：1. 渲染路由视图  2. 提供全局样式  3. 配置组件缓存策略
 * Pinia/VueRouter/ElementPlus 已在 main.ts 中全局注册，此处无需重复初始化
 */
import { ref } from 'vue'
import { useRoute } from 'vue-router'

// 动态获取当前路由名称，用于 keep-alive 缓存控制
const route = useRoute()
const keepAliveNames = ['UserManage', 'EntrustManage', 'PostManage']
</script>

<template>
  <!-- 路由视图出口 -->
  <router-view v-slot="{ Component }">
    <!-- keep-alive 缓存列表页状态（表单数据、滚动位置、分页等），切换路由时不丢失 -->
    <keep-alive :include="keepAliveNames">
      <component :is="Component" :key="route.fullPath" />
    </keep-alive>
  </router-view>
</template>

<style>
/* ================= 全局基础重置 ================= */
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 14px;
  height: 100%;
}

body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f7fa;
  color: #303133;
  line-height: 1.5;
}

#app {
  width: 100%;
  min-height: 100vh;
}

/* ================= 自定义滚动条 ================= */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
  transition: background 0.2s;
}
::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

/* ================= 全局元素覆盖 ================= */
a {
  color: #409eff;
  text-decoration: none;
}
a:hover {
  color: #66b1ff;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
}

/* Element Plus 全局微调 */
.el-button {
  font-weight: 500;
}
.el-table th {
  background-color: #fafafa !important;
}
</style>