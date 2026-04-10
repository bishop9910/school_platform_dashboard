// src/api/auth.ts
import http from './index'
import type { LoginRequest, LoginResponseData, ApiResponse } from '@/types/models'

export const authApi = {
  // POST /app/auth/login
  login: (credentials: LoginRequest) => 
    http.post<ApiResponse<LoginResponseData>>('/auth/login', credentials),

  // POST /app/auth/refresh
  refresh: (refresh_token: string) =>
    http.post<ApiResponse<{ access_token: string; expires_in: number }>>('/auth/refresh', { refresh_token }),

  // POST /app/auth/register
  register: (data: { username: string; password: string; email: string }) =>
    http.post<ApiResponse<{ user_id: number; access_token: string; refresh_token: string }>>('/auth/register', data)
}