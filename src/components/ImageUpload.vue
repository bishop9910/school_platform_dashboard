<!-- 通用图片上传组件：支持委托/帖子/头像 -->
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ElMessage, ElUpload, type UploadUserFile, type UploadProps } from 'element-plus'
import { uploadApi } from '@/api/upload'
import { entrustApi } from '@/api/entrust'
import { postApi } from '@/api/post'
import { UploadAjaxError } from 'element-plus/es/components/upload/src/ajax.mjs'

type UploadTarget = 'avatar' | 'entrust' | 'post'

const props = defineProps<{
  target: UploadTarget
  targetId?: number  // entrust/post 类型需要
  userId?: number    // 管理员上传他人头像时需要
  multiple?: boolean // 是否支持多选（仅entrust/post）
  limit?: number     // 最大上传数量
  images?: any[]     // 现有图片列表
  imageUrlProp?: string // 图片URL属性名，默认为'image_url'
  onSuccess?: (url: string) => void
  onUploadSuccess?: () => void
  onDeleteSuccess?: () => void
}>()

const emit = defineEmits<{
  (e: 'upload-success'): void
  (e: 'delete-success'): void
}>()

const fileList = ref<UploadUserFile[]>([])
const uploading = ref(false)

// 监听现有图片列表变化
watch(() => props.images, (newImages) => {
  if (newImages) {
    fileList.value = newImages.map((img: any) => {
      const urlProp = props.imageUrlProp || 'image_url'
      const url = uploadApi.getImageUrl(img[urlProp], props.target)
      return {
        name: img.filename || `图片${img.id}`,
        url: url,
        response: { image_id: img.id }
      }
    })
  }
}, { immediate: true })

// 上传前校验
const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(rawFile.type)) {
    ElMessage.error('仅支持 JPG/PNG/GIF/WEBP 格式')
    return false
  }
  if (rawFile.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  return true
}

// 自定义上传请求
const customRequest: UploadProps['httpRequest'] = async (options) => {
  const { file, onSuccess, onError } = options
  uploading.value = true
  
  try {
    let res
    if (props.target === 'avatar') {
      if (props.userId) {
        // 管理员上传他人头像
        res = await uploadApi.uploadAvatarForUser(props.userId, file as File)
      } else {
        // 用户上传自己头像
        res = await uploadApi.uploadAvatar(file as File)
      }
    } else if (props.target === 'entrust' && props.targetId) {
      res = await entrustApi.uploadImage(props.targetId, file as File)
    } else if (props.target === 'post' && props.targetId) {
      res = await postApi.uploadImage(props.targetId, file as File)
    } else {
      throw new Error('缺少必要参数')
    }
    
    if (res.data.success) {
      let url = ''
      if (typeof res.data.data === 'object' && res.data.data !== null && 'url' in res.data.data) {
        url = (res.data.data as { url: string }).url
      } else if (typeof res.data.data === 'string') {
        url = res.data.data
      }
      const fullUrl = uploadApi.getImageUrl(url, props.target)
      onSuccess?.({
        ...res,
        data: {
          ...res.data,
          image_id: (res.data.data as any)?.id || (res.data.data as any)?.image_id
        }
      })
      props.onSuccess?.(fullUrl)
      emit('upload-success')
      props.onUploadSuccess?.()
      ElMessage.success('上传成功')
    } else {
      ElMessage.error(res.data.message || '上传失败')
    }
  } catch (e: any) {
    onError?.(e)
    ElMessage.error(e.message || '网络异常')
  } finally {
    uploading.value = false
  }
}

// 删除图片（仅entrust/post支持）
const handleRemove: UploadProps['onRemove'] = async (uploadFile) => {
  if (!props.targetId || props.target === 'avatar') return
  
  try {
    // 获取image_id
    let imageId: number | null = null
    if ((uploadFile.response as any)?.image_id) {
      imageId = (uploadFile.response as any).image_id
    } else if (uploadFile.url) {
      // 从URL中提取image_id（备用方案）
      imageId = extractImageId(uploadFile.url)
    }
    
    if (imageId) {
      if (props.target === 'entrust') {
        await entrustApi.deleteImage(imageId)
      } else if (props.target === 'post') {
        await postApi.deleteImage(imageId)
      }
      ElMessage.success('删除成功')
      emit('delete-success')
      props.onDeleteSuccess?.()
    }
  } catch (e: any) {
    console.error('删除图片失败:', e)
    ElMessage.error(e.message || '删除失败')
  }
}

// 从URL提取image_id（备用方案）
const extractImageId = (url: string): number | null => {
  // 尝试从URL中提取数字ID
  const match = url.match(/\/(\d+)\.[^.]+$/)
  return match ? parseInt(match[1]!, 10) : null
}
</script>

<template>
  <el-upload
    v-model:file-list="fileList"
    :action="`/app/uploads/${target}`"
    :multiple="target !== 'avatar' && multiple"
    :limit="limit || (target === 'avatar' ? 1 : 9)"
    :before-upload="beforeUpload"
    :http-request="customRequest"
    :on-remove="handleRemove"
    :disabled="uploading"
    list-type="picture-card"
    accept="image/*"
  >
    <el-icon v-if="!uploading"><Plus /></el-icon>
    <el-icon v-else><Loading /></el-icon>
    <template #tip>
      <div class="el-upload__tip">
        {{ target === 'avatar' ? '头像' : '图片' }}大小不超过5MB，支持JPG/PNG/GIF/WEBP
      </div>
    </template>
  </el-upload>
</template>

<style scoped>
.el-upload__tip {
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
}
</style>