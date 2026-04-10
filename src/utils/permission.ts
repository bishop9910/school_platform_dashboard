import { useUserStore } from '@/stores/user'
import type { Permission } from '@/types/enums'

/**
 * 检查当前用户是否有指定权限
 * @param required 所需权限级别
 */
export const hasPermission = (required: Permission): boolean => {
  const userStore = useUserStore()
  const current = userStore.userInfo?.permission
  if (current === undefined) return false
  // 管理员可访问普通用户权限
  const currentPerm = typeof current === 'string' ? (current === 'admin' ? 1 : 0) : current
  return currentPerm >= required
}

/**
 * 检查是否为超级管理员（权限=1）
 */
export const isAdmin = (): boolean => {
  const userStore = useUserStore()
  return userStore.userInfo?.permission === "admin"
}

/**
 * 检查是否为帖子/委托的作者
 * @param ownerId 资源所有者ID
 */
export const isOwner = (ownerId: number): boolean => {
  const userStore = useUserStore()
  return userStore.userInfo?.id === ownerId
}

/**
 * 权限指令（用于 v-permission）
 * 用法: <el-button v-permission="1">仅管理员可见</el-button>
 */
export const permissionDirective = {
  mounted(el: HTMLElement, binding: { value: Permission }) {
    if (!hasPermission(binding.value)) {
      el.parentNode?.removeChild(el)
    }
  }
}