import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export interface LoggedRequest extends Request {
  startTime?: number
  userId?: string
  organizationId?: string
}

export const requestLogger = (req: LoggedRequest, res: Response, next: NextFunction) => {
  req.startTime = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - (req.startTime || Date.now())
    
    logger.info({
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.userId,
      organizationId: req.organizationId
    })
  })
  
  next()
}