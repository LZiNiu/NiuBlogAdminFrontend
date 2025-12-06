<template>
  <!-- 外层容器 -->
  <div class="article-publish-container">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="title">{{ isEditMode ? '编辑文章' : '发布新文章' }}</h2>
      </div>
      <div class="header-right">
        <!-- 文件导入功能 -->
        <el-upload
          action=""
          :auto-upload="false"
          :show-file-list="false"
          accept=".md,.txt"
          :on-change="handleFileImport"
        >
          <el-button type="primary" size="large" plain class="import-btn">
            <template #icon>
              <ArtSvgIcon icon="ri:file-add-line" class="text-base" />
            </template>
            导入 Markdown / TXT
          </el-button>
        </el-upload>
      </div>
    </div>

    <el-form
      ref="ruleFormRef"
      :model="form"
      :rules="rules"
      label-width="80px"
      class="article-form"
      status-icon
      size="large"
    >
      <!-- 文章标题 -->
      <el-form-item label="文章标题" prop="title">
        <el-input
          v-model="form.title"
          placeholder="请输入精彩的文章标题"
          clearable
          maxlength="100"
          show-word-limit
          class="title-input"
        />
      </el-form-item>

      <!-- 作者与时间 -->
      <el-row :gutter="30">
        <el-col :span="12" :xs="24">
          <el-form-item label="作者" prop="author_name">
            <el-input v-model="form.author_name" placeholder="请输入作者昵称">
              <template #prefix>
                <ArtSvgIcon icon="ri:account-circle-fill" class="text-xl" />
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12" :xs="24">
          <!-- <el-form-item label="发布时间" prop="create_time">
            <el-date-picker
              v-model="form.create_time"
              type="datetime"
              placeholder="选择日期时间"
              style="width: 100%"
            />
          </el-form-item> -->
        </el-col>
      </el-row>

      <!-- 摘要 -->
      <el-form-item label="文章摘要" prop="summary">
        <el-input
          v-model="form.summary"
          type="textarea"
          :rows="3"
          placeholder="请输入文章摘要，好的摘要能带来更多阅读量（支持 SEO）"
        />
      </el-form-item>

      <!-- 分类管理 -->
      <el-form-item label="文章分类" prop="category_names">
        <div class="meta-layout">
          <div class="meta-left">
            <el-input-tag
              v-model="form.category_names"
              placeholder="输入分类回车添加..."
              clearable
              tag-type="primary"
              tag-effect="light"
            />
            <div class="input-tip">提示：输入新分类后按回车创建，仅限文字与字母。</div>
          </div>
          <div class="meta-right">
            <div class="lib-header">
              <ArtSvgIcon icon="ri:folder-fill" class="text-xl" />
              <span>分类库 (点击选择)</span>
            </div>
            <div class="lib-content">
              <el-tag
                v-for="cat in availableCategories"
                :key="cat.id"
                class="lib-tag pointer-tag"
                :type="form.category_names?.includes(cat.name) ? 'info' : undefined"
                :effect="form.category_names?.includes(cat.name) ? 'dark' : 'plain'"
                @click="handleSelectFromLib(cat.name, 'category')"
              >
                {{ cat.name }}
              </el-tag>
            </div>
          </div>
        </div>
      </el-form-item>

      <!-- 标签管理 -->
      <el-form-item label="文章标签" prop="tag_names">
        <div class="meta-layout">
          <div class="meta-left">
            <el-input-tag
              v-model="form.tag_names"
              placeholder="输入标签回车添加..."
              clearable
              tag-type="success"
              tag-effect="light"
            />
            <div class="input-tip">提示：输入新标签后按回车创建，仅限文字与字母。</div>
          </div>
          <div class="meta-right">
            <div class="lib-header">
              <ArtSvgIcon icon="ri:price-tag-3-fill" class="text-xl" />
              <span>热门标签 (点击选择)</span>
            </div>
            <div class="lib-content">
              <el-tag
                v-for="tag in availableTags"
                :key="tag.id"
                class="lib-tag pointer-tag"
                type="success"
                :effect="form.tag_names?.includes(tag.name) ? 'dark' : 'plain'"
                @click="handleSelectFromLib(tag.name, 'tag')"
              >
                {{ tag.name }}
              </el-tag>
            </div>
          </div>
        </div>
      </el-form-item>

      <!-- Markdown 编辑器 -->
      <el-form-item label="文章内容" prop="content" class="editor-item editor-last-item">
        <MdEditor
          v-model="form.content"
          placeholder="开始你的创作之旅..."
          class="markdown-editor"
          :toolbarsExclude="['github']"
        />
      </el-form-item>

      <!-- 底部操作栏 -->
      <div class="sticky-footer">
        <el-button size="large" @click="handleCancel">取消</el-button>
        <el-button size="large" type="warning" @click="handleSubmit('draft')">保存为草稿</el-button>
        <el-button size="large" type="primary" @click="handleSubmit('published')"
          >立即发布</el-button
        >
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted, watch } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ElMessage, ElMessageBox, type UploadFile } from 'element-plus'
  import { MdEditor } from 'md-editor-v3'
  import 'md-editor-v3/lib/style.css'
  import { useUserStore } from '@/store/modules/user'
  import {
    fetchArticleEdit,
    fetchCreateArticle,
    fetchUpdateArticleEdit
  } from '@/api/article-manage'
  import { fetchAllTags, fetchCreateTag } from '@/api/tag-manage'
  import { fetchAllCategories, fetchCreateCategory } from '@/api/category-manage'

  const userStore = useUserStore()
  // --- 状态管理 ---
  const router = useRouter()
  const route = useRoute()
  const ruleFormRef = ref()
  const isEditMode = ref(false)
  const articleId = ref<number | null>(null)
  // 【修复关键点 1】：在组件初始化时，捕获当前页面的基础路径
  // 比如 "/article/publish"，这样我们就能知道这个组件只属于这个路径
  // const currentRoutePath = route.path

  // 标签/分类库数据 (包含 ID)
  const availableCategories = ref<Api.CattleBlog.CategoryItem[]>([
    { id: 1, name: '前端开发', description: '' },
    { id: 2, name: '后端架构', description: '' },
    { id: 3, name: '人工智能', description: '' },
    { id: 4, name: 'DevOps', description: '' },
    { id: 5, name: '生活随笔', description: '' },
    { id: 6, name: '设计灵感', description: '' }
  ])
  const availableTags = ref<Api.CattleBlog.TagItem[]>([
    { id: 1, name: 'Vue3' },
    { id: 2, name: 'React' },
    { id: 3, name: 'Spring Boot' },
    { id: 4, name: 'Docker' },
    { id: 5, name: 'Redis' },
    { id: 6, name: 'TypeScript' },
    { id: 7, name: 'K8s' },
    { id: 8, name: '微服务' },
    { id: 9, name: 'Golang' }
  ])

  // 表单数据 (v-model 绑定的是 string[])
  const form = reactive({
    title: '',
    author_name: '',
    summary: '',
    category_names: [] as string[], // 前端展示用
    tag_names: [] as string[], // 前端展示用
    content: '',
    post_status: 'draft'
  })

  const rules = {
    title: [{ required: true, message: '请输入文章标题', trigger: 'blur' }],
    author_name: [{ required: true, message: '请输入作者', trigger: 'blur' }],
    content: [{ required: true, message: '文章内容不能为空', trigger: 'blur' }]
  }

  // --- 核心逻辑 ---
  // 重置表单 (用于切换到新增模式)
  const resetForm = () => {
    form.title = ''
    form.author_name = 'Cattle' // 默认值
    form.summary = ''
    form.category_names = []
    form.tag_names = []
    form.content = ''
    form.post_status = 'draft'

    isEditMode.value = false
    articleId.value = null
  }

  const loadArticleData = async (id: number) => {
    try {
      // 模拟后端返回的数据，通常后端返回详情时会包含 tags: [{id:1, name:'Vue'}]
      // 这里简化模拟，假设我们也拿到了 names。
      // *重要*：真实场景中，load 之后需要确保 availableTags 里包含了这些回显的标签，
      // 否则提交时可能找不到 ID。
      // const mockMeta = {
      //   id: id,
      //   title: 'Vue3 组件化实战',
      //   summary: '如何优雅地构建 Element Plus 风格的后台管理系统。',
      //   author_name: 'Admin',
      //   create_time: new Date(),
      //   category_names: ['前端开发'],
      //   tag_names: ['Vue3'],
      //   post_status: 'draft'
      // }
      // const mockContent = '# 导读\n\n本文将介绍...'
      const article_edit_info = await fetchArticleEdit(id)
      const { content: articleContent, ...articleMeta } = article_edit_info
      console.log('articleMeta:', articleMeta)
      // console.log('articleContent:', articleContent)
      // Object.assign(form, mockMeta)
      // form.content = mockContent
      const cleanObj = Object.fromEntries(
        Object.entries(articleMeta).filter(([, value]) => value != null) // 排除 null 和 undefined
      )
      Object.assign(form, cleanObj)
      form.content = articleContent
      if (!form.author_name) form.author_name = userStore.getUserInfo.nickname || 'Cattle'
    } catch (error) {
      ElMessage.error('获取文章数据失败')
      console.error('获取文章数据失败:', error)
    }
  }
  // 统一页面初始化入口
  const initPage = async (targetId?: string | null) => {
    // 如果没传参数，就取当前路由的参数
    const idParam = targetId !== undefined ? targetId : route.query.article_id

    // 确保基础数据已加载 (可选，根据你的逻辑决定是否保留在这里)
    availableCategories.value = await fetchAllCategories()
    availableTags.value = await fetchAllTags()

    if (idParam) {
      // 编辑模式
      const newId = Number(idParam)
      // 只有当 ID 确实变化时才加载
      if (articleId.value !== newId) {
        resetForm()
        articleId.value = newId // 关键：更新当前的 ID 状态
        await loadArticleData(newId)
      }
    } else {
      // 新增模式
      resetForm()
    }
  }
  const isValidName = (val: string): boolean => {
    const regex = /^[\u4e00-\u9fa5a-zA-Z0-9\s]+$/
    return regex.test(val)
  }

  // --- 标签/分类 处理逻辑 ---

  const processNewTag = async (newVal: string[], oldVal: string[], type: 'tag' | 'category') => {
    if (newVal.length <= oldVal.length) return
    const newItemName = newVal[newVal.length - 1]

    // 1. 查重
    if (newVal.filter((item) => item === newItemName).length > 1) {
      ElMessage.warning('该项已存在')
      if (type === 'tag') form.tag_names.pop()
      else form.category_names.pop()
      return
    }

    // 2. 格式校验
    if (!isValidName(newItemName)) {
      ElMessage.warning('包含非法字符，仅允许文字与字母')
      if (type === 'tag') form.tag_names.pop()
      else form.category_names.pop()
      return
    }

    // 3. 检查库中是否存在
    const availableList = type === 'tag' ? availableTags.value : availableCategories.value

    const existsInLib = availableList.some((item) => item.name === newItemName)

    if (!existsInLib) {
      try {
        // 模拟调用 API 创建，并获取后端返回的带 ID 的新对象
        // console.log(`[API Mock] Creating new ${type}:`, newItemName)
        // // const res = await api.create({ name: newItemName })
        // // 模拟返回
        // const newId = Math.floor(Math.random() * 1000) + 100
        const newItem =
          type === 'tag'
            ? await fetchCreateTag(newItemName)
            : await fetchCreateCategory(newItemName)

        ElMessage.success(`已新建: ${newItemName} (ID: ${newItem.id})`)

        // *关键步骤*：将新创建的带 ID 的对象加入本地库，以便提交时能查到 ID
        if (type === 'tag') {
          availableTags.value.push(newItem)
        } else {
          availableCategories.value.push(newItem)
        }
      } catch (e) {
        ElMessage.error('创建失败')
        console.error('创建失败:', e)
        if (type === 'tag') form.tag_names.pop()
        else form.category_names.pop()
      }
    }
  }

  watch(
    () => [...form.tag_names],
    (newVal, oldVal) => processNewTag(newVal, oldVal, 'tag')
  )
  watch(
    () => [...form.category_names],
    (newVal, oldVal) => processNewTag(newVal, oldVal, 'category')
  )

  const handleSelectFromLib = (name: string, type: 'tag' | 'category') => {
    const targetList = type === 'tag' ? form.tag_names : form.category_names
    if (targetList.includes(name)) return
    targetList.push(name)
  }

  // --- 文件导入 ---
  const handleFileImport = (uploadFile: UploadFile) => {
    const rawFile = uploadFile.raw
    if (!rawFile) return

    const isText = rawFile.type === 'text/plain' || rawFile.name.endsWith('.md')
    if (!isText) {
      ElMessage.error('仅支持导入 .md 或 .txt 文件')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        form.content = e.target.result as string
        ElMessage.success(`成功读取文件: ${rawFile.name}`)
      }
    }
    reader.readAsText(rawFile)

    // 获取文件名并设置为文章标题（如果标题为空）
    if (!form.title && rawFile.name) {
      const fileName = rawFile.name.replace(/\.(md|txt)$/i, '')
      form.title = fileName
    }
  }

  // --- 提交逻辑 (数据转换) ---
  const handleSubmit = async (status: string) => {
    if (!ruleFormRef.value) return
    await ruleFormRef.value.validate(async (valid: boolean) => {
      if (valid) {
        // 内容为空时，提示并返回
        if (!form.content) {
          ElMessage.warning('请填写内容')
          return
        }
        // 1. 将 form.tag_names (string[]) 转换为 tag_ids (number[])
        // 逻辑：遍历用户选中的名字，去 availableTags 库里找对应的 ID
        const tagIds: number[] = []
        const categoryIds: number[] = []

        // 用于存放没找到ID的名字（虽然理论上创建流程保证了库里肯定有）
        const unknownTagNames: string[] = []
        const unknownCategoryNames: string[] = []

        form.tag_names.forEach((name) => {
          const found = availableTags.value.find((t) => t.name === name)
          if (found) tagIds.push(found.id)
          else unknownTagNames.push(name)
        })

        form.category_names.forEach((name) => {
          const found = availableCategories.value.find((c) => c.name === name)
          if (found) categoryIds.push(found.id)
          else unknownCategoryNames.push(name)
        })

        // 2. 构造 PostCreateDTO
        const payload = {
          title: form.title,
          summary: form.summary || '',
          content: form.content,
          post_status: status,
          author_name: form.author_name,

          // 核心关联字段
          category_ids: categoryIds.length ? categoryIds : [],
          tag_ids: tagIds.length ? tagIds : []

          // 冗余字段或补救字段 (如果后端需要)
          // category_names: form.category_names.length ? form.category_names : undefined,
          // tag_names: form.tag_names.length ? form.tag_names : undefined
        }

        console.log('[Submit] Final Payload (DTO):', payload)
        // await api.submitPost(payload)
        // 判断是新增还是修改
        if (route.query.article_id) {
          // 修改
          const articleId = Number(route.query.article_id)
          await fetchUpdateArticleEdit(articleId, payload)
        } else {
          // 新增
          await fetchCreateArticle(payload)
        }

        ElMessage.success(status === 'published' ? '发布成功' : '草稿已保存')
        router.back()
      }
    })
  }

  const handleCancel = () => {
    if (form.content || form.title) {
      ElMessageBox.confirm('内容未保存，确定要离开吗？', '提示', {
        confirmButtonText: '确定离开',
        cancelButtonText: '继续编辑',
        type: 'warning'
      })
        .then(() => router.back())
        .catch(() => {})
    } else {
      router.back()
    }
  }

  // --- 生命周期与监听 ---

  onMounted(() => {
    initPage()
  })

  // 【修复关键点 2】：修改监听器
  // watch(
  //   () => route.query.article_id,
  //   () => {
  //     // console.log('[Route] path Changed:', route.path)
  //     // console.log('current route path:', currentRoutePath)
  //     // 如果当前路由的 path 不等于组件初始化时的 path，
  //     // 说明用户已经跳转到了其他页面（例如 /dashboard），
  //     // 此时虽然 query 变了（变空了），但不应该执行 initPage
  //     if (route.path !== currentRoutePath) return

  //     initPage()
  //   }
  // )
  // 【核心修复】：组件复用时（例如从 id=1 切到 id=2，或者从编辑切到新增），触发此钩子
  // 不会在处于文章编辑的同时发生id变化切换
  // onBeforeRouteUpdate((to, from) => {
  //   // to 是即将跳转的目标路由对象
  //   // 只有当 article_id 发生变化时才执行
  //   if (to.query.article_id !== from.query.article_id) {
  //     initPage(to.query.article_id as string)
  //   }
  // })

  // 【可选修复】：如果你的项目使用了 <KeepAlive> 缓存，
  // 当你从“其他页面”切回来时，需要检查一下 URL 参数是否和当前页面内容不一致
  onActivated(() => {
    const currentQueryId = route.query.article_id ? Number(route.query.article_id) : null
    if (articleId.value !== currentQueryId) {
      initPage()
    }
  })
</script>

<style scoped>
  .article-publish-container {
    position: relative;
    padding: 24px;
    background-color: #fff;
    height: 100%;
    box-sizing: border-box;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 20px;
    margin-bottom: 24px;
    border-bottom: 1px solid #f0f2f5;
  }

  .title {
    font-size: 20px;
    font-weight: 600;
    color: #1f2f3d;
    margin: 0;
  }

  .article-form {
    max-width: 100%;
  }

  .meta-layout {
    display: flex;
    gap: 20px;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .meta-left {
    flex: 1;
    min-width: 300px;
  }

  .input-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 6px;
    line-height: 1.4;
  }

  .meta-right {
    width: 350px;
    flex-shrink: 0;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    background-color: #fbfbfc;
    display: flex;
    flex-direction: column;
  }

  @media (max-width: 992px) {
    .meta-right {
      width: 100%;
    }
  }

  .lib-header {
    padding: 10px 15px;
    border-bottom: 1px solid #ebeef5;
    font-size: 13px;
    font-weight: 600;
    color: #606266;
    display: flex;
    align-items: center;
    gap: 6px;
    background-color: #fafafa;
    border-radius: 6px 6px 0 0;
  }

  .lib-icon {
    color: #909399;
  }

  .lib-content {
    padding: 15px;
    max-height: 140px;
    overflow-y: auto;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .lib-tag {
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    position: relative;
    z-index: 1;
  }

  .pointer-tag {
    cursor: pointer;
    user-select: none;
  }

  .pointer-tag:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 10;
  }

  .markdown-editor {
    min-height: 600px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    & :deep(.md-editor-v3-container-fullscreen) {
      /* 原始值通常是 10002，我们将其设置为 500，低于 sticky-footer 的 1000 */
      z-index: 500 !important;
    }
    & :deep(.md-editor-code-head) {
      z-index: 500 !important;
    }
  }

  .editor-last-item {
    margin-bottom: 60px;
  }

  .editor-last-item :deep(.el-form-item__content) {
    line-height: normal;
    overflow: visible;
    padding-bottom: 0;
    margin-bottom: 0;
  }

  .sticky-footer {
    position: sticky;
    bottom: 0;
    margin-top: 20px;
    padding: 16px 24px;
    background: rgba(255, 255, 255, 0.95);
    border-top: 1px solid #ebeef5;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    z-index: 1000;
    backdrop-filter: blur(8px);
    margin-left: -24px;
    margin-right: -24px;
    margin-bottom: -24px;
  }
</style>
