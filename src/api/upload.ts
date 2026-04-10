import http from './index'
import type { ApiResponse } from '@/types/models'

export interface UploadResult {
  url: string      // 如 "/avatars/xxx.png"
  filename: string // 原始文件名
}

export const uploadApi = {
  // 上传个人头像 - POST /app/uploads/avatar
  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file) // 字段名必须为 'avatar'
    return http.post<ApiResponse<{ data: { url: string } }>>('/uploads/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // 管理员上传他人头像 - POST /app/uploads/avatar-other
  uploadAvatarForUser: (user_id: number, file: File) => {
    const formData = new FormData()
    formData.append('user_id', String(user_id))
    formData.append('avatar', file)
    return http.post<ApiResponse<{ data: { url: string } }>>('/uploads/avatar-other', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // 获取图片完整URL（拼接后端静态文件前缀）
  getImageUrl: (path: string, type: 'avatar' | 'entrust' | 'post') => {
    const baseUrl = 'http://localhost:8080/app'
    const prefix = {
      avatar: '/files/avatar',
      entrust: '/files/entrust',
      post: '/files/post'
    }[type]
    // 如果path已经是完整路径则直接返回
    if (path.startsWith('http')) return path
    // 确保baseUrl以/结尾
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
    // 如果path已经包含了前缀，则直接使用path
    if (path.startsWith(prefix)) return `${normalizedBaseUrl}${path.replace(/^\//, '')}`
    // 否则添加前缀
    return `${normalizedBaseUrl}${prefix.replace(/^\//, '')}/${path.replace(/^\//, '')}`
  }
}