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
