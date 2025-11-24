import request from '@/utils/http'

export async function fetchAllCategories() {
  return request.get<Api.CattleBlog.CategoryItem[]>({
    url: `/admin/categories`
  })
}

export async function fetchCategoryList(params: Api.Common.CommonSearchParams) {
  return request.get<Api.CattleBlog.CategoryList>({
    url: '/admin/categories/pagination',
    params
  })
}

export async function fetchCreateCategory(name: string, description: string = '') {
  return request.post<Api.CattleBlog.CategoryItem>({
    url: '/admin/categories',
    params: { name, description }
  })
}

export async function fetchUpdateCategory(id: number, data: Partial<Api.CattleBlog.CategoryDTO>) {
  return request.put<void>({
    url: `/admin/categories/${id}`,
    data
  })
}

export async function fetchDeleteCategory(id: number): Promise<void> {
  return request.del<void>({
    url: `/admin/categories/${id}`
  })
}

export async function fetchDeleteCategoryByName(name: string): Promise<void> {
  return request.del<void>({
    url: `/admin/categories/${name}`
  })
}

export async function fetchBatchDeleteCategories(ids: number[]): Promise<void> {
  return request.del<void>({
    url: `/admin/categories/${ids.join(',')}`
  })
}
