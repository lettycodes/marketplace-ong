import { Router } from 'express'
import { query, validationResult } from 'express-validator'
import { authenticateToken } from '../middleware/auth'
import { requireAdmin } from '../middleware/admin'
import { AppError } from '../middleware/errorHandler'
import { logService } from '../services/logService'

const router = Router()

router.get('/test', async (req, res, next) => {
  try {
    const logs = await logService.getLogs({
      page: 1,
      limit: 10
    })
    res.json({
      success: true,
      message: 'Test route - últimos 10 logs',
      data: logs
    })
  } catch (error) {
    console.error('Error in test logs route:', error)
    next(error)
  }
})

router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('method').optional().isIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'SEARCH']),
    query('statusCode').optional().isInt().toInt(),
    query('route').optional().isString(),
    query('startDate').optional().isISO8601().toDate(),
    query('endDate').optional().isISO8601().toDate()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return next(new AppError('Invalid query parameters', 400))
      }

      const {
        page = 1,
        limit = 50,
        method,
        statusCode,
        route,
        startDate,
        endDate
      } = req.query

      const user = (req as any).user
      const organizationId = user?.organizationId || null

      const result = await logService.getLogs({
        page: page as number,
        limit: limit as number,
        organizationId,
        method: method as string,
        statusCode: statusCode as number,
        route: route as string,
        startDate: startDate as Date,
        endDate: endDate as Date
      })

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }
)

router.get('/stats',
  async (req, res, next) => {
    try {
      const user = (req as any).user
      const organizationId = user?.organizationId || null

      const stats = await logService.getLogStats(organizationId)

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router