import { AppRouteRecord } from '@/types/router'
/**
 * 用户管理路由配置
 */
export const userManagementRoutes: AppRouteRecord = {
  path: '/user-management',
  name: 'UserManagement',
  component: '/user-management',
  meta: {
    title: 'menus.userManagement.title',
    icon: 'ri:group-2-line',
    roles: ['R_SUPER', 'R_ADMIN']
  }
}
