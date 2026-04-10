<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { entrustApi } from '@/api/entrust'
import { postApi } from '@/api/post'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { CommentItem, CommentWithAuthor } from '@/types/models'
import { uploadApi } from '@/api/upload'

const userStore = useUserStore()
const activeTab = ref('entrust') // 'entrust' or 'post'
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const comments = ref<CommentWithAuthor[]>([])

// 获取评论列表
const fetchComments = async () => {
  loading.value = true
  try {
    // 先获取所有的委托或帖子
    const api = activeTab.value === 'entrust' ? entrustApi : postApi
    const listRes = await api.getList({ page: 1, page_size: 100 })
    // console.log('List API response:', listRes)
    // console.log('List API response data:', listRes.data)
    const items = listRes.data.data || []
    
    // 收集所有评论
    const allComments: CommentWithAuthor[] = []
    
    // 遍历每个委托或帖子，获取其评论
    for (const item of items) {
      if (!item) continue // 过滤null
      
      let itemId: number
      if (activeTab.value === 'entrust') {
        const entrustItem = item as any
        if (!entrustItem.entrust) continue // 过滤null
        itemId = entrustItem.entrust.id
      } else {
        const postItem = item as any
        if (!postItem.post) continue // 过滤null
        itemId = postItem.post.id
      }
      
      try {
        const commentRes = await api.getComments(itemId, { page: 1, page_size: 50 })
        // console.log('Comment API response:', commentRes)
        // console.log('Comment API response data:', commentRes.data)
        // 添加多层空值检查
        if (commentRes && commentRes.data && commentRes.data.data) {
          const itemComments = commentRes.data.data || []
          // console.log('Item comments:', itemComments)
          // 过滤null评论
          const validComments = itemComments.filter((comment: any) => comment !== null)
          allComments.push(...validComments)
        }
      } catch (e) {
        console.error(`Failed to fetch comments for ${activeTab.value} ${itemId}`, e)
        // 继续处理其他项，不中断整个流程
      }
    }
    
    // console.log('All comments:', allComments)
    // 按创建时间倒序排序
    allComments.sort((a, b) => {
      const dateA = new Date(a.comment.created_at || 0).getTime()
      const dateB = new Date(b.comment.created_at || 0).getTime()
      return dateB - dateA
    })
    
    // 分页处理
    const start = (page.value - 1) * pageSize.value
    const end = start + pageSize.value
    comments.value = allComments.slice(start, end)
    total.value = allComments.length
    // console.log('Comments:', comments.value, 'Total:', total.value)
  } catch (e) {
    console.error('Failed to fetch comments', e)
    ElMessage.error('加载评论列表失败')
    // 确保即使出错也有一个空数组
    comments.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 删除评论
const handleDelete = async (comment: CommentWithAuthor) => {
  try {
    await ElMessageBox.confirm('确认删除该评论？', '提示', { type: 'warning' })
    const api = activeTab.value === 'entrust' ? entrustApi : postApi
    await api.deleteComment(comment.comment.id)
    ElMessage.success('删除成功')
    fetchComments()
  } catch { /* 取消 */ }
}

// 切换标签时重置页码并重新加载
const handleTabChange = () => {
  page.value = 1
  fetchComments()
}

onMounted(fetchComments)
</script>

<template>
  <div class="comment-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span><el-icon><ChatDotRound /></el-icon> 评论管理</span>
        </div>
      </template>
      
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="委托评论" name="entrust" />
        <el-tab-pane label="帖子评论" name="post" />
      </el-tabs>
      
      <el-table
        v-loading="loading"
        :data="comments"
        style="width: 100%"
        border
      >
        <el-table-column prop="id" label="ID" width="80">
          <template #default="{ row }">
            {{ row.comment.id }}
          </template>
        </el-table-column>
        <el-table-column prop="content" label="评论内容">
          <template #default="{ row }">
            <div class="comment-content">{{ row.comment.content }}</div>
          </template>
        </el-table-column>
        <el-table-column label="作者" width="150">
          <template #default="{ row }">
            <div class="author-info">
              <el-avatar :size="32" :src="uploadApi.getImageUrl(row.author?.avatar, 'avatar')" />
              <span class="author-name">{{ row.author?.nick_name || '匿名用户' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="like_count" label="点赞" width="80">
          <template #default="{ row }">
            {{ row.comment.like_count }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="danger" 
              size="small" 
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="fetchComments"
        @current-change="fetchComments"
        style="margin-top: 16px; text-align: right"
      />
    </el-card>
  </div>
</template>

<style scoped>
.comment-manage {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comment-content {
  line-height: 1.5;
  word-break: break-word;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-name {
  font-size: 14px;
  color: #303133;
}
</style>