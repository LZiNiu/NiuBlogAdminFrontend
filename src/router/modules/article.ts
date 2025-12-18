import { AppRouteRecord } from '@/types/router'

/**
 * 文章管理路由配置
 */
export const articleManagementRoutes: AppRouteRecord = {
  path: '/article-management',
  name: 'ArticleManagement',
  component: '/article-management',
  meta: {
    title: 'menus.articleManagement.title',
    icon: 'ri:article-line',
    roles: ['R_SUPER', 'R_ADMIN']
  }
}

export const articleEditRoutes: AppRouteRecord = {
  path: '/article-management/edit',
  name: 'ArticleEdit',
  component: '/article-management/article-edit',
  meta: {
    title: '文章发布',
    keepAlive: true,
    roles: ['R_SUPER', 'R_ADMIN'],
    isHide: true
  }
}
