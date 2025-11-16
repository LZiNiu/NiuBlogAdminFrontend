import { AppRouteRecord } from '@/types/router'

/**
 * 标签管理路由配置
 */
export const tagManagementRoutes: AppRouteRecord = {
  path: '/tag-management',
  name: 'TagManagement',
  component: '/tag-management',
  meta: {
    title: 'menus.tagManagement.title',
    icon: 'ri:price-tag-3-line',
    roles: ['R_SUPER', 'R_ADMIN']
  }
}
