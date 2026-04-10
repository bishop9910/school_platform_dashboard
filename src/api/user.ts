// src/api/user.ts
import http from './index'
import type { 
  PageParams, UserListItem, BanRequest, AdjustCreditRequest, 
  PageData, ApiResponse, CoinLogsData 
} from '@/types/models'

export const userApi = {
  // GET /app/user/list
  getList: (params: PageParams) =>
    http.get<ApiResponse<PageData<UserListItem>>>('/user/list', { params }),

  // POST /app/user/ban
  ban: (data: BanRequest) =>
    http.post<ApiResponse<{ user_id: number; is_prohibited: boolean; updated_at: string }>>('/user/ban', data),

  // POST /app/user/adjust-credit
  adjustCredit: (data: AdjustCreditRequest) =>
    http.post<ApiResponse<{ 
      user_id: number; 
      old_score: number; 
      new_score: number; 
      changed_by: number; 
      updated_at: string 
    }>>('/user/adjust-credit', data),

  // POST /app/user/adjust-coin
  adjustCoin: (data: AdjustCreditRequest & { reason?: string }) =>
    http.post<ApiResponse<{ 
      user_id: number; 
      old_coin: number; 
      new_coin: number; 
      changed: number; 
      operator_id: number; 
      updated_at: string 
    }>>('/user/adjust-coin', data),

  // POST /app/user/update-permission
  updatePermission: (data: { user_id: number; permission: 0 | 1 }) =>
    http.post<ApiResponse<{ 
      user_id: number; 
      old_permission: string; 
      new_permission: string; 
      changed_by: string; 
      updated_at: string 
    }>>('/user/update-permission', data),

  // GET /app/user/get-info
  getInfo: () =>
    http.get<ApiResponse<UserListItem>>('/user/get-info'),

  // POST /app/user/sign-in
  signIn: () =>
    http.get<ApiResponse<{ 
      user_id: number; 
      coin: number; 
      created_at: string 
    }>>('/user/check-in'),

  // POST /app/user/edit-other
  editOther: (data: { user_id: number; key: string; value: any }) =>
    http.post<ApiResponse<{ 
      user_id: number; 
      updated_at: string 
    }>>('/user/edit-other', data),

  // POST /app/user/edit
  edit: (data: { key: string; value: any }) =>
    http.post<ApiResponse<{ 
      user_id: number; 
      updated_at: string 
    }>>('/user/edit', data),

  // GET /app/user/coin-logs
  getCoinLogs: (params: PageParams & { user_id: number }) =>
    http.get<ApiResponse<CoinLogsData>>('/user/coin-logs', { params }),

  // GET /app/user/total-coin
  getTotalCoin: () =>
    http.get<ApiResponse<{ total_coin: number; updated_at: string }>>('/user/total-coin')
}