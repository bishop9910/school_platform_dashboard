import http from './index'
import type { PageParams, EntrustItem, CommentItem, ApiResponse, EntrustWithAuthor, CommentWithAuthor } from '@/types/models'

export const entrustApi = {
  // GET /app/entrust/list
  getList: (params: PageParams) =>
    http.get<ApiResponse<{ data: EntrustWithAuthor[]; total: number; page: number }>>('/entrust/list', { params }),

  // GET /app/entrust/{id}
  getById: (entrust_id: number) =>
    http.get<ApiResponse<{ data: EntrustWithAuthor }>>(`/entrust/${entrust_id}`),

  // POST /app/entrust/new（发布委托）
  create: (data: { title: string; content: string; coin: number; allowed_credit_score_level: number; over_time: string }) =>
    http.post<ApiResponse<{ data: { entrust_id: number } }>>('/entrust/new', data),

  // PATCH /app/entrust/{id}（修改委托）
  update: (entrust_id: number, data: Partial<{ title: string; content: string; coin: number; allowed_credit_score_level: number; over_time: string }>) =>
    http.patch<ApiResponse<{ data: { entrust_id: number; updated_at: string } }>>(`/entrust/${entrust_id}`, data),

  // POST /app/entrust/delete
  delete: (entrust_id: number) =>
    http.post<ApiResponse<{}>>('/entrust/delete', { entrust_id }),

  // POST /app/entrust/accept（接受委托）
  accept: (entrust_id: number) =>
    http.post<ApiResponse<{ data: { id: number; entrust_id: number; token: string; create_time: string; is_used: boolean } }>>('/entrust/accept', { entrust_id }),

  // POST /app/entrust/like & unlike
  like: (entrust_id: number) => http.post<ApiResponse<{}>>('/entrust/like', { entrust_id }),
  unlike: (entrust_id: number) => http.post<ApiResponse<{}>>('/entrust/unlike', { entrust_id }),
  checkLikeStatus: (entrust_id: number) => 
    http.get<ApiResponse<{ data: { is_liked: boolean } }>>(`/entrust/like/status?entrust_id=${entrust_id}`),

  // 评论相关
  getComments: (entrust_id: number, params: PageParams) =>
    http.get<ApiResponse<{ data: CommentWithAuthor[]; total: number; page: number }>>(`/entrust/comment?entrust_id=${entrust_id}`, { params }),
  addComment: (entrust_id: number, content: string) =>
    http.post<ApiResponse<{}>>('/entrust/comment', { entrust_id, content }),
  deleteComment: (comment_id: number) =>
    http.post<ApiResponse<{}>>('/entrust/comment/delete', { comment_id }),
  likeComment: (comment_id: number) =>
    http.post<ApiResponse<{}>>('/entrust/comment/like', { comment_id }),
  unlikeComment: (comment_id: number) =>
    http.post<ApiResponse<{}>>('/entrust/comment/unlike', { comment_id }),

  // 图片管理
  uploadImage: (entrust_id: number, file: File) => {
    const formData = new FormData()
    formData.append('entrust_id', String(entrust_id))
    formData.append('image', file)
    return http.post<ApiResponse<{ message: string }>>('/uploads/entrust', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  deleteImage: (image_id: number) =>
    http.post<ApiResponse<{}>>('/entrust/image/delete', { image_id }),

  // 获取所有委托评论列表
  getCommentsList: (params: PageParams) =>
    http.get<ApiResponse<{ data: CommentWithAuthor[]; total: number; page: number }>>('/entrust/comment', { params })
}