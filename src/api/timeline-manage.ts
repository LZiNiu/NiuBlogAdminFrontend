import request from '@/utils/http'

// 获取时间轴事件列表
export async function fetchTimelineList() {
  return request.get<Api.CattleBlog.TimelineEvent[]>({
    url: '/admin/timeline'
  })
}

// 创建时间轴事件
export async function fetchCreateTimeline(data: Api.CattleBlog.TimelineEventCreate) {
  return request.post<Api.Common.CreateResponse>({
    url: '/admin/timeline',
    data
  })
}

// 更新时间轴事件
export async function fetchUpdateTimeline(id: number, data: Api.CattleBlog.TimelineEventUpdate) {
  return request.put<null>({
    url: `/admin/timeline/${id}`,
    data
  })
}

// 删除时间轴事件
export async function fetchDeleteTimeline(id: number) {
  return request.del<boolean>({
    url: `/admin/timeline/${id}`
  })
}

// 批量删除时间轴事件
export async function fetchBatchDeleteTimeline(ids: number[]) {
  return request.del<boolean>({
    url: '/admin/timeline/batch',
    data: { ids }
  })
}
