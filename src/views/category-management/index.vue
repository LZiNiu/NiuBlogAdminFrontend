<!-- 分类管理页面 -->
<template>
  <div class="category-management-page art-full-height">
    <ElCard class="art-table-card" shadow="never">
      <!-- 表格头部 -->
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton @click="showDialog('add')" v-ripple>
              {{ $t('table.button.add.categroy') }}
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

      <!-- 分类弹窗 -->
      <ElDialog
        v-model="dialogVisible"
        :title="dialogType === 'add' ? $t('table.button.add.categroy') : $t('table.button.edit')"
        width="500px"
        @close="handleDialogClose"
      >
        <ElForm ref="formRef" :model="currentCategoryData" :rules="formRules" label-width="100px">
          <ElFormItem :label="$t('table.column.category.name')" prop="name">
            <ElInput
              v-model="currentCategoryData.name"
              :placeholder="$t('table.column.category.placeholdername')"
            />
          </ElFormItem>
          <ElFormItem :label="$t('table.column.category.description')" prop="description">
            <ElInput
              v-model="currentCategoryData.description"
              :placeholder="$t('table.column.category.placeholderdescription')"
              type="textarea"
            />
          </ElFormItem>
        </ElForm>

        <template #footer>
          <ElButton @click="dialogVisible = false">{{ $t('common.cancel') }}</ElButton>
          <ElButton type="primary" @click="handleDialogSubmit">{{ $t('common.confirm') }}</ElButton>
        </template>
      </ElDialog>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { useTable } from '@/hooks/core/useTable'
  import { ElMessageBox, ElMessage, type FormInstance } from 'element-plus'
  import { DialogType } from '@/types'
  import { h, nextTick, ref } from 'vue'
  import { useI18n } from 'vue-i18n'

  defineOptions({ name: 'CategoryManagement' })

  const { t } = useI18n()

  // 分类数据类型
  interface CategoryItem {
    id: number
    name: string
    description: string
    sort: number
    createTime: string
    updateTime: string
  }

  // 弹窗相关
  const formRef = ref<FormInstance>()
  const dialogType = ref<DialogType>('add')
  const dialogVisible = ref(false)
  const currentCategoryData = ref<Partial<CategoryItem>>({})

  // 选中行
  const selectedRows = ref<CategoryItem[]>([])

  // 表单校验规则
  const formRules = {
    name: [{ required: true, message: t('categoryManagement.rule.nameRequired'), trigger: 'blur' }]
  }

  // 模拟获取分类列表的函数
  const fetchGetCategoryList = async (params: any) => {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    // 生成模拟数据
    const mockData: CategoryItem[] = [
      {
        id: 1,
        name: '技术',
        description: '技术相关文章',
        sort: 1,
        createTime: '2023-01-15 09:30:00',
        updateTime: '2023-01-15 09:30:00'
      },
      {
        id: 2,
        name: '生活',
        description: '生活随笔',
        sort: 2,
        createTime: '2023-02-20 14:22:15',
        updateTime: '2023-02-20 14:22:15'
      },
      {
        id: 3,
        name: '旅行',
        description: '旅行见闻',
        sort: 3,
        createTime: '2023-03-10 11:45:30',
        updateTime: '2023-03-10 11:45:30'
      },
      {
        id: 4,
        name: '美食',
        description: '美食分享',
        sort: 4,
        createTime: '2023-04-05 16:12:45',
        updateTime: '2023-04-05 16:12:45'
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
      apiFn: fetchGetCategoryList,
      apiParams: {
        current: 1,
        size: 20
      },
      columnsFactory: () => [
        { type: 'selection' }, // 勾选列
        { type: 'index', width: 60, label: t('table.column.index') }, // 序号
        {
          prop: 'name',
          label: t('table.column.category.name')
        },
        {
          prop: 'description',
          label: t('table.column.category.description')
        },
        {
          prop: 'created_at',
          label: t('table.column.category.create_time'),
          width: 180
        },
        {
          prop: 'updateTime',
          label: t('table.column.category.update_time'),
          width: 180
        },
        {
          prop: 'operation',
          label: t('table.column.operation'),
          width: 150,
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
                () => t('common.table.column.edit')
              ),
              h(
                'ElButton',
                {
                  type: 'danger',
                  size: 'small',
                  onClick: () => deleteCategory(row),
                  text: true,
                  bg: true
                },
                () => t('common.table.column.delete')
              )
            ])
        }
      ]
    }
  })

  /**
   * 显示分类弹窗
   */
  const showDialog = (type: DialogType, row?: CategoryItem): void => {
    dialogType.value = type
    currentCategoryData.value = row || {}
    nextTick(() => {
      dialogVisible.value = true
    })
  }

  /**
   * 删除分类
   */
  const deleteCategory = (row: CategoryItem): void => {
    ElMessageBox.confirm(t('common.deleteConfirmMessage'), t('common.deleteConfirmTitle'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    })
      .then(() => {
        // 这里应该调用删除分类的API
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
    if (!formRef.value) return

    await formRef.value.validate((valid) => {
      if (valid) {
        try {
          // 这里应该调用添加或编辑分类的API
          ElMessage.success(
            dialogType.value === 'add' ? t('common.addSuccess') : t('common.editSuccess')
          )
          dialogVisible.value = false
          refreshData()
        } catch (error) {
          console.error(t('common.submitError'), error)
        }
      }
    })
  }

  /**
   * 处理弹窗关闭事件
   */
  const handleDialogClose = () => {
    currentCategoryData.value = {}
    formRef.value?.resetFields()
  }

  /**
   * 处理表格行选择变化
   */
  const handleSelectionChange = (selection: CategoryItem[]): void => {
    selectedRows.value = selection
  }
</script>

<style scoped lang="scss">
  .category-management-page {
    // 可以添加特定样式
  }
</style>
