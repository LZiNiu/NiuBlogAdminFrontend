import request from '@/utils/http'

// 获取用户列表
export async function fetchUserList(params: Api.CattleBlog.UserSearchParams) {
  return request.get<Api.CattleBlog.UserList>({
    url: '/admin/users/pagination',
    params
  })
}

// 创建用户
export async function fetchCreateUser(data: Api.CattleBlog.UserCreateParams) {
  return request.post<null>({
    url: '/admin/users',
    data
  })
}

// 删除用户
export async function fetchDeleteUser(id: number) {
  return request.del<null>({
    url: `/admin/users/${id}`
  })
}

// 批量删除用户
export async function fetchBatchDeleteUser(ids: number[]) {
  return request.del<null>({
    url: '/admin/users',
    data: ids
  })
}

export async function fetchUpdateUserStatus(userId: number, status: boolean) {
  return request.put<null>({
    url: `/admin/users/${userId}/status`,
    data: { status: status }
  })
}

export async function fetchUpdateUser(userId: number, data: Api.CattleBlog.UserUpdateParams) {
  return request.put<null>({
    url: `/admin/users/${userId}`,
    data
  })
}
