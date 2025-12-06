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
      <ElDialog
        v-model="userStatusChangeDialogVisible"
        title="切换状态  确认操作"
        align-center
        style="padding: 10px; height: 30%; width: 25%"
      >
        <div style="text-align: center; line-height: 1.6; font-size: 14px; color: #606266">
          您确定要执行此操作吗?<br />此操作不可撤销。
        </div>

        <template #footer>
          <div style="text-align: right">
            <ElButton @click="userStatusChangeDialogVisible = false" style="margin-right: 8px">
              取消
            </ElButton>
            <ElButton type="primary" @click="changeUserStatus">提交</ElButton>
          </div>
        </template>
      </ElDialog>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import UserSearch from './modules/user-search.vue'
  import UserDialog from './modules/user-dialog.vue'
  import { ElTag, ElMessageBox, ElImage, ElMessage, dayjs, ElButton } from 'element-plus'
  import { DialogType } from '@/types'
  import { useI18n } from 'vue-i18n'
  import { fetchUserList, fetchDeleteUser, fetchUpdateUserStatus } from '@/api/user-manage'

  defineOptions({ name: 'UserManagement' })

  const { t } = useI18n()

  type UserListItem = Api.CattleBlog.UserListItem
  // 弹窗相关
  const dialogType = ref<DialogType>('add')
  const dialogVisible = ref(false)
  const currentUserData = ref<Partial<UserListItem>>({})
  const userStatusChangeDialogVisible = ref(false)

  // 选中行
  const selectedRows = ref<UserListItem[]>([])
  // 被点击更新状态的行
  const userStatusChangeRow = ref<UserListItem | null>(null)
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
          label: t('table.column.user.username'),
          width: 120
        },
        {
          prop: 'nickname',
          label: t('table.column.user.nickname'),
          width: 120
        },
        {
          prop: 'email',
          label: t('table.column.user.email')
        },
        {
          prop: 'is_active',
          label: t('table.column.user.status'),
          width: 90,
          formatter: (row) => {
            const statusConfig = getUserStatusConfig(row.is_active)
            return h(
              ElButton,
              {
                type: statusConfig.type,
                onClick: () => {
                  userStatusChangeDialogVisible.value = true
                  userStatusChangeRow.value = row
                },
                size: 'small',
                style: 'font-size: 12px'
              },
              () => statusConfig.text
            )
          }
        },
        {
          prop: 'role',
          label: t('table.column.user.role'),
          width: 100,
          formatter: (row) => {
            return h(ElTag, { type: 'primary', effect: 'plain' }, () => row.role)
          }
        },
        {
          prop: 'create_time',
          label: t('table.column.user.create_time'),
          sortable: true,
          formatter: (row) => {
            return dayjs(row.create_time).format('YYYY-MM-DD HH:mm:ss')
          }
        },
        {
          prop: 'avatar_url',
          label: t('table.column.user.avatar'),
          width: 80,
          formatter: (row) => {
            return h(ElImage, {
              class: 'size-10 rounded-md',
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
              h(ArtButtonTable, {
                type: 'edit',
                onClick: () => showDialog('edit', row)
              }),
              h(ArtButtonTable, {
                type: 'delete',
                onClick: () => deleteUser(row)
              })
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
    console.log('当前行数据:', row)
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
  // 修改用户状态
  const changeUserStatus = async () => {
    // 取反状态
    // if (userStatusChangeRow.value.id === -1) {
    //   console.log('user-management: status-tag click: 非法修改')
    //   return
    // }
    // 请求修改用户状态
    if (userStatusChangeRow.value === null) {
      console.log('user-management: status-tag click: 非法修改')
      return
    }
    try {
      await fetchUpdateUserStatus(
        userStatusChangeRow.value.id,
        !userStatusChangeRow.value.is_active
      )
      ElMessage.success('更新成功')
      userStatusChangeRow.value.is_active = !userStatusChangeRow.value.is_active
    } catch (error) {
      console.error(t('common.submitError'), error)
    } finally {
      userStatusChangeDialogVisible.value = false
    }
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
