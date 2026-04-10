import type { CreditScoreLevel, Gender, Permission } from './enums'

// 通用 API 响应（对齐 handlers.ErrorResponse / success 包装

/**
 * 通用 API 响应结构（严格对齐 Swagger handlers.*Response）
 * 后端格式: { success: boolean, message: string, data: T, total?: number, page?: number, error?: string }
 */
export interface ApiResponseData<T = any> {
  success: boolean
  message: string
  data: T  // 👈 直接是业务数据，不是 { data: T }
  total?: number
  page?: number
  error?: string
}

export type ApiResponse<T = any> = ApiResponseData<T> & Partial<T>

/**
 * 分页列表响应包装（用于 list 接口）
 * 后端格式: { users: T[], total: number, page: number }
 */
export interface PageData<T> {
  users?: T[]        // 用户列表专用
  data?: T[]         // 通用列表
  total: number
  page: number
}

/**
 * 分页 API 响应（组合使用）
 * 用法: ApiResponse<PageData<UserListItem>>
 */
export type PageResponse<T> = ApiResponse<PageData<T>>

// 分页参数
export interface PageParams {
  page: number
  page_size: number
}

// 登录请求/响应（对齐 handlers.LoginRequest / LoginResponseData）
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponseData {
  access_token: string
  refresh_token: string
  expires_in: number  // 秒
}

// 用户列表项（对齐 handlers.UserListItem）
export interface UserListItem {
  id: number
  username: string
  nickname: string
  email: string
  gender: Gender | 'male' | 'female' | 'unknown'  // 后端返回 string，前端统一转 enum
  permission: 'normal' | 'admin'
  credit_score: number
  credit_coin: number
  is_prohibited: boolean
  avatar: string  // 相对路径，如 "/avatars/xxx.png"
  birth: string   // ISO 8601
  signature: string
  created_at: string
  updated_at: string
}

// 封禁请求（对齐 handlers.BanRequest）
export interface BanRequest {
  user_id: number
  is_prohibited: boolean
  reason?: string
}

// 调整信用分/金币（对齐 AdjustCreditScoreRequest / AdjustCreditCoinRequest）
export interface AdjustCreditRequest {
  user_id: number
  amount: number  // >0 增加，<0 减少
  reason?: string // 仅金币调整可选
}

// 委托基础信息（对齐 models.CommunityEntrust）
export interface EntrustItem {
  id: number
  user_id: number
  acceptor_id?: number
  title: string
  content: string
  credit_coin: number
  allowed_credit_score_level: CreditScoreLevel
  over_time: string  // ISO 8601
  is_progressing: boolean
  is_over: boolean
  is_expired: boolean
  like_count: number
  create_time: string
  images: Array<{ id: number; image_url: string }>
  author?: { id: number; nick_name: string; avatar: string }  // 列表接口嵌套
}

// 帖子基础信息（对齐 models.CommunityPost）
export interface PostItem {
  id: number
  user_id: number
  title: string
  content: string
  like_count: number
  create_time: string
  images: Array<{ id: number; image_url: string }>
  author?: { id: number; nick_name: string; avatar: string }
}

// 评论项（委托/帖子通用）
export interface CommentItem {
  id: number
  content: string
  like_count: number
  user_id: number
  created_at: string
  author?: { id: number; nick_name: string; avatar: string }
}

// 帖子图片（对齐 models.CommunityPostImage）
export interface PostImage {
  id: number
  post_id: number
  image_url: string  // 相对路径，如 "/posts/xxx.jpg"
}

// 委托图片（对齐 models.CommunityEntrustImage）
export interface EntrustImage {
  id: number
  entrust_id: number
  image_url: string
}

// 二维码信息（对齐 models.CommunityEntrustQRCode）
export interface QRCodeInfo {
  id: number
  entrust_id: number
  token: string
  create_time: string
  is_used: boolean
}

// 作者基础信息（对齐 handlers.AuthorBase）
export interface AuthorBase {
  id: number
  nick_name: string
  avatar: string  // 相对路径
}

// 带作者的委托/帖子（列表接口返回格式）
export interface EntrustWithAuthor {
  entrust: EntrustItem
  author: AuthorBase
}

export interface PostWithAuthor {
  post: PostItem
  author: AuthorBase
}

// 带作者的评论

// 金币日志项（对齐 handlers.CoinLogItem）
export interface CoinLogItem {
  id: number
  change_amount: number // +增加/-减少
  balance_after: number // 变动后余额
  reason: string // 变动原因
  operator_id: number // 0=系统，>0=管理员ID
  created_at: string // ISO 8601
}

// 金币日志数据（对齐 handlers.CoinLogsData）
export interface CoinLogsData {
  logs: CoinLogItem[]
  page: number
  total: number
}
export interface CommentWithAuthor {
  comment: CommentItem
  author: AuthorBase
}