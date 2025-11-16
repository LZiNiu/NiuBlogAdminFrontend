import { AppRouteRecord } from '@/types/router'
/**
 * 评论管理路由配置
 */
export const commentManagementRoutes: AppRouteRecord = {
  path: '/comment-management',
  name: 'CommentManagement',
  component: '/comment-management',
  meta: {
    title: 'menus.commentManagement.title',
    icon: 'ri:message-3-line',
    roles: ['R_SUPER', 'R_ADMIN']
  }
}
