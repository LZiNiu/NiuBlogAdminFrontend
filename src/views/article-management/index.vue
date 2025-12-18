<template>
  <div class="art-full-height">
    <ElCard class="art-table-card" shadow="never">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton @click="$router.push('/article-management/edit')" v-ripple> 添加 </ElButton>
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
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { ElMessageBox, ElMessage, dayjs, ElTag } from 'element-plus'
  import {
    fetchArticleList,
    fetchDeleteArticle,
    fetchBatchDeleteArticles
  } from '@/api/article-manage'
  defineOptions({ name: 'ArticleManagement' })
  const router = useRouter()
  type ArticleListItem = Api.CattleBlog.ArticleItem
  const selectedRows = ref<ArticleListItem[]>([])

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
      apiFn: fetchArticleList,
      apiParams: { current: 1, size: 10 },
      columnsFactory: () => [
        { type: 'selection' },
        { type: 'index', width: 60, label: '序号' },
        { prop: 'title', label: '标题', width: 200 },
        { prop: 'author_name', label: '作者', width: 120 },
        {
          prop: 'post_status',
          label: '状态',
          formatter: (row) => {
            return row.post_status === 'published'
              ? h(ElTag, { type: 'success' }, () => '已发布')
              : h(ElTag, { type: 'info' }, () => '草稿')
          }
        },
        {
          prop: 'category_names',
          label: '分类',
          formatter: (row) => {
            if (!row.category_names || row.category_names.length === 0) {
              return h('span', {}, '暂无分类')
            }
            return row.category_names.map((i) => {
              return h(
                ElTag,
                { type: 'primary', effect: 'plain', style: 'margin-right: 5px;' },
                () => i
              )
            })
          }
        },
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
              h(ArtButtonTable, {
                type: 'edit',
                onClick: () => router.push(`/article-management/edit?article_id=${row.id}`)
              }),
              h(ArtButtonTable, { type: 'delete', onClick: () => deleteArticle(row) })
            ])
        }
      ]
    }
  })

  const deleteArticle = (row: ArticleListItem): void => {
    ElMessageBox.confirm('确认删除？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        await fetchDeleteArticle(row.id)
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
        await fetchBatchDeleteArticles(selectedRows.value.map((i) => i.id))
        ElMessage.success('删除成功')
        refreshData()
      })
      .catch(() => {})
  }

  const handleSelectionChange = (selection: ArticleListItem[]): void => {
    selectedRows.value = selection
  }
</script>

<style scoped lang="scss"></style>
