// 统一分页响应包装
export interface PageResponse<T> {
  page: number
  total: number
  data: T[]
}

// 文件上传响应
export interface UploadResponse {
  success: boolean
  message: string
  data?: {
    url: string  // 如 "/entrusts/xxx.jpg"
    filename: string
  }
}