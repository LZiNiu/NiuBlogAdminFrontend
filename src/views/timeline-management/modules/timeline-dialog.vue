<template>
  <el-dialog
    :model-value="modelValue"
    :title="type === 'add' ? '新增时间轴动态' : '编辑动态'"
    width="600px"
    destroy-on-close
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
    @open="initForm"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px">
      <el-form-item label="标题" prop="title">
        <el-input v-model="formData.title" placeholder="请输入标题" />
      </el-form-item>

      <el-form-item label="日期" prop="date">
        <el-date-picker
          v-model="formData.date"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
          class="!w-full"
        />
      </el-form-item>

      <el-form-item label="类型" prop="event_type">
        <el-radio-group v-model="formData.event_type">
          <el-radio-button v-for="t in eventTypes" :key="t" :label="t" :value="t">
            <div class="flex items-center gap-1">
              <ArtSvgIcon :icon="getIcon(t)" />
              {{ t }}
            </div>
          </el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="内容" prop="content">
        <el-input v-model="formData.content" type="textarea" :rows="4" placeholder="写点什么..." />
      </el-form-item>

      <el-form-item label="图片">
        <!-- 注意：action="#" 和 http-request 是为了自定义上传 -->
        <el-upload
          action="#"
          list-type="picture-card"
          :file-list="fileList"
          :http-request="customUpload"
          :on-remove="handleRemoveImage"
          :on-preview="handlePreviewImage"
        >
          <ArtSvgIcon icon="ri:add-line" class="text-2xl text-gray-400" />
        </el-upload>
      </el-form-item>

      <el-form-item label="外链" prop="link">
        <el-input v-model="formData.link" placeholder="https://...">
          <template #prefix>
            <ArtSvgIcon icon="ri:link" />
          </template>
        </el-input>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" :loading="loading" @click="submit"> 提交 </el-button>
      </span>
    </template>

    <!-- 图片预览弹窗 (嵌套在 Dialog 内部) -->
    <el-dialog v-model="previewVisible" append-to-body>
      <img w-full :src="previewImageUrl" alt="Preview Image" class="w-full" />
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
  import { upLoadImage, ImageType } from '@/api/common'
  import { ElMessage } from 'element-plus'
  import type { FormInstance, UploadUserFile, UploadRequestOptions } from 'element-plus'

  type Timeline = Omit<Api.CattleBlog.TimelineEvent, 'id'> & { id?: number }

  const props = defineProps<{
    modelValue: boolean // 控制显示隐藏
    type: 'add' | 'edit' // 模式
    editData?: Timeline | null // 编辑时传入的数据
    loading?: boolean // 提交按钮loading状态
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', val: boolean): void
    (e: 'submit', data: Timeline): void
  }>()

  // --- 常量 ---
  const eventTypes = ['coding', 'blog', 'life', 'milestone']

  // --- 表单状态 ---
  const formRef = ref<FormInstance>()
  const fileList = ref<UploadUserFile[]>([])
  const previewVisible = ref(false)
  const previewImageUrl = ref('')
  const formData = reactive<Timeline>({
    title: '',
    date: '',
    content: '',
    event_type: 'coding',
    images: [],
    link: ''
  })

  const rules = {
    title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
    date: [{ required: true, message: '请选择日期', trigger: 'change' }],
    event_type: [{ required: true, message: '请选择类型', trigger: 'change' }]
  }

  // --- 逻辑方法 ---

  // 1. 初始化表单 (每次打开 Dialog 时触发)
  const initForm = () => {
    if (formRef.value) formRef.value.clearValidate()

    if (props.type === 'edit' && props.editData) {
      // 编辑模式：回显数据
      Object.assign(formData, props.editData)
      // 处理图片回显：将 URL 数组转为 UploadUserFile 对象
      fileList.value = (props.editData.images || []).map((url, index) => ({
        name: `img-${index}`,
        url: url,
        uid: index // 确保有唯一标识
      }))
    } else {
      // 新增模式：重置数据
      formData.id = undefined
      formData.title = ''
      formData.date = new Date().toISOString().split('T')[0]
      formData.content = ''
      formData.event_type = 'coding'
      formData.images = []
      formData.link = ''
      fileList.value = []
    }
  }

  // 2. 自定义上传逻辑
  const customUpload = async (options: UploadRequestOptions) => {
    const { file } = options
    try {
      const uploadData = new FormData()
      uploadData.append('file', file) // 'file' 是后端接收文件的字段名，根据实际情况调整

      const response = await upLoadImage(ImageType.ILLUSTRATION, uploadData)

      // 更新数据
      formData.images = [...(formData.images || []), response.url]
      ElMessage.success('图片上传成功')
    } catch (error) {
      console.error('图片上传失败: \n', error)
      ElMessage.error('图片上传失败')
    }
  }

  // 3. 移除图片
  const handleRemoveImage = (uploadFile: UploadUserFile) => {
    // 如果是已上传的图片，从 formData.images 中过滤掉
    if (uploadFile.url) {
      formData.images = formData.images?.filter((url) => url !== uploadFile.url)
    }
  }

  // 4. 预览图片
  const handlePreviewImage = (uploadFile: UploadUserFile) => {
    previewImageUrl.value = uploadFile.url!
    previewVisible.value = true
  }

  // 5. 提交表单
  const submit = async () => {
    if (!formRef.value) return
    await formRef.value.validate((valid) => {
      if (valid) {
        // 这里的拷贝是为了避免引用污染
        emit('submit', { ...formData })
      }
    })
  }

  const close = () => {
    emit('update:modelValue', false)
  }

  // 辅助：获取图标
  const getIcon = (type: string) => {
    switch (type) {
      case 'coding':
        return 'ri:code-s-slash-line'
      case 'blog':
        return 'ri:article-line'
      case 'life':
        return 'ri:cup-line'
      case 'milestone':
        return 'ri:flag-2-fill'
      default:
        return 'ri:price-tag-3-fill'
    }
  }
</script>
