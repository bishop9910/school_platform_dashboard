import http from './index'
import type { 
  PageParams, PostItem, CommentItem, 
  ApiResponse, 
  PostWithAuthor,
  CommentWithAuthor
} from '@/types/models'

export const postApi = {
  // ========== 帖子基础操作 ==========
  
  // GET /app/post/list
  getList: (params: PageParams) =>
    http.get<ApiResponse<{ 
      data: PostWithAuthor[]; 
      total: number; 
      page: number 
    }>>('/post/list', { params }),

  // GET /app/post/{post_id}
  getById: (post_id: number) =>
    http.get<ApiResponse<{ data: PostItem }>>(`/post/${post_id}`),

  // POST /app/post/new
  create: (data: { title: string; content: string }) =>
    http.post<ApiResponse<{ data: { post_id: number } }>>('/post/new', data),

  // PATCH /app/post/{post_id}
  update: (post_id: number, data: Partial<{ title: string; content: string }>) =>
    http.patch<ApiResponse<{ data: { post_id: number; updated_at: string } }>>(`/post/${post_id}`, data),

  // POST /app/post/delete
  delete: (post_id: number) =>
    http.post<ApiResponse<{}>>('/post/delete', { post_id }),

  // ========== 点赞相关 ==========
  
  like: (post_id: number) => 
    http.post<ApiResponse<{}>>('/post/like', { post_id }),
  
  unlike: (post_id: number) => 
    http.post<ApiResponse<{}>>('/post/unlike', { post_id }),
  
  checkLikeStatus: (post_id: number) =>
    http.get<ApiResponse<{ data: { is_liked: boolean } }>>(`/post/like/status?post_id=${post_id}`),

  // ========== 评论相关 ==========
  
  getComments: (post_id: number, params: PageParams) =>
    http.get<ApiResponse<{ 
      data: CommentWithAuthor[]; 
      total: number; 
      page: number 
    }>>(`/post/comment?post_id=${post_id}`, { params }),
  
  addComment: (post_id: number, content: string) =>
    http.post<ApiResponse<{}>>('/post/comment', { post_id, content }),
  
  deleteComment: (comment_id: number) =>
    http.post<ApiResponse<{}>>('/post/comment/delete', { comment_id }),

  // 获取所有帖子评论列表
  getCommentsList: (params: PageParams) =>
    http.get<ApiResponse<{ data: CommentWithAuthor[]; total: number; page: number }>>('/post/comment', { params }),
  
  likeComment: (comment_id: number) =>
    http.post<ApiResponse<{}>>('/post/comment/like', { comment_id }),
  
  unlikeComment: (comment_id: number) =>
    http.post<ApiResponse<{}>>('/post/comment/unlike', { comment_id }),
  
  checkCommentLikeStatus: (comment_id: number) =>
    http.get<ApiResponse<{ data: { is_liked: boolean } }>>(`/post/comment/like/status?comment_id=${comment_id}`),

  // ========== 图片管理 ==========
  
  uploadImage: (post_id: number, file: File) => {
    const formData = new FormData()
    formData.append('post_id', String(post_id))
    formData.append('image', file) // 字段名必须为 'image'
    return http.post<ApiResponse<{ message: string }>>('/uploads/post', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  deleteImage: (image_id: number) =>
    http.post<ApiResponse<{}>>('/post/image/delete', { image_id }),

  // ========== 用户帖子 ==========
  
  getByUser: (user_id: number, params: PageParams) =>
    http.get<ApiResponse<{ 
      data: PostItem[]; 
      total: number; 
      page: number 
    }>>(`/user/${user_id}/posts`, { params })
}