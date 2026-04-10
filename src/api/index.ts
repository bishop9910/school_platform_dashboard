// src/api/index.ts
import axios, { 
  type AxiosInstance, 
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type AxiosError
} from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { useUserStore } from '@/stores/user'
import type { ApiResponse } from '@/types/models'

const http: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8080/app',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

// 请求拦截
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userStore = useUserStore()
    const token = userStore.accessToken
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

// Token 刷新队列
let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb)
}
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token))
  refreshSubscribers = []
}

// 响应拦截器：处理错误和成功响应
http.interceptors.response.use(
  (res: AxiosResponse<ApiResponse>) => {
    return res
  },
  
  async (err: AxiosError<ApiResponse>) => {
    const { response, config } = err
    const userStore = useUserStore()

    // 401: Token 过期
    if (response?.status === 401) {
      if (config?.url?.includes('/auth/refresh')) {
        userStore.logout()
        router.replace('/login')
        return Promise.reject(err)
      }

      if (!isRefreshing) {
        isRefreshing = true
        try {
          const refreshToken = userStore.refreshToken
          if (!refreshToken) throw new Error('No refresh token')

          const { data } = await axios.post<ApiResponse<{ access_token: string; expires_in: number }>>(
            `${http.defaults.baseURL}/auth/refresh`,
            { refresh_token: refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          )

          if (data.success && data.data.access_token) {
            userStore.setTokens(data.data.access_token, refreshToken, data.data.expires_in)
            onRefreshed(data.data.access_token)
            if (config) {
              config.headers = config.headers || {}
              config.headers.Authorization = `Bearer ${data.data.access_token}`
              return http(config)
            }
          }
        } catch (refreshErr) {
          console.error('Token refresh failed:', refreshErr)
          userStore.logout()
          router.replace('/login')
          ElMessage.error('登录已过期，请重新登录')
        } finally {
          isRefreshing = false
        }
      }

      // 队列重试
      return new Promise<ApiResponse>((resolve) => {
        subscribeTokenRefresh((newToken: string) => {
          if (config) {
            config.headers = config.headers || {}
            config.headers.Authorization = `Bearer ${newToken}`
            resolve(http(config))
          }
        })
      })
    }

    // 其他错误
    const msg = response?.data?.error || response?.data?.message || '网络异常'
    ElMessage.error(msg)
    return Promise.reject(err)
  }
)

export default http