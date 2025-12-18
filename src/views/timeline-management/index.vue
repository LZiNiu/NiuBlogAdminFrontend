<template>
  <div class="h-full flex flex-col p-4 bg-gray-50/50">
    <!-- 1. 顶部操作栏 -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div class="flex items-center gap-3">
        <el-button type="primary" @click="openAddDialog">
          <template #icon>
            <ArtSvgIcon icon="ri:add-line" />
          </template>
          新增动态
        </el-button>

        <!-- 批量删除按钮逻辑 (与之前相同) -->
        <template v-if="!isDeleteMode">
          <el-button type="danger" plain @click="toggleDeleteMode">
            <template #icon>
              <ArtSvgIcon icon="ri:delete-bin-line" />
            </template>
            批量删除
          </el-button>
        </template>
        <template v-else>
          <el-button type="danger" @click="handleBatchDelete">
            确认删除 ({{ selectedIds.length }})
          </el-button>
          <el-button plain @click="cancelDeleteMode">取消</el-button>
        </template>
      </div>

      <!-- 年份筛选 (保持不变) -->
      <div class="flex flex-wrap gap-2 items-center">
        <div
          class="cursor-pointer px-4 py-1.5 rounded-full text-sm font-medium transition-all select-none border"
          :class="
            currentFilter === 'All'
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
          "
          @click="changeFilter('All')"
        >
          All
        </div>
        <div
          v-for="year in visibleYears"
          :key="year"
          class="cursor-pointer px-4 py-1.5 rounded-full text-sm font-medium transition-all select-none border"
          :class="
            currentFilter === String(year)
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
          "
          @click="changeFilter(String(year))"
        >
          {{ year }}
        </div>
        <!-- 更多年份下拉 -->
        <el-dropdown v-if="hiddenYears.length > 0" trigger="click" @command="changeFilter">
          <div
            class="cursor-pointer px-4 py-1.5 rounded-full text-sm font-medium transition-all select-none border flex items-center gap-1 bg-white text-gray-600 border-gray-200"
          >
            <span>{{ isHiddenYearSelected ? currentFilter : '更多' }}</span>
            <ArtSvgIcon icon="ri:arrow-down-s-line" />
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="year in hiddenYears" :key="year" :command="String(year)">
                {{ year }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 2. 内容区域 -->
    <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
      <template v-if="Object.keys(groupedData).length > 0">
        <div v-for="{ key: groupKey, items } in groupedData" :key="groupKey" class="mb-8">
          <!-- 分组标题 -->
          <div
            class="flex items-center gap-3 mb-4 sticky top-0 bg-gray-50/95 backdrop-blur z-10 py-2"
          >
            <h2 class="text-2xl font-bold text-gray-800">{{ formatGroupTitle(groupKey) }}</h2>
            <div class="h-px flex-1 bg-gray-200"></div>
          </div>

          <!-- 卡片网格 -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <TimelineCard
              v-for="item in items"
              :key="item.id"
              :data="item"
              :is-delete-mode="isDeleteMode"
              :is-selected="selectedIds.includes(item.id!)"
              @click="handleCardClick(item)"
              @toggle="toggleSelection(item.id!)"
            />
          </div>
        </div>
      </template>
      <el-empty v-else description="暂无数据" />
    </div>

    <!-- 3. 引入子组件：编辑器 -->
    <TimelineEditor
      v-model="editorVisible"
      :type="editorType"
      :edit-data="currentEditItem"
      :loading="editorLoading"
      @submit="handleEditorSubmit"
    />
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import TimelineEditor from './modules/timeline-dialog.vue' // 引入子组件
  import TimelineCard from './modules/timeline-card.vue'
  import {
    fetchBatchDeleteTimeline,
    fetchCreateTimeline,
    fetchTimelineList,
    fetchUpdateTimeline
  } from '@/api/timeline-manage'

  // --- 数据结构 ---
  type Timeline = Omit<Api.CattleBlog.TimelineEvent, 'id'> & { id?: number }

  // --- 时间轴数据(模拟+实际接受变量) ---
  const timelineList = ref<Api.CattleBlog.TimelineEvent[]>([
    // {
    //   id: 1,
    //   date: '2023-11-28',
    //   title: '博客重构完成 v2.0',
    //   content:
    //     '使用 Vue 3 + Vite + Tailwind CSS 全面重构博客，引入了暗黑模式和响应式布局，性能提升 50%。',
    //   event_type: 'milestone',
    //   images: [
    //     'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=600&auto=format&fit=crop'
    //   ]
    // },
    // {
    //   id: 2,
    //   date: '2023-10-15',
    //   title: '深入学习 Python Pybind11',
    //   content: '发布了关于 Python 调用 C++ 的系列教程，解决了 Windows 下的环境配置痛点。',
    //   event_type: 'blog',
    //   link: '/article/1'
    // },
    // {
    //   id: 3,
    //   date: '2023-08-20',
    //   title: '第一次海边旅行',
    //   content: '工作之余去了一趟青岛，感受海风，吃了海鲜，放松心情。',
    //   event_type: 'life',
    //   images: [
    //     'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop',
    //     'https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=600&auto=format&fit=crop'
    //   ]
    // }
  ])

  // --- 状态管理 ---
  const currentFilter = ref('All')
  const isDeleteMode = ref(false)
  const selectedIds = ref<number[]>([])

  // --- 编辑器(子组件)相关状态 ---
  const editorVisible = ref(false)
  const editorType = ref<'add' | 'edit'>('add')
  const currentEditItem = ref<Timeline | null>(null)
  const editorLoading = ref(false)

  // --- 1. 筛选与分组逻辑 (保持不变) ---
  const allYears = computed(() =>
    Array.from(new Set(timelineList.value.map((i) => i.date.split('-')[0]))).sort(
      (a, b) => Number(b) - Number(a)
    )
  )
  const visibleYears = computed(() => allYears.value.slice(0, 3))
  const hiddenYears = computed(() => allYears.value.slice(3))
  const isHiddenYearSelected = computed(() => hiddenYears.value.includes(currentFilter.value))

  const groupedData = computed(() => {
    const result = new Map<string, Timeline[]>()
    const sortedList = [...timelineList.value].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    if (currentFilter.value === 'All') {
      sortedList.forEach((item) => {
        const year = item.date.split('-')[0]
        if (!result.has(year)) {
          result.set(year, [])
        }
        result.get(year)!.push(item)
      })
    } else {
      sortedList
        .filter((item) => item.date.startsWith(currentFilter.value))
        .forEach((item) => {
          const monthKey = `${parseInt(item.date.split('-')[1])}月`
          if (!result.has(monthKey)) {
            result.set(monthKey, [])
          }
          result.get(monthKey)!.push(item)
        })
    }
    return Array.from(result.entries()).map(([key, items]) => ({ key, items }))
  })

  const formatGroupTitle = (key: string) => (currentFilter.value === 'All' ? `${key} 年` : key)
  const changeFilter = (val: string) => (currentFilter.value = val)

  // --- 2. 交互逻辑 ---

  // 点击新增按钮
  const openAddDialog = () => {
    editorType.value = 'add'
    currentEditItem.value = null
    editorVisible.value = true
  }

  // 点击卡片 (编辑 或 选择)
  const handleCardClick = (item: Timeline) => {
    if (isDeleteMode.value) {
      toggleSelection(item.id!)
    } else {
      editorType.value = 'edit'
      currentEditItem.value = item // 传递给子组件
      editorVisible.value = true
    }
  }

  // 处理子组件提交的数据
  const handleEditorSubmit = async (formData: Timeline) => {
    editorLoading.value = true
    try {
      if (editorType.value === 'add') {
        // 获取新增数据ID
        const response = await fetchCreateTimeline(formData)
        timelineList.value.unshift({ ...formData, id: response.id })
        ElMessage.success('新增成功')
      } else {
        await fetchUpdateTimeline(formData.id as number, formData)
        // 更新列表
        const index = timelineList.value.findIndex((t) => t.id === formData.id)
        if (index !== -1) {
          Object.assign(timelineList.value[index], { ...formData })
        }
        ElMessage.success('修改成功')
      }
      editorVisible.value = false // 关闭弹窗
    } catch (error) {
      console.error('操作失败: \n', error)
      ElMessage.error('操作失败')
    } finally {
      editorLoading.value = false
    }
  }

  // --- 3. 批量删除逻辑 (保持不变) ---
  const toggleDeleteMode = () => {
    isDeleteMode.value = true
    selectedIds.value = []
  }
  const cancelDeleteMode = () => {
    isDeleteMode.value = false
    selectedIds.value = []
  }
  const toggleSelection = (id: number) => {
    const index = selectedIds.value.indexOf(id)
    if (index > -1) selectedIds.value.splice(index, 1)
    else selectedIds.value.push(id)
  }
  const handleBatchDelete = async () => {
    if (!selectedIds.value.length) return ElMessage.warning('请选择')
    await ElMessageBox.confirm(`确认删除 ${selectedIds.value.length} 项?`, '警告', {
      type: 'warning'
    })
    try {
      console.log('删除的ID:', selectedIds.value)
      // 向后端发送删除请求
      await fetchBatchDeleteTimeline(selectedIds.value)
      timelineList.value = timelineList.value.filter(
        (item) => !selectedIds.value.includes(item.id!)
      )
      ElMessage.success('删除成功')
    } catch (error) {
      console.error('删除失败: \n', error)
      ElMessage.error('删除失败')
    } finally {
      cancelDeleteMode()
    }
  }

  onMounted(async () => {
    timelineList.value = await fetchTimelineList()
  })
</script>

<style scoped>
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #94a3b8;
  }
</style>
