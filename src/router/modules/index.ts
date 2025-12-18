import { AppRouteRecord } from '@/types/router'
import { dashboardRoutes } from './dashboard'
// import { systemRoutes } from './system'
import { resultRoutes } from './result'
import { exceptionRoutes } from './exception'
import { articleManagementRoutes, articleEditRoutes } from './article'
import { categoryManagementRoutes } from './category'
import { tagManagementRoutes } from './tag'
import { userManagementRoutes } from './user'
import { timelineManagementRoutes } from './timeline'

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
  timelineManagementRoutes,
  resultRoutes,
  exceptionRoutes,
  articleEditRoutes
]
