<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { userApi } from '@/api/user'
import { entrustApi } from '@/api/entrust'
import { postApi } from '@/api/post'
import type { EntrustWithAuthor } from '@/types/models'

const chartRef = ref<HTMLElement>()
let userChart: echarts.ECharts | null = null
let entrustChart: echarts.ECharts | null = null
let isComponentActive = false

const userData = ref({
  total: 0,
  today: 0,
  prohibited: 0,
  admins: 0
})

const entrustData = reactive({
  total: 0,
  progressing: 0,
  over: 0,
  expired: 0,
  commentCount: 0
})

const postData = reactive({
  total: 0,
  commentCount: 0
})

const totalCoin = ref(0)

const fetchUserData = async () => {
  try {
    const allUsersRes = await userApi.getList({ page: 1, page_size: 1000 })
    const users = allUsersRes.data.data.users || []
    userData.value.total = users.length
    userData.value.admins = users.filter((user: any) => user.permission === 'admin' || user.permission === 1).length
    userData.value.prohibited = users.filter((user: any) => user.is_prohibited).length
  } catch (error) {
    console.error('Failed to fetch user data', error)
  }
}

const fetchEntrustData = async () => {
  try {
    const res = await entrustApi.getList({ page: 1, page_size: 1000 })
    const entrusts = res.data.data || []
    
    entrustData.total = entrusts.length
    entrustData.progressing = entrusts.filter((item: EntrustWithAuthor) => item.entrust?.is_progressing).length
    entrustData.over = entrusts.filter((item: EntrustWithAuthor) => item.entrust?.is_over).length
    entrustData.expired = entrusts.filter((item: EntrustWithAuthor) => item.entrust?.is_expired).length

    let totalEntrustComments = 0
    for (const item of entrusts) {
      try {
        const commentRes = await entrustApi.getComments(item.entrust.id, { page: 1, page_size: 1 })
        totalEntrustComments += commentRes.data.total || 0
      } catch (commentError) {
        console.error(`Failed to fetch comments for entrust ${item.entrust.id}`, commentError)
      }
    }
    entrustData.commentCount = totalEntrustComments
  } catch (error) {
    console.error('Failed to fetch entrust data', error)
  }
}

const fetchPostData = async () => {
  try {
    const res = await postApi.getList({ page: 1, page_size: 1000 })
    const posts = res.data.data || []
    
    postData.total = posts.length
    
    let totalPostComments = 0
    for (const item of posts) {
      try {
        const commentRes = await postApi.getComments(item.post.id, { page: 1, page_size: 1 })
        totalPostComments += commentRes.data.total || 0
      } catch (commentError) {
        console.error(`Failed to fetch comments for post ${item.post.id}`, commentError)
      }
    }
    postData.commentCount = totalPostComments
  } catch (error) {
    console.error('Failed to fetch post data', error)
  }
}

// 获取全服务器金币总数
const fetchTotalCoin = async () => {
  try {
    const res = await userApi.getTotalCoin()
    totalCoin.value = res.data.data.total_coin || 0
  } catch (error) {
    console.error('Failed to fetch total coin', error)
  }
}

const updateCharts = () => {
  if (!isComponentActive) return
  
  if (userChart && !userChart.isDisposed?.()) {
    const totalUsers = userData.value.total || 0
    const normalUsers = totalUsers - userData.value.prohibited - userData.value.admins
    
    userChart.setOption({
      title: { text: '用户分布', left: 'center' },
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { value: normalUsers, name: '普通用户' },
          { value: userData.value.admins, name: '管理员' },
          { value: userData.value.prohibited, name: '已封禁' }
        ],
        label: { formatter: '{b}: {c} ({d}%)' }
      }]
    })
  }

  if (entrustChart && !entrustChart.isDisposed?.()) {
    entrustChart.setOption({
      title: { text: '委托状态分布', left: 'center' },
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [{
        name: '委托状态',
        type: 'pie',
        radius: '60%',
        data: [
          { value: entrustData.progressing, name: '进行中' },
          { value: entrustData.over, name: '已完成' },
          { value: entrustData.expired, name: '已过期' }
        ]
      }]
    })
  }
}

onMounted(async () => {
  await nextTick()
  
  if (!chartRef.value) return
  
  isComponentActive = true

  const userChartEl = chartRef.value.querySelector('#user-chart') as HTMLElement | null
  const entrustChartEl = chartRef.value.querySelector('#entrust-chart') as HTMLElement | null
  
  if (!userChartEl || !entrustChartEl) {
    console.error('Chart container not found')
    return
  }

  userChart = echarts.init(userChartEl)
  entrustChart = echarts.init(entrustChartEl)

  try {
    await Promise.all([fetchUserData(), fetchEntrustData(), fetchPostData(), fetchTotalCoin()])
    
    if (isComponentActive) {
      updateCharts()
    }
  } catch (error) {
    console.error('Failed to load dashboard data', error)
  }

  const handleResize = () => {
    if (userChart && !userChart.isDisposed?.()) userChart.resize()
    if (entrustChart && !entrustChart.isDisposed?.()) entrustChart.resize()
  }
  
  window.addEventListener('resize', handleResize)
  ;(chartRef.value as any)._resizeHandler = handleResize
})

onUnmounted(() => {
  isComponentActive = false
  
  if (chartRef.value && (chartRef.value as any)._resizeHandler) {
    window.removeEventListener('resize', (chartRef.value as any)._resizeHandler)
  }
  
  if (userChart && !userChart.isDisposed?.()) {
    userChart.dispose()
    userChart = null
  }
  if (entrustChart && !entrustChart.isDisposed?.()) {
    entrustChart.dispose()
    entrustChart = null
  }
})
</script>

<template>
  <div class="dashboard" ref="chartRef">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header><el-icon><User /></el-icon> 用户总数</template>
          <div class="stat-number">{{ userData.total }}</div>
          <div class="stat-desc">管理员：{{ userData.admins }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header><el-icon><DocumentChecked /></el-icon> 委托总数</template>
          <div class="stat-number">{{ entrustData.total }}</div>
          <div class="stat-desc">进行中：{{ entrustData.progressing }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
          <el-card shadow="hover">
            <template #header><el-icon><CircleCloseFilled /></el-icon> 已封禁用户</template>
            <div class="stat-number">{{ userData.prohibited }}</div>
            <div class="stat-desc">占比：{{ userData.total > 0 ? Math.round((userData.prohibited / userData.total) * 100) : 0 }}%</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <template #header><el-icon><Document /></el-icon> 帖子总数</template>
            <div class="stat-number">{{ postData.total }}</div>
            <div class="stat-desc">帖子总数</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <template #header><el-icon><ChatDotRound /></el-icon> 评论总数</template>
            <div class="stat-number">{{ entrustData.commentCount + postData.commentCount }}</div>
            <div class="stat-desc">委托和帖子评论</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <template #header><el-icon><Coin /></el-icon> 全服务器金币</template>
            <div class="stat-number">{{ totalCoin }}</div>
            <div class="stat-desc">所有用户金币总和</div>
          </el-card>
        </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <div id="user-chart" style="width: 100%; height: 350px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div id="entrust-chart" style="width: 100%; height: 350px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.dashboard { padding: 20px; }
.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #409EFF;
  margin: 10px 0;
}
.stat-desc {
  color: #909399;
  font-size: 13px;
}
</style>