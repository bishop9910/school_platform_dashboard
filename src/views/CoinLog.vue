<template>
  <div class="coin-log">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span><el-icon><Coin /></el-icon> 金币日志管理</span>
        </div>
      </template>
      
      <!-- 用户选择 -->
      <div class="user-select">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="选择用户">
            <el-select 
              v-model="searchForm.userId" 
              placeholder="请选择用户" 
              style="width: 200px"
              @change="fetchCoinLogs"
            >
              <el-option 
                v-for="user in users" 
                :key="user.id" 
                :label="user.username" 
                :value="user.id"
              >
                <div class="option-content">
                  <img 
                    :src="uploadApi.getImageUrl(user.avatar, 'avatar')" 
                    :alt="user.username" 
                    class="user-avatar"
                  />
                  <span>{{ user.username }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 金币日志表格 -->
      <el-table :data="logs" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="变动金额" width="120">
          <template #default="scope">
            <span :class="scope.row.change_amount > 0 ? 'text-green' : 'text-red'">
              {{ scope.row.change_amount > 0 ? '+' : '' }}{{ scope.row.change_amount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="balance_after" label="变动后余额" width="120" />
        <el-table-column prop="reason" label="变动原因" />
        <el-table-column label="操作人" width="120">
          <template #default="scope">
            {{ scope.row.operator_id === 0 ? '系统' : (admins.get(scope.row.operator_id) || `管理员 ${scope.row.operator_id}`) }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="操作时间" width="180" />
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pageParams.page"
          v-model:page-size="pageParams.page_size"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import { userApi } from '@/api/user'
import { uploadApi } from '@/api/upload'
import type { UserListItem, CoinLogItem, PageParams } from '@/types/models'

// 搜索表单
const searchForm = ref({
  userId: 0
})

// 分页参数
const pageParams = ref<PageParams>({
  page: 1,
  page_size: 20
})

// 数据
const users = ref<UserListItem[]>([])
const admins = ref<Map<number, string>>(new Map())
const logs = ref<CoinLogItem[]>([])
const total = ref(0)
const loading = ref(false)

// 加载用户列表
const fetchUsers = async () => {
  try {
    loading.value = true
    const res = await userApi.getList({ page: 1, page_size: 1000 })
    users.value = res.data.data.users || []
    
    // 构建管理员映射
    const adminMap = new Map<number, string>()
    users.value.forEach(user => {
      if (user.permission === 'admin') {
        adminMap.set(user.id, user.nickname || user.username || `管理员 ${user.id}`)
      }
    })
    admins.value = adminMap
  } catch (error) {
    console.error('Failed to fetch users', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 加载金币日志
const fetchCoinLogs = async () => {
  if (!searchForm.value.userId) {
    logs.value = []
    total.value = 0
    return
  }
  
  try {
    loading.value = true
    const res = await userApi.getCoinLogs({
      ...pageParams.value,
      user_id: searchForm.value.userId
    })
    logs.value = res.data.data.logs || []
    total.value = res.data.data.total || 0
  } catch (error) {
    console.error('Failed to fetch coin logs', error)
    ElMessage.error('获取金币日志失败')
  } finally {
    loading.value = false
  }
}

// 分页处理
const handleSizeChange = (size: number) => {
  pageParams.value.page_size = size
  fetchCoinLogs()
}

const handleCurrentChange = (current: number) => {
  pageParams.value.page = current
  fetchCoinLogs()
}

// 初始化
onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.coin-log {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-select {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.text-green {
  color: #67c23a;
}

.text-red {
  color: #f56c6c;
}

.option-content {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 8px;
}
</style>