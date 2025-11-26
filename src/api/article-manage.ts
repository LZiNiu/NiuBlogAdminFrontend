import request from '@/utils/http'

interface ArticleEdit {
  id: number
  title: string
  summary?: string
  content: string
  cover_url?: string
  author_name: string
  category_ids?: number[]
  category_names?: string[]
  tag_ids?: number[]
  tag_names?: string[]
}

export async function fetchArticleList(params: Api.CattleBlog.ArticleSearchParams) {
  return request.get<Api.CattleBlog.ArticleList>({
    url: '/admin/articles/pagination',
    params
  })
}

export async function fetchArticleEdit(id: number) {
  return request.get<ArticleEdit>({
    url: `/admin/articles/${id}/editinfo`
  })
}

export async function fetchCreateArticle(data: Api.CattleBlog.ArticleCreateParams) {
  return request.post<void>({
    url: '/admin/articles',
    data
  })
}

export async function fetchArticleContent(id: number) {
  return request.get<string>({
    url: `/admin/articles/${id}/body`
  })
}

export async function fetchUpdateArticleEdit(id: number, data: Api.CattleBlog.ArticleCreateParams) {
  return request.put<void>({
    url: `/admin/articles/${id}`,
    data
  })
}

export async function fetchDeleteArticle(id: number) {
  return request.del<void>({
    url: `/admin/articles/${id}`
  })
}

export async function fetchBatchDeleteArticles(ids: number[]) {
  return request.del<void>({
    url: `/admin/articles/batch`,
    data: ids
  })
}
