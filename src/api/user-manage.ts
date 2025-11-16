import request from '@/utils/http'

// 获取用户列表
export function fetchUserList(params: Api.UserManage.UserSearchParams) {
    return request.get<Api.UserManage.UserList>({
        url: '/admin/users',
        params
    })
}


// 创建用户
export function fetchCreateUser(data: Api.UserManage.UserCreateParams) {
    return request.post<Api.Common.Response>({
        url: '/admin/users',
        data
    })
}

// 删除用户
export function fetchDeleteUser(id: number) {
    return request.del<Api.Common.Response>({
        url: `/admin/users/${id}`
    })
}

// 批量删除用户
export function fetchBatchDeleteUser(ids: number[]) {
    return request.del<Api.Common.Response>({
        url: '/admin/users',
        data: ids
    })
}