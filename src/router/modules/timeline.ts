import { AppRouteRecord } from '@/types/router'

/**
 * 时间轴管理路由配置
 */
export const timelineManagementRoutes: AppRouteRecord = {
  path: '/timeline-management',
  name: 'TimelineManagement',
  component: '/timeline-management',
  meta: {
    title: 'menus.timelineManagement.title',
    icon: 'ri:time-line',
    roles: ['R_SUPER', 'R_ADMIN']
  }
}