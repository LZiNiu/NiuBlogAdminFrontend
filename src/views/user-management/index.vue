<template>
  <div class="user-management-page art-full-height">
    <!-- 搜索栏 -->
    <UserSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams" />

    <ElCard class="art-table-card" shadow="never">
      <!-- 表格头部 -->
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton @click="showDialog('add')" v-ripple>
              {{ $t('table.button.add.user') }}
            </ElButton>
            <ElButton
              @click="handleBatchDelete"
              v-ripple
              type="danger"
              :disabled="selectedRows.length === 0"
            >
              {{ $t('table.button.delete') }}
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

      <!-- 用户弹窗 -->
      <UserDialog
        v-model:visible="dialogVisible"
        :type="dialogType"
        :user-data="currentUserData"
        @submit="handleDialogSubmit"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { useTable } from '@/hooks/core/useTable'
  import UserSearch from './modules/user-search.vue'
  import UserDialog from './modules/user-dialog.vue'
  import { ElTag, ElMessageBox, ElImage, ElMessage, dayjs } from 'element-plus'
  import { DialogType } from '@/types'
  import { useI18n } from 'vue-i18n'
  import { fetchUserList, fetchDeleteUser } from '@/api/user-manage'

  defineOptions({ name: 'UserManagement' })

  const { t } = useI18n()

  type UserListItem = Api.UserManage.UserListItem
  // 弹窗相关
  const dialogType = ref<DialogType>('add')
  const dialogVisible = ref(false)
  const currentUserData = ref<Partial<UserListItem>>({})

  // 选中行
  const selectedRows = ref<UserListItem[]>([])

  // 搜索表单
  const searchForm = ref({
    user_id: undefined,
    username: undefined,
    email: undefined,
    status: undefined,
    role: undefined,
    is_active: undefined
  })

  // 用户状态配置
  const USER_STATUS_CONFIG = {
    1: { type: 'success' as const, text: t('table.column.user.is_active.enabled') },
    0: { type: 'danger' as const, text: t('table.column.user.is_active.disabled') }
  } as const

  /**
   * 获取用户状态配置
   */
  const getUserStatusConfig = (status: boolean) => {
    const statusKey = status ? 1 : 0
    return (
      USER_STATUS_CONFIG[statusKey as keyof typeof USER_STATUS_CONFIG] || {
        type: 'info' as const,
        text: t('table.column.user.is_active.unknown')
      }
    )
  }

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    searchParams,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    // 核心配置
    core: {
      apiFn: fetchUserList,
      apiParams: {
        current: 1,
        size: 10,
        ...searchForm.value
      },
      columnsFactory: () => [
        { type: 'selection' }, // 勾选列
        { type: 'index', width: 60, label: t('table.column.index') }, // 序号
        {
          prop: 'username',
          label: t('table.column.user.username')
        },
        {
          prop: 'nickname',
          label: t('table.column.user.nickname')
        },
        {
          prop: 'is_active',
          label: t('table.column.user.status'),
          formatter: (row) => {
            const statusConfig = getUserStatusConfig(row.is_active)
            return h(ElTag, { type: statusConfig.type }, () => statusConfig.text)
          }
        },
        {
          prop: 'created_at',
          label: t('table.column.user.create_time'),
          sortable: true,
          formatter: (row) => {
            return dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss')
          }
        },
        {
          prop: 'avatar_url',
          label: t('table.column.user.avatar'),
          formatter: (row) => {
            return h(ElImage, {
              class: 'size-9.5 rounded-md',
              src: row.avatar_url,
              previewSrcList: [row.avatar_url],
              // 图片预览是否插入至 body 元素上，用于解决表格内部图片预览样式异常
              previewTeleported: true
            })
          }
        },
        {
          prop: 'operation',
          label: t('table.column.operation'),
          fixed: 'right', // 固定列
          formatter: (row) =>
            h('div', [
              h(
                'ElButton',
                {
                  type: 'primary',
                  size: 'small',
                  onClick: () => showDialog('edit', row),
                  text: true,
                  bg: true
                },
                () => t('table.button.edit')
              ),
              h(
                'ElButton',
                {
                  type: 'danger',
                  size: 'small',
                  onClick: () => deleteUser(row),
                  text: true,
                  bg: true
                },
                () => t('table.button.delete')
              )
            ])
        }
      ]
    }
  })

  /**
   * 搜索处理
   * @param params 参数
   */
  const handleSearch = (params: Record<string, any>) => {
    // 搜索参数赋值
    Object.assign(searchParams, params)
    getData()
  }

  /**
   * 显示用户弹窗
   */
  const showDialog = (type: DialogType, row?: UserListItem): void => {
    dialogType.value = type
    currentUserData.value = row || {}
    nextTick(() => {
      dialogVisible.value = true
    })
  }

  /**
   * 删除用户
   */
  const deleteUser = (row: UserListItem): void => {
    ElMessageBox.confirm(t('common.confirm'), t('common.cancel'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    })
      .then(() => {
        // 这里应该调用删除用户的API
        fetchDeleteUser(row.id)
        ElMessage.success(t('common.deleteSuccess'))
        refreshData()
      })
      .catch(() => {
        // 用户取消删除
      })
  }

  /**
   * 批量删除用户
   */
  const handleBatchDelete = (): void => {
    ElMessageBox.confirm(t('common.batchDeleteConfirmMessage'), t('common.deleteConfirmTitle'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    })
      .then(() => {
        // 这里应该调用批量删除用户的API
        ElMessage.success(t('common.deleteSuccess'))
        refreshData()
      })
      .catch(() => {
        // 用户取消删除
      })
  }

  /**
   * 处理弹窗提交事件
   */
  const handleDialogSubmit = async () => {
    try {
      dialogVisible.value = false
      currentUserData.value = {}
      refreshData()
    } catch (error) {
      console.error(t('common.submitError'), error)
    }
  }

  /**
   * 处理表格行选择变化
   */
  const handleSelectionChange = (selection: UserListItem[]): void => {
    selectedRows.value = selection
  }
</script>

<style scoped lang="scss">
  .user-management-page {
    .user {
      .user-name {
        font-weight: 500;
      }

      .email {
        font-size: 12px;
        color: var(--art-gray-500);
      }
    }
  }
</style>
