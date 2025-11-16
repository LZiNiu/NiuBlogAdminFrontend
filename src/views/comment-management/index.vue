<!-- 评论管理页面 -->
<template>
  <div class="comment-management-page art-full-height">
    <ElCard class="art-table-card" shadow="never">
      <!-- 表格头部 -->
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton
              @click="handleBatchDelete"
              v-ripple
              type="danger"
              :disabled="selectedRows.length === 0"
            >
              {{ $t('table.button.batchDelete') }}
            </ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <!-- 表格 -->
      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
      </ArtTable>
    </ElCard>

    <!-- 评论详情弹窗 -->
    <ElDialog
      v-model="detailDialogVisible"
      :title="$t('table.column.comment.commentDetail')"
      width="600px"
    >
      <ElForm label-width="100px" label-position="left">
        <ElFormItem :label="$t('table.column.comment.article')">
          <span>{{ currentCommentData.articleTitle }}</span>
        </ElFormItem>
        <ElFormItem :label="$t('table.column.comment.nickname')">
          <span>{{ currentCommentData.nickname }}</span>
        </ElFormItem>
        <ElFormItem :label="$t('table.column.comment.email')">
          <span>{{ currentCommentData.email }}</span>
        </ElFormItem>
        <ElFormItem :label="$t('table.column.comment.content')">
          <div v-html="currentCommentData.content"></div>
        </ElFormItem>
        <ElFormItem :label="$t('table.column.comment.create_time')">
          <span>{{ currentCommentData.createTime }}</span>
        </ElFormItem>
        <ElFormItem :label="$t('table.column.comment.status')">
          <ElTag :type="currentCommentData.status === '1' ? 'success' : 'info'">
            {{
              currentCommentData.status === '1'
                ? $t('table.column.comment.status.approved')
                : $t('table.column.comment.status.pending')
            }}
          </ElTag>
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="detailDialogVisible = false">{{ $t('common.cancel') }}</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { useTable } from '@/hooks/core/useTable'
  import { ElMessageBox, ElMessage, ElTag, ElButton } from 'element-plus'
  import { h, ref } from 'vue'
  import { useI18n } from 'vue-i18n'

  defineOptions({ name: 'CommentManagement' })

  const { t } = useI18n()

  // 评论数据类型
  interface CommentItem {
    id: number
    articleTitle: string
    nickname: string
    email: string
    content: string
    status: string // 1: 已审核, 0: 待审核
    createTime: string
  }

  // 弹窗相关
  const detailDialogVisible = ref(false)
  const currentCommentData = ref<CommentItem>({
    id: 0,
    articleTitle: '',
    nickname: '',
    email: '',
    content: '',
    status: '0',
    createTime: ''
  })

  // 选中行
  const selectedRows = ref<CommentItem[]>([])

  // 模拟获取评论列表的函数
  const fetchGetCommentList = async (params: any) => {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    // 生成模拟数据
    const mockData: CommentItem[] = [
      {
        id: 1,
        articleTitle: 'Vue 3 从入门到精通',
        nickname: '张三',
        email: 'zhangsan@example.com',
        content: '这篇文章写得非常好，让我对 Vue 3 的理解更加深入了！',
        status: '1',
        createTime: '2023-01-15 09:30:00'
      },
      {
        id: 2,
        articleTitle: 'React Hooks 使用详解',
        nickname: '李四',
        email: 'lisi@example.com',
        content: '感谢分享，学到了很多实用的技巧。',
        status: '1',
        createTime: '2023-02-20 14:22:15'
      },
      {
        id: 3,
        articleTitle: 'JavaScript 异步编程',
        nickname: '王五',
        email: 'wangwu@example.com',
        content: '写的不错，但是有些地方可以再详细一些。',
        status: '0',
        createTime: '2023-03-10 11:45:30'
      },
      {
        id: 4,
        articleTitle: 'CSS 布局技巧',
        nickname: '赵六',
        email: 'zhaoliu@example.com',
        content: '收藏了，以后会用到的。',
        status: '1',
        createTime: '2023-04-05 16:12:45'
      },
      {
        id: 5,
        articleTitle: 'Node.js 性能优化',
        nickname: '钱七',
        email: 'qianqi@example.com',
        content: '大佬牛逼！学到了很多实用的优化技巧。',
        status: '1',
        createTime: '2023-05-12 08:30:00'
      }
    ]

    // 模拟分页
    const { current = 1, size = 10 } = params
    const start = (current - 1) * size
    const end = start + size
    const pageData = mockData.slice(start, end)

    return {
      records: pageData,
      total: mockData.length,
      current,
      size
    }
  }

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    // 核心配置
    core: {
      apiFn: fetchGetCommentList,
      apiParams: {
        current: 1,
        size: 20
      },
      columnsFactory: () => [
        { type: 'selection' }, // 勾选列
        { type: 'index', width: 60, label: t('commentManagement.columns.index') }, // 序号
        {
          prop: 'articleTitle',
          label: t('commentManagement.columns.article')
        },
        {
          prop: 'nickname',
          label: t('table.column.comment.nickname')
        },
        {
          prop: 'content',
          label: t('table.column.comment.content'),
          formatter: (row) => {
            // 截取内容前50个字符
            const content = row.content
            return content.length > 50 ? content.substring(0, 50) + '...' : content
          }
        },
        {
          prop: 'status',
          label: t('table.column.comment.status'),
          formatter: (row) => {
            return h(
              ElTag,
              {
                type: row.status === '1' ? 'success' : 'info'
              },
              () =>
                row.status === '1'
                  ? t('commentManagement.status.approved')
                  : t('commentManagement.status.pending')
            )
          }
        },
        {
          prop: 'createTime',
          label: t('table.column.create_time')
        },
        {
          prop: 'operation',
          label: t('table.column.operation'),
          fixed: 'right', // 固定列
          formatter: (row) =>
            h('div', [
              h(
                ElButton,
                {
                  type: 'primary',
                  size: 'small',
                  onClick: () => showDetail(row),
                  text: true,
                  bg: true
                },
                () => t('commentManagement.detail')
              ),
              h(
                ElButton,
                {
                  type: row.status === '1' ? 'warning' : 'success',
                  size: 'small',
                  onClick: () => toggleStatus(row),
                  text: true,
                  bg: true
                },
                () =>
                  row.status === '1'
                    ? t('commentManagement.disapprove')
                    : t('commentManagement.approve')
              ),
              h(
                ElButton,
                {
                  type: 'danger',
                  size: 'small',
                  onClick: () => deleteComment(row),
                  text: true,
                  bg: true
                },
                () => t('commentManagement.delete')
              )
            ])
        }
      ]
    }
  })

  /**
   * 显示评论详情
   */
  const showDetail = (row: CommentItem): void => {
    currentCommentData.value = { ...row }
    detailDialogVisible.value = true
  }

  /**
   * 切换评论状态（审核/未审核）
   */
  const toggleStatus = (row: CommentItem): void => {
    // 这里应该调用切换评论状态的API
    ElMessage.success(
      row.status === '1'
        ? t('commentManagement.disapproveSuccess')
        : t('commentManagement.approveSuccess')
    )
    refreshData()
  }

  /**
   * 删除评论
   */
  const deleteComment = (row: CommentItem): void => {
    ElMessageBox.confirm(
      t('commentManagement.deleteConfirmMessage'),
      t('commentManagement.deleteConfirmTitle'),
      {
        confirmButtonText: t('commentManagement.confirm'),
        cancelButtonText: t('commentManagement.cancel'),
        type: 'warning'
      }
    )
      .then(() => {
        // 这里应该调用删除评论的API
        ElMessage.success(t('commentManagement.deleteSuccess'))
        refreshData()
      })
      .catch(() => {
        // 用户取消删除
      })
  }

  /**
   * 批量删除评论
   */
  const handleBatchDelete = (): void => {
    ElMessageBox.confirm(
      t('commentManagement.batchDeleteConfirmMessage'),
      t('commentManagement.batchDeleteConfirmTitle'),
      {
        confirmButtonText: t('commentManagement.confirm'),
        cancelButtonText: t('commentManagement.cancel'),
        type: 'warning'
      }
    )
      .then(() => {
        // 这里应该调用批量删除评论的API
        ElMessage.success(t('commentManagement.batchDeleteSuccess'))
        refreshData()
      })
      .catch(() => {
        // 用户取消删除
      })
  }

  /**
   * 处理表格行选择变化
   */
  const handleSelectionChange = (selection: CommentItem[]): void => {
    selectedRows.value = selection
  }
</script>

<style scoped lang="scss"></style>
