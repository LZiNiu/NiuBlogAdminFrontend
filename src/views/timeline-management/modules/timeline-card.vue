<template>
  <div
    class="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer h-full flex flex-col"
    @click="emit('click')"
  >
    <!-- 1. 批量删除模式下的遮罩与勾选框 -->
    <!-- 
       注意：这里加了 .stop 修饰符，防止点击勾选框时冒泡触发外层的 click 
       但在父组件逻辑中，通常点击卡片任意位置在删除模式下都算选中，
       这里保留单独的 emit('toggle') 是为了支持更精细的交互需求。
    -->
    <div v-if="isDeleteMode" class="absolute top-2 left-2 z-20" @click.stop="emit('toggle')">
      <div
        class="w-6 h-6 rounded border-2 flex items-center justify-center transition-colors shadow-sm"
        :class="isSelected ? 'bg-red-500 border-red-500' : 'bg-white border-gray-300'"
      >
        <ArtSvgIcon v-if="isSelected" icon="ri:check-line" class="text-white" />
      </div>
    </div>

    <!-- 2. 卡片主体内容 -->
    <div class="p-4 flex flex-col h-full">
      <!-- 头部：标题与标签 -->
      <div class="flex justify-between items-start mb-3 gap-2">
        <div class="flex flex-col min-w-0">
          <!-- min-w-0 用于处理 flex 子项的截断问题 -->
          <span class="text-lg font-bold text-gray-800 line-clamp-1 break-all" :title="data.title">
            {{ data.title }}
          </span>
          <span class="text-xs text-gray-400 mt-0.5 font-mono">
            {{ data.date }}
          </span>
        </div>

        <!-- 类型标签 -->
        <el-tag
          :type="eventTypeColor as any"
          effect="light"
          size="small"
          class="!border-0 shrink-0"
        >
          <div class="flex items-center gap-1">
            <ArtSvgIcon :icon="eventTypeIcon" />
            <span class="capitalize">{{ data.event_type }}</span>
          </div>
        </el-tag>
      </div>

      <!-- 内容摘要 -->
      <!-- mb-4 保证与下方元素的间距，flex-1 撑开高度 -->
      <p class="text-gray-500 text-sm line-clamp-3 mb-4 flex-1 break-words">
        {{ data.content || '暂无详细内容...' }}
      </p>

      <!-- 3. 图片展示区域 (修改部分: 支持最多展示3张 grid 布局) -->
      <div
        v-if="hasImages"
        class="mb-3 h-32 w-full rounded-lg overflow-hidden border border-gray-100 grid gap-0.5"
        :class="gridClass"
      >
        <div
          v-for="(img, index) in displayImages"
          :key="index"
          class="relative w-full h-full overflow-hidden group/img"
        >
          <img
            :src="img"
            class="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
            loading="lazy"
            alt="timeline-img"
          />
        </div>
      </div>

      <!-- 底部：外链指示 -->
      <!-- 使用 mt-auto 确保即使没图片，链接也在卡片最底部（如果卡片被强制拉伸高度的话） -->
      <div
        v-if="data.link"
        class="mt-auto pt-2 border-t border-gray-50 flex items-center text-xs text-blue-500 hover:text-blue-600 hover:underline"
      >
        <ArtSvgIcon icon="ri:link" class="mr-1" />
        外部链接
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  // 类型定义
  type Timeline = Omit<Api.CattleBlog.TimelineEvent, 'id'> & { id?: number }

  const props = defineProps<{
    data: Timeline
    isDeleteMode: boolean
    isSelected: boolean
  }>()

  const emit = defineEmits<{
    (e: 'click'): void
    (e: 'toggle'): void
  }>()

  // --- 逻辑处理 ---

  // 判断是否有图片
  const hasImages = computed(() => {
    return props.data.images && Array.isArray(props.data.images) && props.data.images.length > 0
  })

  // 新增: 截取前3张图片
  const displayImages = computed(() => {
    return props.data.images?.slice(0, 3) || []
  })

  // 新增: 根据图片数量返回 Grid 列数 class
  const gridClass = computed(() => {
    const count = displayImages.value.length
    if (count === 1) return 'grid-cols-1'
    if (count === 2) return 'grid-cols-2'
    return 'grid-cols-3'
  })

  // 视图辅助：颜色映射
  const eventTypeColor = computed(() => {
    const map: Record<string, string> = {
      coding: 'primary',
      blog: 'success',
      life: 'warning',
      milestone: 'danger'
    }
    return map[props.data.event_type] || 'info'
  })

  // 视图辅助：图标映射
  const eventTypeIcon = computed(() => {
    const map: Record<string, string> = {
      coding: 'ri:code-s-slash-line',
      blog: 'ri:article-line',
      life: 'ri:cup-line',
      milestone: 'ri:flag-2-fill'
    }
    return map[props.data.event_type] || 'ri:price-tag-3-fill'
  })
</script>
