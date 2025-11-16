import { AppRouteRecord } from '@/types/router'

/**
 * 分类管理路由配置
 */
export const categoryManagementRoutes: AppRouteRecord = {
  path: '/category-management',
  name: 'CategoryManagement',
  component: '/category-management',
  meta: {
    title: 'menus.categoryManagement.title',
    icon: 'ri:folder-open-line',
    roles: ['R_SUPER', 'R_ADMIN']
  }
}
