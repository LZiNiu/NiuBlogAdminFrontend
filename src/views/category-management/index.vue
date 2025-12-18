<!-- 分类管理页面 -->
<template>
  <div class="art-full-height">
    <ElCard class="art-table-card" shadow="never">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton @click="showDialog('add')" v-ripple>添加</ElButton>
            <ElButton
              @click="handleBatchDelete"
              v-ripple
              type="danger"
              :disabled="selectedRows.length === 0"
              >批量删除</ElButton
            >
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      ></ArtTable>

      <ElDialog
        v-model="dialogVisible"
        :title="dialogType === 'add' ? '新增分类' : '编辑分类'"
        align-center
      >
        <ArtForm
          v-model="formModel"
          :items="formItems"
          :span="6"
          :show-submit="false"
          :show-reset="false"
        />
        <template #footer>
          <div style="text-align: right">
            <ElButton @click="dialogVisible = false" style="margin-right: 8px">取消</ElButton>
            <ElButton type="primary" @click="submitDialog">提交</ElButton>
          </div>
        </template>
      </ElDialog>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtForm from '@/components/core/forms/art-form/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { ElMessageBox, ElMessage, dayjs } from 'element-plus'
  import { DialogType } from '@/types'
  import {
    fetchCategoryList,
    fetchCreateCategory,
    fetchUpdateCategory,
    fetchDeleteCategory,
    fetchBatchDeleteCategories
  } from '@/api/category-manage'

  defineOptions({ name: 'CategoryManagement' })

  type CategoryListItem = Api.CattleBlog.CategoryItem
  const dialogType = ref<DialogType>('add')
  const dialogVisible = ref(false)
  const currentCategoryData = ref<Partial<CategoryListItem>>({})
  const formModel = ref<Partial<CategoryListItem>>({})
  const formItems: import('@/components/core/forms/art-form/index.vue').FormItem[] = [
    { key: 'name', label: '名称', type: 'input', span: 12 },
    { key: 'description', label: '描述', type: 'input', span: 12 }
  ]

  const selectedRows = ref<CategoryListItem[]>([])

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    core: {
      apiFn: fetchCategoryList,
      apiParams: { current: 1, size: 10 },
      columnsFactory: () => [
        { type: 'selection' },
        { type: 'index', width: 60, label: '序号' },
        { prop: 'name', label: '名称', width: 200 },
        { prop: 'description', label: '描述' },
        {
          prop: 'create_time',
          label: '创建时间',
          sortable: true,
          formatter: (row) => dayjs(row.create_time).format('YYYY-MM-DD HH:mm:ss')
        },
        {
          prop: 'operation',
          label: '操作',
          fixed: 'right',
          formatter: (row) =>
            h('div', [
              h(ArtButtonTable, { type: 'edit', onClick: () => showDialog('edit', row) }),
              h(ArtButtonTable, { type: 'delete', onClick: () => deleteCategory(row) })
            ])
        }
      ]
    }
  })

  const submitDialog = async () => {
    if (dialogType.value === 'add') {
      await fetchCreateCategory(
        String(formModel.value.name || ''),
        String(formModel.value.description || '')
      )
    } else if (dialogType.value === 'edit' && currentCategoryData.value.id) {
      await fetchUpdateCategory(currentCategoryData.value.id, {
        name: formModel.value.name as string,
        description: formModel.value.description as string
      })
    }
    ElMessage.success('提交成功')
    dialogVisible.value = false
    currentCategoryData.value = {}
    formModel.value = {}
    refreshData()
  }

  const showDialog = (type: DialogType, row?: CategoryListItem): void => {
    dialogType.value = type
    currentCategoryData.value = row || {}
    formModel.value = { ...currentCategoryData.value }
    nextTick(() => {
      dialogVisible.value = true
    })
  }

  const deleteCategory = (row: CategoryListItem): void => {
    ElMessageBox.confirm('确认删除？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        await fetchDeleteCategory(row.id)
        ElMessage.success('删除成功')
        refreshData()
      })
      .catch(() => {})
  }

  const handleBatchDelete = (): void => {
    ElMessageBox.confirm('确认批量删除？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        await fetchBatchDeleteCategories(selectedRows.value.map((i) => i.id))
        ElMessage.success('删除成功')
        refreshData()
      })
      .catch(() => {})
  }

  const handleSelectionChange = (selection: CategoryListItem[]): void => {
    selectedRows.value = selection
  }
</script>

<style scoped lang="scss"></style>
