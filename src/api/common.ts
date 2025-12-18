import request from '@/utils/http'

// 图片归属类枚举: 头像, 插图, 封面图
export const ImageType = {
  AVATAR: 'avatar',
  ILLUSTRATION: 'illustration',
  COVER: 'cover'
} as const

export type ImageType = (typeof ImageType)[keyof typeof ImageType]

// 创建一个包含所有合法值的集合，用于运行时校验
const ValidImageTypes = new Set(Object.values(ImageType))

export function upLoadImage(type: ImageType, image: FormData) {
  // 参数校验：确保 type 是合法值
  if (!ValidImageTypes.has(type)) {
    ElMessage.error(`无效的参数类型${type}, 请检查图片归属类型`)
    throw new Error('Invalid image type') // 可选：抛出错误阻止后续执行
  }
  return request.post<Api.Common.UploadResponse>({
    url: `admin/upload/${type}`,
    data: image,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
