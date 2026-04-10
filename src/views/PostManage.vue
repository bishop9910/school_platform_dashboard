<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { postApi } from '@/api/post'
import type { PostItem, PostWithAuthor, PageParams } from '@/types/models'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { uploadApi } from '@/api/upload'


import CommentList from '@/components/CommentList.vue'
import ImageUpload from '@/components/ImageUpload.vue'

// 状态
const tableData = ref<PostItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const search = ref('')
const userStore = useUserStore()

// 新建帖子
const createDialogVisible = ref(false)
const createForm = ref({
  title: '',
  content: ''
})

// 原始帖子数据
const originalTableData = ref<PostItem[]>([])

// 获取帖子列表
const fetchPosts = async () => {
  loading.value = true
  try {
    const res = await postApi.getList({ 
      page: page.value, 
      page_size: pageSize.value 
    })
    // 添加多层空值检查
    if (res && res.data) {
      // 提取 post 字段，转换为 PostItem[]
      const postsWithAuthor = res.data.data || []
      // 过滤null项
      const validItems = postsWithAuthor.filter((item: any) => item && item.post)
      originalTableData.value = validItems.map((item: PostWithAuthor) => ({
        ...item.post,
        author: item.author  // 保留作者信息供界面使用
      }))
      total.value = res.data.total || 0  // total 在 res.data 层级
      page.value = res.data.page || 1  // page 在 res.data 层级
      // 应用搜索过滤
      applySearchFilter()
    } else {
      // 确保即使数据结构不完整也有一个空数组
      originalTableData.value = []
      tableData.value = []
      total.value = 0
      console.log('No data structure found')
    }
  } catch (e: any) {
    console.error('Failed to fetch posts', e)
    ElMessage.error(e.message || '加载帖子列表失败')
    // 确保即使出错也有一个空数组
    originalTableData.value = []
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 应用搜索过滤
const applySearchFilter = () => {
  const keyword = search.value.trim().toLowerCase()
  if (!keyword) {
    tableData.value = [...originalTableData.value]
  } else {
    tableData.value = originalTableData.value.filter(post => {
      return (
        post.title?.toLowerCase().includes(keyword) ||
        post.content?.toLowerCase().includes(keyword)
      )
    })
  }
}

// 删除帖子
const handleDelete = async (post: PostItem) => {
  const isAuthor = post.user_id === userStore.userInfo?.id
  if (!isAuthor && !userStore.isAdmin) {
    return ElMessage.warning('仅作者或管理员可删除')
  }
  
  try {
    await ElMessageBox.confirm(`确认删除帖子 "${post.title}" 吗？`, '提示', { type: 'warning' })
    await postApi.delete(post.id)
    ElMessage.success('删除成功')
    fetchPosts()
  } catch { /* 取消 */ }
}

// 编辑帖子
const editDialogVisible = ref(false)
const currentEditPost = ref<PostItem | null>(null)
const editForm = ref({
  title: '',
  content: ''
})

const handleEdit = (post: PostItem) => {
  const isAuthor = post.user_id === userStore.userInfo?.id
  if (!isAuthor && !userStore.isAdmin) {
    return ElMessage.warning('仅作者或管理员可编辑')
  }
  currentEditPost.value = post
  editForm.value = {
    title: post.title,
    content: post.content
  }
  editDialogVisible.value = true
}

const saveEdit = async () => {
  if (!currentEditPost.value) return
  try {
    await postApi.update(currentEditPost.value.id, {
      title: editForm.value.title,
      content: editForm.value.content
    })
    ElMessage.success('编辑成功')
    editDialogVisible.value = false
    fetchPosts()
  } catch (error) {
    console.error('Failed to update post', error)
    ElMessage.error('编辑失败')
  }
}

// 图片上传参数
const getUploadParams = (postId: number) => ({
  action: '/app/uploads/post',
  extraParams: { post_id: postId }
})

// 删除图片
const handleDeleteImage = async (imageId: number) => {
  try {
    await ElMessageBox.confirm('确认删除该图片？', '提示', { type: 'warning' })
    await postApi.deleteImage(imageId)
    ElMessage.success('删除成功')
    fetchPosts()
  } catch { /* 取消 */ }
}

// 新建帖子
const handleCreate = () => {
  createDialogVisible.value = true
  createForm.value = {
    title: '',
    content: ''
  }
}

const saveCreate = async () => {
  try {
    const res = await postApi.create(createForm.value)
    ElMessage.success('发布成功')
    createDialogVisible.value = false
    fetchPosts()
  } catch (error) {
    console.error('Failed to create post', error)
    ElMessage.error('发布失败')
  }
}

// 查看帖子详情
const dialogVisible = ref(false)
const currentPost = ref<PostItem | null>(null)

const viewDetail = (post: PostItem) => {
  currentPost.value = post
  dialogVisible.value = true
}

onMounted(fetchPosts)
</script>

<template>
  <el-card class="post-manage">
    <template #header>
      <div class="card-header">
        <h3><el-icon><Document /></el-icon> 帖子管理</h3>
        <div class="header-actions">
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon> 新建帖子
          </el-button>
          <el-input 
            v-model="search" 
            placeholder="搜索标题/内容" 
            style="width: 240px; margin-left: 10px" 
            clearable 
            @clear="applySearchFilter"
            @keyup.enter="applySearchFilter"
          />
          <el-button type="primary" @click="applySearchFilter" style="margin-left: 10px">搜索</el-button>
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
      <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
      
      <el-table-column label="作者" width="140">
        <template #default="{ row }">
          <div class="author-cell">
            <el-avatar :size="24" :src="uploadApi.getImageUrl(row.author?.avatar || '', 'avatar')" />
            <span>{{ row.author?.nick_name || '匿名用户' }}</span>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="点赞" width="80">
        <template #default="{ row }">
          <span>{{ row.like_count || 0 }}</span>
        </template>
      </el-table-column>
      
      <el-table-column prop="create_time" label="发布时间" width="160" sortable />
      
      <el-table-column label="图片" width="100">
        <template #default="{ row }">
          <el-image 
            v-if="row.images?.[0]?.image_url"
            :src="uploadApi.getImageUrl(row.images[0].image_url, 'post')"
            :preview-src-list="row.images?.map((img: { image_url: string }) => uploadApi.getImageUrl(img.image_url, 'post'))"
            preview-teleported
            fit="cover"
            style="width: 60px; height: 60px; border-radius: 4px"
          />
          <span v-else class="no-image">无</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="viewDetail(row)">查看</el-button>
          <el-button 
            v-if="row.user_id === userStore.userInfo?.id || userStore.isAdmin"
            size="small" 
            type="warning" 
            @click="handleEdit(row)"
          >
            编辑
          </el-button>
          <el-button 
            v-if="row.user_id === userStore.userInfo?.id || userStore.isAdmin"
            size="small" 
            type="danger" 
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
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @current-change="fetchPosts"
      @size-change="fetchPosts"
      style="margin-top: 16px; justify-content: flex-end"
    />
  </el-card>

  <!-- 帖子详情弹窗（保持不变） -->
  <el-dialog 
    v-model="dialogVisible" 
    :title="currentPost?.title" 
    width="70%" 
    destroy-on-close
  >
    <div v-if="currentPost" class="post-detail">
      <div class="post-author">
        <el-avatar :size="40" :src="uploadApi.getImageUrl(currentPost.author?.avatar || '', 'avatar')" />
        <div class="author-info">
          <span class="nick-name">{{ currentPost.author?.nick_name }}</span>
          <span class="post-time">{{ currentPost.create_time }}</span>
        </div>
      </div>
      <div class="post-content">
        <p>{{ currentPost.content }}</p>
      </div>
      <div v-if="currentPost.images?.length" class="image-list" style="margin: 16px 0">
        <div v-for="img in currentPost.images" :key="img.id" class="image-item">
          <el-image 
            :src="uploadApi.getImageUrl(img.image_url, 'post')"
            :preview-src-list="currentPost.images?.map((i: { image_url: string }) => uploadApi.getImageUrl(i.image_url, 'post'))"
            fit="contain"
            style="width: 200px; height: 200px; margin-right: 12px; margin-bottom: 12px"
          />
          <el-button 
            v-if="currentPost.user_id === userStore.userInfo?.id || userStore.isAdmin"
            size="small" 
            type="danger" 
            @click="handleDeleteImage(img.id)"
            class="delete-image-btn"
            style="position: absolute; top: 8px; right: 8px"
          >
            删除
          </el-button>
        </div>
      </div>
      <div class="post-actions">
        <span class="like-count">👍 {{ currentPost.like_count || 0 }}</span>
      </div>
      <el-divider>评论</el-divider>
      <CommentList source="post" :source-id="currentPost.id" />
    </div>
  </el-dialog>

  <!-- 编辑帖子弹窗 -->
  <el-dialog 
    v-model="editDialogVisible" 
    title="编辑帖子" 
    width="60%" 
    destroy-on-close
  >
    <el-form :model="editForm" label-width="80px">
      <el-form-item label="标题">
        <el-input v-model="editForm.title" placeholder="请输入帖子标题" />
      </el-form-item>
      <el-form-item label="内容">
        <el-input 
          v-model="editForm.content" 
          type="textarea" 
          :rows="6" 
          placeholder="请输入帖子内容"
        />
      </el-form-item>
      <el-form-item label="图片">
        <ImageUpload 
          v-if="currentEditPost" 
          target="post"
          :target-id="currentEditPost.id"
          :images="currentEditPost.images || []"
          :image-url-prop="'image_url'"
          @upload-success="fetchPosts"
          @delete-success="fetchPosts"
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

  <!-- 新建帖子弹窗 -->
  <el-dialog 
    v-model="createDialogVisible" 
    title="新建帖子" 
    width="60%" 
    destroy-on-close
  >
    <el-form :model="createForm" label-width="80px">
      <el-form-item label="标题" required>
        <el-input v-model="createForm.title" placeholder="请输入帖子标题" />
      </el-form-item>
      <el-form-item label="内容" required>
        <el-input 
          v-model="createForm.content" 
          type="textarea" 
          :rows="6" 
          placeholder="请输入帖子内容"
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
/* 样式保持不变 */
.post-manage { min-height: calc(100vh - 120px); }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-actions { display: flex; gap: 10px; }
.author-cell { display: flex; align-items: center; gap: 6px; }
.no-image { color: #909399; font-size: 12px; }
.post-detail { padding: 8px 0; }
.post-author { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.author-info { display: flex; flex-direction: column; }
.nick-name { font-weight: 500; color: #303133; }
.post-time { color: #909399; font-size: 12px; }
.post-content { color: #606266; line-height: 1.6; white-space: pre-wrap; }
.post-actions { margin: 16px 0; }
.image-list { display: flex; flex-wrap: wrap; }
.image-item { position: relative; display: inline-block; }
</style>