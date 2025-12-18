<template>
  <ElDialog
    v-model="dialogVisible"
    :title="dialogType === 'add' ? '添加用户' : '编辑用户'"
    width="35%"
    align-center
  >
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="80px"
      class="responsive-form"
    >
      <ElFormItem
        v-if="dialogType === 'add'"
        label="用户名"
        prop="username"
        class="form-item-responsive"
      >
        <ElInput v-model="formData.username" placeholder="请输入登录用户名" />
      </ElFormItem>
      <ElFormItem
        v-if="dialogType === 'add'"
        label="密码"
        prop="password"
        class="form-item-responsive"
      >
        <ElInput v-model="formData.password" placeholder="请输入登录密码" />
      </ElFormItem>
      <ElFormItem label="昵称" prop="nickname" class="form-item-responsive">
        <ElInput v-model="formData.nickname" placeholder="请输入昵称" />
      </ElFormItem>
      <ElFormItem label="状态" prop="is_active" class="form-item-responsive">
        <ElSelect v-model="formData.is_active">
          <ElOption label="启用" :value="1" />
          <ElOption label="禁用" :value="0" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="权限" prop="role" class="form-item-responsive">
        <ElSelect v-model="formData.role" :disabled="formData.role === 'SUPER'">
          <ElOption
            v-for="role in RoleOptions"
            :key="role.key"
            :label="role.label"
            :value="role.value"
            :disabled="role.value === 'SUPER'"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="邮箱" prop="email" class="form-item-responsive">
        <ElInput v-model="formData.email" placeholder="请输入邮箱" />
      </ElFormItem>
      <ElFormItem label="头像" prop="avatar_url" class="form-item-responsive">
        <ElUpload
          ref="uploadRef"
          class="avatar-uploader"
          :auto-upload="true"
          :http-request="customUpload"
          :show-file-list="false"
          multiple
          accept=".jpg,.jpeg,.png,.gif,.webp"
          :before-upload="beforeAvatarUpload"
          :on-change="handleFileChange"
        >
          <!-- 显示已上传的图片 -->
          <div v-if="formData.avatar_url" class="relative inline-block">
            <img
              :src="formData.avatar_url"
              class="size-32 object-cover rounded border border-gray-300"
              alt="avatar"
            />
            <div
              class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer"
              @click.stop="removeImage"
            >
              <ElIcon><Close /></ElIcon>
            </div>
          </div>

          <!-- 上传按钮 -->
          <div
            v-else
            class="border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors duration-200"
            :class="{
              'size-32': true // 默认尺寸
            }"
          >
            <ElIcon :size="32" class="text-gray-400 mb-1">
              <Plus />
            </ElIcon>
            <span class="text-xs text-gray-500">上传</span>
          </div>
        </ElUpload>
        <div class="text-sm text-gray-500 mt-1 ml-1">最大上传 {{ maxUploadSize }}MB</div>
      </ElFormItem>
      <!-- <ElFormItem label="角色" prop="role">
        <ElSelect v-model="formData.role" multiple>
          <ElOption
            v-for="role in roleList"
            :key="role.roleCode"
            :value="role.roleCode"
            :label="role.roleName"
          />
        </ElSelect>
      </ElFormItem> -->
    </ElForm>
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules, UploadFile, UploadRequestOptions } from 'element-plus'
  import { Plus, Close } from '@element-plus/icons-vue'
  import { fetchCreateUser, fetchUpdateUser } from '@/api/user-manage'
  import { upLoadImage, ImageType } from '@/api/common'

  // const { accessToken } = useUserStore()
  interface Props {
    visible: boolean
    type: string
    userData: Partial<Api.CattleBlog.UserListItem>
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // 角色列表数据
  // const roleList = ref(ROLE_LIST_DATA)

  // 对话框显示控制
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const dialogType = computed(() => props.type)

  // 表单实例
  const formRef = ref<FormInstance>()

  // 表单数据
  const formData = reactive({
    username: '',
    password: '',
    nickname: '',
    email: '',
    is_active: '',
    role: '',
    avatar_url: ''
  })

  const RoleOptions = [
    { key: 'rcode001', label: '管理员', value: 'ADMIN' },
    { key: 'rcode002', label: '普通用户', value: 'USER' },
    { key: 'rcode003', label: '超级管理员', value: 'SUPER' }
  ]

  // 表单验证规则
  const rules: FormRules = {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 2, max: 8, message: '长度在 2 到 8 个字符', trigger: 'blur' }
    ],
    nickname: [
      { required: true, message: '请输入用户昵称', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      {
        pattern: /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/,
        message: '请输入正确的邮箱格式',
        trigger: 'blur'
      }
    ],
    role: [{ required: true, message: '请选择权限级别', trigger: 'blur' }]
  }

  /**
   * 初始化表单数据
   * 根据对话框类型（新增/编辑）填充表单
   */
  const initFormData = () => {
    const isEdit = props.type === 'edit' && props.userData
    const row = props.userData

    Object.assign(formData, {
      username: isEdit && row ? row.username || '' : '',
      is_active: isEdit && row ? row.is_active || 1 : 1,
      avatar_url: isEdit && row ? row.avatar_url : '',
      role: isEdit && row ? row.role || 'USER' : 'USER',
      nickname: isEdit && row ? row.nickname || '' : '',
      email: isEdit && row ? row.email || '' : ''
    })
  }

  /**
   * 监听对话框状态变化
   * 当对话框打开时初始化表单数据并清除验证状态
   */
  watch(
    () => [props.visible, props.type, props.userData],
    ([visible]) => {
      if (visible) {
        initFormData()
        nextTick(() => {
          formRef.value?.clearValidate()
        })
      }
    },
    { immediate: true }
  )

  const maxUploadSize = 5
  const beforeAvatarUpload = (rawFile: File) => {
    const isImg = rawFile.type.startsWith('image/')
    const isLt = rawFile.size / 1024 / 1024 < maxUploadSize

    if (!isImg) {
      ElMessage.error('只能上传图片文件!')
      return false
    }
    if (!isLt) {
      ElMessage.error(`图片大小不能超过 ${maxUploadSize}MB!`)
      return false
    }
    return true
  }
  // 自定义上传函数
  const customUpload = async (options: UploadRequestOptions) => {
    const { file } = options

    const uploadData = new FormData()
    uploadData.append('file', file) // 'file' 是后端接收文件的字段名，根据实际情况调整

    try {
      console.log('formData: ', formData)
      console.log('props.userData:', props.userData)
      const response = await upLoadImage(ImageType.AVATAR, uploadData)
      if (response.url !== null) {
        // nextTick(() => {
        formData.avatar_url = response.url
        // })
      }
      // 上传成功
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }
  const removeImage = () => {
    formData.avatar_url = ''
  }
  /**
   * 文件状态改变时的钩子
   */
  const handleFileChange = (uploadFile: UploadFile) => {
    // 这里可以处理文件状态变化
    console.log('文件状态改变：', uploadFile)
  }
  /**
   * 提交表单
   * 验证通过后触发提交事件
   */
  const handleSubmit = async () => {
    if (!formRef.value) return
    // 更新用户信息
    if (props.userData.id && props.type === 'edit') {
      await fetchUpdateUser(props.userData.id, formData)
    } else await fetchCreateUser(formData)
    await formRef.value.validate((valid) => {
      if (valid) {
        ElMessage.success(dialogType.value === 'add' ? '添加成功' : '更新成功')
        dialogVisible.value = false
        emit('submit')
      }
    })
  }
</script>

<style lang="scss" scoped>
  .responsive-form {
    width: 100%;
  }

  .form-item-responsive {
    width: 100%;
    margin-bottom: 18px;
  }
  /* 针对大屏幕优化 */
  @media (min-width: 768px) {
    .form-item-responsive {
      width: 100%;
    }
  }

  /* 针对小屏幕优化 */
  @media (max-width: 767px) {
    .form-item-responsive {
      width: 100%;
    }

    .el-dialog {
      width: 90% !important;
    }
  }
  .dialog-footer {
    padding-top: 10px;
  }
  .avatar-uploader .el-upload {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--el-transition-duration-fast);
  }

  .avatar-uploader .el-upload:hover {
    border-color: var(--el-color-primary);
  }
</style>
