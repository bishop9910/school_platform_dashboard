<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

const activeMenu = computed(() => route.path)

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <el-container class="layout">
    <el-aside width="200px">
      <el-menu :default-active="activeMenu" router background-color="#304156" text-color="#fff" active-text-color="#409EFF">
        <el-menu-item index="/dashboard"><el-icon><DataAnalysis /></el-icon> 数据看板</el-menu-item>
        <el-menu-item index="/users"><el-icon><User /></el-icon> 用户管理</el-menu-item>
        <el-menu-item index="/entrusts"><el-icon><DocumentChecked /></el-icon> 委托管理</el-menu-item>
        <el-menu-item index="/posts"><el-icon><Document /></el-icon> 帖子管理</el-menu-item>
        <el-menu-item index="/comments"><el-icon><ChatDotRound /></el-icon> 评论管理</el-menu-item>
        <el-menu-item index="/coin-logs"><el-icon><Coin /></el-icon> 金币日志</el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <span>管理员后台</span>
        <el-button type="danger" @click="handleLogout">退出登录</el-button>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout { height: 100vh; }
.header { display: flex; justify-content: space-between; align-items: center; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.1); }
</style>