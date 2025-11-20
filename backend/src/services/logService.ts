import { Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'

interface LogData {
  method: string
  route: string
  statusCode: number
  latencyMs: number
  userId?: string
  organizationId?: string
  userAgent?: string
  ipAddress?: string
  searchQuery?: string
  aiFilters?: any
  aiSuccess?: boolean
  fallbackApplied?: boolean
}

class LogService {
  async createLog(data: LogData) {
    try {
      await prisma.log.create({
        data: {
          method: data.method,
          route: data.route,
          statusCode: data.statusCode,
          latencyMs: data.latencyMs,
          userId: data.userId,
          organizationId: data.organizationId,
          userAgent: data.userAgent,
          ipAddress: data.ipAddress,
          searchQuery: data.searchQuery,
          aiFilters: data.aiFilters,
          aiSuccess: data.aiSuccess,
          fallbackApplied: data.fallbackApplied,
        }
      })
    } catch (error) {
      process.stderr.write(`Error creating log: ${error}\n`)
    }
  }

  async getLogs(filters: {
    page?: number
    limit?: number
    userId?: string
    organizationId?: string
    method?: string
    statusCode?: number
    route?: string
    startDate?: Date
    endDate?: Date
  }) {
    const {
      page = 1,
      limit = 50,
      userId,
      organizationId,
      method,
      statusCode,
      route,
      startDate,
      endDate
    } = filters

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (userId) where.userId = userId
    if (organizationId) where.organizationId = organizationId
    if (method) where.method = method
    if (statusCode) where.statusCode = statusCode
    if (route) where.route = { contains: route, mode: 'insensitive' }
    
    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) where.timestamp.gte = startDate
      if (endDate) where.timestamp.lte = endDate
    }

    const [logs, total] = await Promise.all([
      prisma.log.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.log.count({ where })
    ])

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  async getLogStats(organizationId?: string) {
    const where = organizationId ? { organizationId } : {}
    
    const [
      totalLogs,
      errorLogs,
      successLogs,
      searchLogs
    ] = await Promise.all([
      prisma.log.count({ where }),
      prisma.log.count({ 
        where: { 
          ...where,
          statusCode: { gte: 400 }
        }
      }),
      prisma.log.count({ 
        where: { 
          ...where,
          statusCode: { lt: 400 }
        }
      }),
      prisma.log.count({ 
        where: { 
          ...where,
          searchQuery: { not: null }
        }
      })
    ])

    return {
      totalLogs,
      errorLogs,
      successLogs,
      searchLogs,
      errorRate: totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0
    }
  }
}

export const logService = new LogService()

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now()
  
  const originalSend = res.send
  
  res.send = function(data: any) {
    const latencyMs = Date.now() - startTime
    const route = req.route ? req.baseUrl + req.route.path : req.path
    
    const user = (req as any).user
    const userId = user?.userId
    const organizationId = user?.organizationId
    
    logService.createLog({
      method: req.method,
      route,
      statusCode: res.statusCode,
      latencyMs,
      userId,
      organizationId,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress,
    }).catch(() => {
    })
    
    return originalSend.call(this, data)
  }
  
  next()
}

export const logSearchActivity = async (data: {
  userId?: string
  organizationId?: string
  searchQuery: string
  aiFilters?: any
  aiSuccess: boolean
  fallbackApplied: boolean
  statusCode?: number
  latencyMs?: number
}) => {
  await logService.createLog({
    method: 'SEARCH',
    route: '/api/search/intelligent',
    statusCode: data.statusCode || 200,
    latencyMs: data.latencyMs || 0,
    userId: data.userId,
    organizationId: data.organizationId,
    searchQuery: data.searchQuery,
    aiFilters: data.aiFilters,
    aiSuccess: data.aiSuccess,
    fallbackApplied: data.fallbackApplied,
  })
}

export default logService