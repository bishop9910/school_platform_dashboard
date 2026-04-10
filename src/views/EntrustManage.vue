<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { entrustApi } from '@/api/entrust'
import http from '@/api/index'
import { uploadApi } from '@/api/upload'
import type { EntrustItem, PageParams, ApiResponse } from '@/types/models'
import { CreditLevelMap } from '@/types/enums'
import { ElMessageBox, ElMessage, ElInput } from 'element-plus'
import { useUserStore } from '@/stores/user'
import CommentList from '@/components/CommentList.vue'

// 状态
const tableData = ref<EntrustItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const userStore = useUserStore()

// 搜索/筛选
const searchTitle = ref('')
const filterStatus = ref<'all' | 'progressing' | 'over' | 'expired'>('all')

// 新建委托
const createDialogVisible = ref(false)
const createForm = ref({
  title: '',
  content: '',
  coin: 0,
  allowed_credit_score_level: 0,
  over_time: ''
})

// 原始委托数据
const originalTableData = ref<EntrustItem[]>([])

// 获取委托列表
const fetchEntrusts = async () => {
  loading.value = true
  try {
    const res = await entrustApi.getList({ 
      page: page.value, 
      page_size: pageSize.value 
    })
    // console.log('Entrust API response:', res)
    // console.log('Entrust API response data:', res.data)
    // 添加多层空值检查
    if (res && res.data) {
      const items = res.data.data || []
      // console.log('Items:', items)
      // 过滤null项
      const validItems = items.filter((item: any) => item && item.entrust)
      // console.log('Valid items:', validItems)
      originalTableData.value = validItems.map((item: any) => ({
        ...item.entrust,
        author: item.author
      }))
      // console.log('Table data:', tableData.value)
      total.value = res.data.total || 0
      // console.log('Total:', total.value)
      // 应用过滤
      applyFilter()
    } else {
      // 确保即使数据结构不完整也有一个空数组
      originalTableData.value = []
      tableData.value = []
      total.value = 0
      console.log('No data structure found')
    }
  } catch (e) {
    console.error('Failed to fetch entrusts', e)
    // 确保即使出错也有一个空数组
    originalTableData.value = []
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 应用过滤
const applyFilter = () => {
  let filtered = [...originalTableData.value]
  
  // 应用搜索过滤
  const keyword = searchTitle.value.trim().toLowerCase()
  if (keyword) {
    filtered = filtered.filter(entrust => {
      return entrust.title?.toLowerCase().includes(keyword)
    })
  }
  
  // 应用状态过滤
  if (filterStatus.value !== 'all') {
    filtered = filtered.filter(entrust => {
      switch (filterStatus.value) {
        case 'progressing':
          return entrust.is_progressing
        case 'over':
          return entrust.is_over
        case 'expired':
          return entrust.is_expired
        default:
          return true
      }
    })
  }
  
  tableData.value = filtered
}

// 删除委托
const handleDelete = async (entrust: EntrustItem) => {
  try {
    await ElMessageBox.confirm(`确认删除委托 "${entrust.title}"？`, '提示', { type: 'warning' })
    await entrustApi.delete(entrust.id)
    ElMessage.success('删除成功')
    fetchEntrusts()
  } catch { /* 取消 */ }
}

// 编辑委托
const editDialogVisible = ref(false)
const currentEditEntrust = ref<EntrustItem | null>(null)
const editForm = ref({
  title: '',
  content: '',
  coin: 0,
  allowed_credit_score_level: 0,
  over_time: ''
})

const handleEdit = (entrust: EntrustItem) => {
  const isAuthor = entrust.user_id === userStore.userInfo?.id
  if (!isAuthor && !userStore.isAdmin) {
    return ElMessage.warning('仅作者或管理员可编辑')
  }
  currentEditEntrust.value = entrust
  editForm.value = {
    title: entrust.title,
    content: entrust.content,
    coin: entrust.credit_coin,
    allowed_credit_score_level: entrust.allowed_credit_score_level,
    over_time: entrust.over_time
  }
  editDialogVisible.value = true
}

const saveEdit = async () => {
  if (!currentEditEntrust.value) return
  try {
    await entrustApi.update(currentEditEntrust.value.id, {
      title: editForm.value.title,
      content: editForm.value.content,
      coin: editForm.value.coin,
      allowed_credit_score_level: editForm.value.allowed_credit_score_level,
      over_time: editForm.value.over_time
    })
    ElMessage.success('编辑成功')
    editDialogVisible.value = false
    fetchEntrusts()
  } catch (error) {
    console.error('Failed to update entrust', error)
    ElMessage.error('编辑失败')
  }
}

// 图片上传参数
const getUploadParams = (entrustId: number) => ({
  action: '/app/uploads/entrust',
  extraParams: { entrust_id: entrustId }
})

const creditLevelText = (level: 0 | 1 | 2) => {
  switch(level){
    case 0:
      return "信用等级 ≥ 低信用"
    case 1:
      return "信用等级 ≥ 中等信用"
    case 2:
      return "信用等级 ≥ 高信用"
    default:
      return "无信用限制"
  }
}

// 删除图片
const handleDeleteImage = async (imageId: number) => {
  try {
    await ElMessageBox.confirm('确认删除该图片？', '提示', { type: 'warning' })
    await entrustApi.deleteImage(imageId)
    ElMessage.success('删除成功')
    fetchEntrusts()
  } catch { /* 取消 */ }
}

// 新建委托
const handleCreate = () => {
  createDialogVisible.value = true
  createForm.value = {
    title: '',
    content: '',
    coin: 0,
    allowed_credit_score_level: 0,
    over_time: ''
  }
}

const saveCreate = async () => {
  try {
    const res = await entrustApi.create(createForm.value)
    ElMessage.success('发布成功')
    createDialogVisible.value = false
    fetchEntrusts()
  } catch (error) {
    console.error('Failed to create entrust', error)
    ElMessage.error('发布失败')
  }
}

onMounted(fetchEntrusts)
</script>

<template>
  <el-card class="entrust-manage">
    <template #header>
      <div class="card-header">
        <h3><el-icon><DocumentChecked /></el-icon> 委托管理</h3>
        <div class="filters">
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon> 新建委托
          </el-button>
          <el-input
            v-model="searchTitle"
            placeholder="搜索标题"
            style="width: 200px; margin-left: 10px"
            clearable
            @clear="applyFilter"
            @keyup.enter="applyFilter"
          />
          <el-select v-model="filterStatus" style="width: 120px; margin-left: 12px" @change="applyFilter">
            <el-option label="全部" value="all" />
            <el-option label="进行中" value="progressing" />
            <el-option label="已完成" value="over" />
            <el-option label="已过期" value="expired" />
          </el-select>
        </div>
      </div>
    </template>

    <el-table 
      :data="tableData" 
      v-loading="loading" 
      border 
      style="width: 100%"
      row-key="id"
    >
      <el-table-column prop="id" label="ID" width="70" sortable />
      <el-table-column prop="title" label="标题" min-width="60" show-overflow-tooltip />
      
      <el-table-column label="信用等级" width="150">
        <template #default="{ row }">
          {{ creditLevelText(row.allowed_credit_score_level) }}
        </template>
      </el-table-column>
      
      <el-table-column label="金币" width="80" sortable>
        <template #default="{ row }">
          {{ row.credit_coin }}
        </template>
      </el-table-column>
      
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="row.is_over ? 'info' : row.is_progressing ? 'success' : row.is_expired ? 'danger' : 'warning'">
            {{ row.is_expired ? '已过期' : row.is_over ? '已完成' : row.is_progressing ? '进行中' : '待接受' }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="like_count" label="点赞" width="80" sortable />
      <el-table-column prop="create_time" label="创建时间" width="160" sortable />
      <el-table-column prop="over_time" label="截止时间" width="160" />

      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>

      <!-- 展开行：显示详情 + 评论 -->
      <el-table-column type="expand" label="详情" width="70">
        <template #default="{ row }">
          <div class="expand-content">
            <h4><el-icon><DocumentChecked /></el-icon> 委托详情</h4>
            <p>{{ row.content }}</p>
            
            <h4 style="margin-top: 16px"><el-icon><Picture /></el-icon> 图片列表</h4>
            <div class="image-grid">
              <div v-for="img in row.images" :key="img.id" class="image-item">
                <el-image
                  :src="uploadApi.getImageUrl(img.image_url, 'entrust')"
                  :preview-src-list="row.images.map((i: any) => uploadApi.getImageUrl(i.image_url, 'entrust'))"
                  fit="cover"
                  style="width: 200px; height: 200px; border-radius: 4px"
                />
              </div>
            </div>

            <h4 style="margin-top: 16px"><el-icon><ChatDotRound /></el-icon> 评论</h4>
            <CommentList
              source="entrust"
              :source-id="row.id"
              :api="{
                getList: entrustApi.getComments,
                add: entrustApi.addComment,
                delete: entrustApi.deleteComment,
                like: entrustApi.likeComment,
                unlike: entrustApi.unlikeComment,
                checkLikeStatus: async (id: number) => {
                  const res = await http.get(`/entrust/comment/like/status?comment_id=${id}`)
                  const data = res.data as any
                  return data.data?.data?.is_liked || false
                }
              }"
            />
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="fetchEntrusts"
        @size-change="fetchEntrusts"
        style="margin-top: 16px; justify-content: flex-end"
      />
  </el-card>

  <!-- 编辑委托弹窗 -->
  <el-dialog 
    v-model="editDialogVisible" 
    title="编辑委托" 
    width="60%" 
    destroy-on-close
  >
    <el-form :model="editForm" label-width="120px">
      <el-form-item label="标题">
        <el-input v-model="editForm.title" placeholder="请输入委托标题" />
      </el-form-item>
      <el-form-item label="内容">
        <el-input 
          v-model="editForm.content" 
          type="textarea" 
          :rows="6" 
          placeholder="请输入委托内容"
        />
      </el-form-item>
      <el-form-item label="金币">
        <el-input v-model.number="editForm.coin" placeholder="请输入金币数量" type="number" />
      </el-form-item>
      <el-form-item label="信用等级">
        <el-select v-model="editForm.allowed_credit_score_level" placeholder="请选择信用等级">
          <el-option label="普通" :value="0" />
          <el-option label="良好" :value="1" />
          <el-option label="优秀" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="截止时间">
        <el-date-picker 
          v-model="editForm.over_time" 
          type="datetime" 
          placeholder="选择截止时间" 
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="图片">
        <ImageUpload 
          v-if="currentEditEntrust" 
          target="entrust"
          :target-id="currentEditEntrust.id"
          :images="currentEditEntrust.images || []"
          :image-url-prop="'image_url'"
          @upload-success="fetchEntrusts"
          @delete-success="fetchEntrusts"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 新建委托弹窗 -->
  <el-dialog 
    v-model="createDialogVisible" 
    title="新建委托" 
    width="60%" 
    destroy-on-close
  >
    <el-form :model="createForm" label-width="120px">
      <el-form-item label="标题" required>
        <el-input v-model="createForm.title" placeholder="请输入委托标题" />
      </el-form-item>
      <el-form-item label="内容" required>
        <el-input 
          v-model="createForm.content" 
          type="textarea" 
          :rows="6" 
          placeholder="请输入委托内容"
        />
      </el-form-item>
      <el-form-item label="金币" required>
        <el-input v-model.number="createForm.coin" placeholder="请输入金币数量" type="number" min="0" />
      </el-form-item>
      <el-form-item label="信用等级" required>
        <el-select v-model="createForm.allowed_credit_score_level" placeholder="请选择信用等级">
          <el-option label="普通" :value="0" />
          <el-option label="良好" :value="1" />
          <el-option label="优秀" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="截止时间" required>
        <el-date-picker 
          v-model="createForm.over_time" 
          type="datetime" 
          placeholder="选择截止时间" 
          style="width: 100%"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCreate">发布</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.entrust-manage {
  min-height: calc(100vh - 120px);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filters {
  display: flex;
  align-items: center;
}
.expand-content {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 4px;
}
.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>