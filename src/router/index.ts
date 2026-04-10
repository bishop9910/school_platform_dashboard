import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue'), meta: { requiresAuth: false } },
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '📊 数据看板' } },
      { path: 'users', name: 'UserManage', component: () => import('@/views/UserManage.vue'), meta: { title: '👥 用户管理', requiresAdmin: true } },
      { path: 'entrusts', name: 'EntrustManage', component: () => import('@/views/EntrustManage.vue'), meta: { title: '📦 委托管理', requiresAdmin: true } },
      { path: 'posts', name: 'PostManage', component: () => import('@/views/PostManage.vue'), meta: { title: '📝 帖子管理', requiresAdmin: true } },
      { path: 'comments', name: 'CommentManage', component: () => import('@/views/CommentManage.vue'), meta: { title: '💬 评论管理', requiresAdmin: true } },
      { path: 'coin-logs', name: 'CoinLog', component: () => import('@/views/CoinLog.vue'), meta: { title: '💰 金币日志', requiresAdmin: true } }
    ]
  },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFound.vue') }
]

const router = createRouter({ history: createWebHistory(), routes })

// ✅ 新版路由守卫：使用 return 替代 next()
router.beforeEach(async (to, from) => {
  const userStore = useUserStore()
  const { requiresAuth, requiresAdmin } = to.meta

  // 1. 无需鉴权
  if (!requiresAuth) {
    if (to.path === '/login' && userStore.isLoggedIn) return '/dashboard'
    return true // 放行
  }

  // 2. 需要登录但未登录
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return '/login' // 重定向
  }

  // 3. 需要管理员权限但当前用户不是
  if (requiresAdmin && !userStore.isAdmin) {
    ElMessage.error('权限不足')
    return '/dashboard' // 拦截并重定向
  }

  // 4. 校验通过
  return true
})

export default router