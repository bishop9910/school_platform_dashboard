<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue' // 👈 关键：导入图标组件
import type { LoginRequest } from '@/types/models'

const form = ref<LoginRequest>({ username: '', password: '' })
const loading = ref(false)
const router = useRouter()
const userStore = useUserStore()

const handleLogin = async () => {
  if (!form.value.username || !form.value.password) {
    return ElMessage.warning('请输入用户名和密码')
  }
  loading.value = true
  try {
    await userStore.login(form.value)
    router.push('/dashboard')
  } catch {
    // 错误已在 axios 拦截器中提示
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <el-card class="login-card" shadow="always">
      <template #header>
        <div class="card-header"><h2><el-icon><Lock /></el-icon> 学校平台管理后台</h2></div>
      </template>
      <el-form :model="form" @submit.prevent="handleLogin" label-position="top">
        <el-form-item label="用户名">
          <!-- 👇 使用 v-bind 传入组件 -->
          <el-input v-model="form.username" placeholder="请输入用户名" size="large" :prefix-icon="User" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="请输入密码" 
            size="large" 
            :prefix-icon="Lock" 
            show-password 
            @keyup.enter="handleLogin" 
          />
        </el-form-item>
        <el-button type="primary" @click="handleLogin" :loading="loading" size="large" style="width: 100%">
          登 录
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.login-container {
  display: flex; justify-content: center; align-items: center; min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card { width: 420px; padding: 20px; }
.card-header { text-align: center; color: #303133; font-weight: 600; }
</style>