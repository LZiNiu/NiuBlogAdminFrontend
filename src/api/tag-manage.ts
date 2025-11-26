import request from '@/utils/http'

export async function fetchAllTags() {
  return request.get<Api.CattleBlog.TagItem[]>({
    url: '/admin/tags'
  })
}

export async function fetchTagList(params: Api.CattleBlog.TagSearchParams) {
  return request.get<Api.CattleBlog.TagList>({
    url: '/admin/tags/pagination',
    params
  })
}

export async function fetchCreateTag(name: string, description: string = '') {
  return request.post<Api.CattleBlog.TagItem>({
    url: '/admin/tags',
    params: { name, description }
  })
}

export async function fetchUpdateTag(id: number, name: string, description: string) {
  return request.put<void>({
    url: `/admin/tags/${id}`,
    params: { name, description }
  })
}

export async function fetchDeleteTag(id: number) {
  return request.del<void>({
    url: `/admin/tags/${id}`
  })
}

export async function fetchDeleteTagByName(name: string) {
  return request.del<void>({
    url: `/admin/tags/${name}`
  })
}

export async function fetchBatchDeleteTags(ids: number[]) {
  return request.del<void>({
    url: '/admin/tags',
    data: ids
  })
}
