<!-- 通用评论列表组件：支持委托/帖子 -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { entrustApi } from '@/api/entrust'
import { postApi } from '@/api/post'
import { uploadApi } from '@/api/upload'
import { useUserStore } from '@/stores/user'

import type { CommentItem, CommentWithAuthor } from '@/types/models'
import { ElMessage, ElMessageBox } from 'element-plus'

type CommentSource = 'entrust' | 'post'

const props = defineProps<{
  source: CommentSource
  sourceId: number
  pageSize?: number
}>()

const userStore = useUserStore()
const comments = ref<CommentWithAuthor[]>([])
const total = ref(0)
const page = ref(1)
const loading = ref(false)
const newComment = ref('')
const submitting = ref(false)

const fetchComments = async () => {
  loading.value = true
  try {
    const api = props.source === 'entrust' ? entrustApi : postApi
    const res = await api.getComments(props.sourceId, {
      page: page.value,
      page_size: props.pageSize || 20
    })
    // 添加多层空值检查
    if (res && res.data && res.data.data) {
      comments.value = res.data.data || []
      total.value = res.data.total || 0
    } else {
      comments.value = []
      total.value = 0
    }
  } catch (e: any) {
    console.error('Failed to fetch comments', e)
    ElMessage.error(e.message || '加载评论失败')
    comments.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const addComment = async () => {
  if (!newComment.value.trim() || !userStore.isLoggedIn) return
  if (submitting.value) return
  
  submitting.value = true
  try {
    const api = props.source === 'entrust' ? entrustApi : postApi
    await api.addComment(props.sourceId, newComment.value.trim())
    ElMessage.success('评论成功')
    newComment.value = ''
    page.value = 1
    await fetchComments()
  } catch (e: any) {
    console.error('Failed to add comment', e)
    ElMessage.error(e.message || '评论失败')
  } finally {
    submitting.value = false
  }
}

const deleteComment = async (comment: CommentItem) => {
  // 仅作者或管理员可删除
  const isAuthor = comment.user_id === userStore.userInfo?.id
  const isAdmin = userStore.isAdmin
  if (!isAuthor && !isAdmin) {
    return ElMessage.warning('权限不足')
  }
  
  try {
    await ElMessageBox.confirm('确认删除该评论？', '提示', { type: 'warning' })
    const api = props.source === 'entrust' ? entrustApi : postApi
    await api.deleteComment(comment.id)
    ElMessage.success('删除成功')
    await fetchComments()
  } catch (e: any) {
    if (e !== 'cancel') {
      console.error('Failed to delete comment', e)
      ElMessage.error(e.message || '删除失败')
    }
  }
}

onMounted(fetchComments)
</script>

<template>
  <div class="comment-list">
    <!-- 评论输入框 -->
    <div class="comment-input" v-if="userStore.isLoggedIn">
      <el-input
        v-model="newComment"
        type="textarea"
        :rows="2"
        placeholder="写下你的评论..."
        maxlength="500"
        show-word-limit
      />
      <div class="input-footer">
        <el-button 
          type="primary" 
          size="small" 
          @click="addComment"
          :loading="submitting"
        >
          发表评论
        </el-button>
      </div>
    </div>
    <div v-else class="comment-input">
      <el-alert 
        title="请先登录后再评论" 
        type="info" 
        :closable="false" 
        show-icon 
      />
    </div>

    <!-- 评论列表 -->
    <div class="comments" v-loading="loading">
      <div 
        v-for="item in comments" 
        :key="item.comment.id" 
        class="comment-item"
      >
        <div class="comment-header">
          <el-avatar :size="32" :src="uploadApi.getImageUrl(item.author?.avatar || '', 'avatar')" />
          <span class="author-name">{{ item.author?.nick_name || '匿名用户' }}</span>
          <el-button 
            v-if="item.comment.user_id === userStore.userInfo?.id || userStore.isAdmin"
            link 
            type="danger" 
            size="small"
            @click="deleteComment(item.comment)"
            class="delete-btn"
          >
            删除
          </el-button>
        </div>
        <div class="comment-content">{{ item.comment.content || '无内容' }}</div>
        <div class="comment-footer">
          <span class="like-count">👍 {{ item.comment.like_count || 0 }}</span>
        </div>
      </div>
      
      <el-empty v-if="!loading && comments.length === 0" description="暂无评论" />
    </div>

    <!-- 分页 -->
    <el-pagination
      v-if="total > (props.pageSize || 20)"
      v-model:current-page="page"
      :total="total"
      :page-size="props.pageSize || 20"
      layout="prev, pager, next"
      @current-change="fetchComments"
      style="margin-top: 16px; justify-content: center"
    />
  </div>
</template>

<style scoped>
.comment-list {
  padding: 16px 0;
}
.comment-input {
  margin-bottom: 20px;
}
.input-footer {
  margin-top: 8px;
  text-align: right;
}
.comment-item {
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}
.comment-item:last-child {
  border-bottom: none;
}
.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.author-name {
  font-weight: 500;
  color: #303133;
}
.comment-time {
  color: #909399;
  font-size: 12px;
  margin-left: auto;
}
.delete-btn {
  margin-left: 8px;
}
.comment-content {
  color: #606266;
  line-height: 1.5;
  margin-bottom: 8px;
  word-break: break-word;
}
.comment-footer {
  display: flex;
  align-items: center;
}
</style>