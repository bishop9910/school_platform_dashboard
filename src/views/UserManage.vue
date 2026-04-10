<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { userApi } from '@/api/user'
import { authApi } from '@/api/auth'
import type { UserListItem, PageParams, BanRequest, AdjustCreditRequest } from '@/types/models'
import { CreditLevelMap, GenderMap, PermissionMap } from '@/types/enums'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

// 状态
const tableData = ref<UserListItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const search = ref('')  // 👈 搜索关键词
const userStore = useUserStore()

// 编辑用户
const editDialogVisible = ref(false)
const currentEditUser = ref<UserListItem | null>(null)
const editForm = ref({
  nickname: '',
  email: '',
  gender: 0
})

// 注册用户
const registerDialogVisible = ref(false)
const registerForm = ref({
  username: '',
  password: '',
  email: ''
})

// 👇 关键：计算属性实现前端搜索过滤（响应式 + 高性能）
const filteredTableData = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  if (!keyword) return tableData.value
  
  return tableData.value.filter(user => 
    user.username.toLowerCase().includes(keyword) ||
    user.nickname?.toLowerCase().includes(keyword) ||
    user.email?.toLowerCase().includes(keyword)
  )
})

// 获取用户列表（从后端）
const fetchUsers = async () => {
  loading.value = true
  try {
    const params: PageParams = { 
      page: page.value, 
      page_size: pageSize.value 
    }
    const res = await userApi.getList(params)
    
    // 👇 关键修正1: 用户列表返回结构特殊，data 内嵌套 users 数组
    tableData.value = res.data.data.users || []
    total.value = res.data.data.total
    page.value = res.data.data.page
    
  } catch (e: any) {
    console.error('Failed to fetch users', e)
    ElMessage.error(e.message || '加载用户列表失败')
  } finally {
    loading.value = false
  }
}

// 👇 搜索时重置到第一页 + 重新过滤（computed 自动生效）
const handleSearch = () => {
  page.value = 1
  // computed 会自动响应 search 变化，无需手动过滤
}

// 封禁/解封用户
const handleBan = async (user: UserListItem) => {
  try {
    const action = user.is_prohibited ? '解封' : '封禁'
    await ElMessageBox.confirm(
      `确认${action}用户 "${user.username}" 吗？`,
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    const req: BanRequest = {
      user_id: user.id,
      is_prohibited: !user.is_prohibited,
      reason: `管理员 ${userStore.userInfo?.username} 操作`
    }
    await userApi.ban(req)
    ElMessage.success(`${action}成功`)
    fetchUsers()  // 重新拉取最新数据
  } catch { /* 取消操作 */ }
}

// 调整信用分
const handleAdjustCredit = async (user: UserListItem) => {
  try {
    const amount = await ElMessageBox.prompt('请输入调整数值（正数加分，负数减分）', '调整信用分', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^-?\d+$/,
      inputErrorMessage: '请输入整数'
    })
    const req: AdjustCreditRequest = {
      user_id: user.id,
      amount: parseInt(amount.value, 10)
    }
    await userApi.adjustCredit(req)
    ElMessage.success('信用分调整成功')
    fetchUsers()
  } catch { /* 取消 */ }
}

// 调整金币（带原因）
const handleAdjustCoin = async (user: UserListItem) => {
  try {
    const { value: amount } = await ElMessageBox.prompt('请输入金币调整数值', '调整金币', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^-?\d+$/,
      inputErrorMessage: '请输入整数'
    })
    const { value: reason } = await ElMessageBox.prompt('请输入调整原因（用于日志）', '调整原因', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: '管理员操作'
    })
    await userApi.adjustCoin({
      user_id: user.id,
      amount: parseInt(amount, 10),
      reason
    })
    ElMessage.success('金币调整成功')
    fetchUsers()
  } catch { /* 取消 */ }
}

// 修改权限（仅超级管理员可见）
const handleUpdatePermission = async (user: UserListItem) => {
  if (!userStore.isAdmin) return ElMessage.warning('仅超级管理员可操作')
  try {
    const newPerm = user.permission === "normal" ? 1 : 0
    const label = newPerm === 1 ? '设为管理员' : '设为普通用户'
    await ElMessageBox.confirm(`确认将 "${user.username}" ${label} 吗？`, '权限变更', { type: 'warning' })
    await userApi.updatePermission({ user_id: user.id, permission: newPerm })
    ElMessage.success('权限更新成功')
    fetchUsers()
  } catch { /* 取消 */ }
}

// 用户签到
const handleSignIn = async (user: UserListItem) => {
  try {
    await ElMessageBox.confirm(`确认给用户 "${user.username}" 签到吗？`, '签到操作', { type: 'info' })
    const res = await userApi.signIn()
    ElMessage.success(`${res.data.message}`)
    fetchUsers()
  } catch { /* 取消 */ }
}

// 编辑用户
const handleEdit = (user: UserListItem) => {
  currentEditUser.value = user
  editForm.value = {
    nickname: user.nickname || '',
    email: user.email || '',
    gender: typeof user.gender === 'string' ? parseInt(user.gender, 10) : (user.gender || 0)
  }
  editDialogVisible.value = true
}

// 保存编辑
const saveEdit = async () => {
  if (!currentEditUser.value) return
  try {
    const isSelf = currentEditUser.value.id === userStore.userInfo?.id
    
    // 分别更新每个字段
    if (editForm.value.nickname !== currentEditUser.value.nickname) {
      if (isSelf) {
        await userApi.edit({ key: 'nickname', value: editForm.value.nickname })
      } else {
        await userApi.editOther({ user_id: currentEditUser.value.id, key: 'nickname', value: editForm.value.nickname })
      }
    }
    
    if (editForm.value.email !== currentEditUser.value.email) {
      if (isSelf) {
        await userApi.edit({ key: 'email', value: editForm.value.email })
      } else {
        await userApi.editOther({ user_id: currentEditUser.value.id, key: 'email', value: editForm.value.email })
      }
    }
    
    // 处理性别值，转换为字符串
    let genderValue = ''
    if (editForm.value.gender === 1) {
      genderValue = 'male'
    } else if (editForm.value.gender === 2) {
      genderValue = 'female'
    } else {
      genderValue = 'unknown'
    }
    
    // 获取当前用户的性别字符串
    const currentGenderStr = typeof currentEditUser.value.gender === 'string' ? currentEditUser.value.gender : 
      (currentEditUser.value.gender === 1 ? 'male' : 
       (currentEditUser.value.gender === 2 ? 'female' : 'unknown'))
    
    if (genderValue !== currentGenderStr) {
      if (isSelf) {
        await userApi.edit({ key: 'gender', value: genderValue })
      } else {
        await userApi.editOther({ user_id: currentEditUser.value.id, key: 'gender', value: genderValue })
      }
    }
    
    ElMessage.success('编辑成功')
    editDialogVisible.value = false
    fetchUsers()
  } catch (error) {
    console.error('Failed to edit user', error)
    ElMessage.error('编辑失败')
  }
}

// 性别处理函数
const getGenderType = (gender: any) => {
  if (gender === 2 || gender === 'female') return 'danger'
  if (gender === 1 || gender === 'male') return 'primary'
  return 'info'
}

const getGenderText = (gender: any) => {
  if (gender === 1 || gender === 'male') return '男'
  if (gender === 2 || gender === 'female') return '女'
  return '未知'
}

// 权限处理函数
const getPermissionType = (permission: any) => {
  if (permission === 1 || permission === 'admin') return 'success'
  return 'info'
}

const getPermissionText = (permission: any) => {
  if (permission === 1 || permission === 'admin') return '管理员'
  return '普通用户'
}

// 注册用户
const handleRegister = () => {
  registerDialogVisible.value = true
  registerForm.value = {
    username: '',
    password: '',
    email: ''
  }
}

const saveRegister = async () => {
  try {
    await authApi.register(registerForm.value)
    ElMessage.success('注册成功')
    registerDialogVisible.value = false
    fetchUsers()
  } catch (error) {
    console.error('Failed to register user', error)
    ElMessage.error('注册失败')
  }
}

onMounted(fetchUsers)
</script>

<template>
  <el-card class="user-manage">
    <template #header>
      <div class="card-header">
        <h3><el-icon><User /></el-icon> 用户管理</h3>
        <div class="header-actions">
          <el-button type="primary" @click="handleRegister">
            <el-icon><Plus /></el-icon> 注册用户
          </el-button>
          <el-input 
            v-model="search" 
            placeholder="搜索用户名/昵称/邮箱" 
            style="width: 240px; margin-left: 10px" 
            clearable 
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </div>
      </div>
    </template>

    <el-table 
      :data="filteredTableData"
      v-loading="loading" 
      border 
      style="width: 100%"
      row-key="id"
    >
      <el-table-column prop="id" label="ID" width="70" sortable />
      <el-table-column prop="username" label="用户名" min-width="120" />
      <el-table-column prop="nickname" label="昵称" width="100" />
      
      <el-table-column label="性别" width="70">
        <template #default="{ row }">
          <el-tag size="small" :type="getGenderType(row.gender)">
            {{ getGenderText(row.gender) }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column label="权限" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="getPermissionType(row.permission)">
            {{ getPermissionText(row.permission) }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column label="信用分" width="90" sortable>
        <template #default="{ row }">
          <el-tag :type="CreditLevelMap[row.credit_score >= 80 ? 2 : row.credit_score >= 50 ? 1 : 0]?.type">
            {{ row.credit_score }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="credit_coin" label="金币" width="80" sortable />
      
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.is_prohibited ? 'danger' : 'success'" size="small">
            {{ row.is_prohibited ? '已封禁' : '正常' }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
      <el-table-column prop="created_at" label="注册时间" width="160" sortable />

      <el-table-column label="操作" width="400" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" @click="handleBan(row)">
            {{ row.is_prohibited ? '解封' : '封禁' }}
          </el-button>
          <el-button size="small" type="primary" @click="handleSignIn(row)" v-if="row.id === userStore.userInfo?.id">签到</el-button>
          <el-button size="small" type="warning" @click="handleAdjustCredit(row)">信用分</el-button>
          <el-button size="small" type="success" @click="handleAdjustCoin(row)">金币</el-button>
          <el-button 
            v-if="userStore.isAdmin" 
            size="small" 
            type="danger" 
            @click="handleUpdatePermission(row)"
          >
            {{ row.permission === "admin" ? '降级' : '提权' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @current-change="fetchUsers"
      @size-change="fetchUsers"
      style="margin-top: 16px; justify-content: flex-end"
    />
  </el-card>
  <!-- 编辑用户弹窗 -->
  <el-dialog 
    v-model="editDialogVisible" 
    :title="currentEditUser && currentEditUser.id === userStore.userInfo?.id ? '编辑自己' : '编辑用户'" 
    width="500px" 
    destroy-on-close
  >
    <el-form :model="editForm" label-width="80px">
      <el-form-item label="昵称">
        <el-input v-model="editForm.nickname" placeholder="请输入昵称" />
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="editForm.email" placeholder="请输入邮箱" />
      </el-form-item>
      <el-form-item label="性别">
        <el-select v-model="editForm.gender" placeholder="请选择性别">
          <el-option label="未知" :value="0" />
          <el-option label="男" :value="1" />
          <el-option label="女" :value="2" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 注册用户弹窗 -->
  <el-dialog 
    v-model="registerDialogVisible" 
    title="注册用户" 
    width="500px" 
    destroy-on-close
  >
    <el-form :model="registerForm" label-width="80px">
      <el-form-item label="用户名" required>
        <el-input v-model="registerForm.username" placeholder="请输入用户名" minlength="3" maxlength="20" />
      </el-form-item>
      <el-form-item label="密码" required>
        <el-input v-model="registerForm.password" placeholder="请输入密码" type="password" minlength="6" />
      </el-form-item>
      <el-form-item label="邮箱" required>
        <el-input v-model="registerForm.email" placeholder="请输入邮箱" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="registerDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRegister">注册</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.user-manage { min-height: calc(100vh - 120px); }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-actions { display: flex; align-items: center; }
</style>