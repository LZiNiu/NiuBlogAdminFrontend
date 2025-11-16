import { AppRouteRecord } from '@/types/router'
import { dashboardRoutes } from './dashboard'
// import { systemRoutes } from './system'
import { resultRoutes } from './result'
import { exceptionRoutes } from './exception'
import { articleManagementRoutes } from './article'
import { categoryManagementRoutes } from './category'
import { tagManagementRoutes } from './tag'
import { userManagementRoutes } from './user'
import { commentManagementRoutes } from './comment'

/**
 * 导出所有模块化路由
 */
export const routeModules: AppRouteRecord[] = [
  dashboardRoutes,
  // systemRoutes,
  userManagementRoutes,
  articleManagementRoutes,
  categoryManagementRoutes,
  tagManagementRoutes,
  commentManagementRoutes,
  resultRoutes,
  exceptionRoutes
]
