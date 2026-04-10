// src/stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import { userApi } from '@/api/user'
import type { LoginRequest, UserListItem, ApiResponse } from '@/types/models'
import { ElMessage } from 'element-plus'
import { Permission } from '@/types/enums'
import router from '@/router'

export const useUserStore = defineStore('user', () => {
  // 状态
  const accessToken = ref<string>(localStorage.getItem('access_token') || '')
  const refreshToken = ref<string>(localStorage.getItem('refresh_token') || '')
  const expiresAt = ref<number>(Number(localStorage.getItem('token_expires_at')) || 0)
  const userInfo = ref<UserListItem | null>(localStorage.getItem('user_info') ? JSON.parse(localStorage.getItem('user_info')!) : null)

  // 计算属性
  const isLoggedIn = computed(() => !!accessToken.value)
  const isAdmin = computed(() => {
    const perm = userInfo.value?.permission
    // console.log(userInfo.value)
    return perm === 'admin'
  })

  // 方法
  const setTokens = (access: string, refresh: string, expiresIn: number) => {
    accessToken.value = access
    refreshToken.value = refresh
    expiresAt.value = Date.now() + expiresIn * 1000
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    localStorage.setItem('token_expires_at', String(expiresAt.value))
  }

  const login = async (credentials: LoginRequest) => {
    const res = await authApi.login(credentials)
    const { access_token, refresh_token, expires_in } = res.data.data
    setTokens(access_token, refresh_token, expires_in)
    await fetchInfo()
    ElMessage.success('登录成功')
  }

  const fetchInfo = async () => {
    try {
      const res = await userApi.getInfo()
      console.log('User info response:', res)
      userInfo.value = res.data.data
      localStorage.setItem('user_info', JSON.stringify(userInfo.value))
    } catch (e) {
      console.error('Failed to fetch user info', e)
      ElMessage.error('获取用户信息失败')
    }
  }

  const logout = () => {
    accessToken.value = ''
    refreshToken.value = ''
    expiresAt.value = 0
    userInfo.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('token_expires_at')
    localStorage.removeItem('user_info')
    router.push('/login')
  }

  const refreshUser = async () => {
    if (isLoggedIn.value) {
      await fetchInfo()
    }
  }

  return {
    accessToken,
    refreshToken,
    expiresAt,
    userInfo,
    isLoggedIn,
    isAdmin,
    login,
    logout,
    fetchInfo,
    refreshUser,
    setTokens
  }
})