import { Router } from 'express'
import { body, query, validationResult } from 'express-validator'
import { authenticateToken } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { AISearchService } from '../services/aiSearch'
import { logSearchActivity } from '../services/logService'
import { prisma } from '../lib/prisma'

const router = Router()

router.get('/intelligent',
  [
    query('q').notEmpty().withMessage('Query parameter "q" is required'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  async (req, res, next) => {
    const startTime = Date.now()
    
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return next(new AppError('Invalid query parameters', 400))
      }

      const { q: searchQuery, page = 1, limit = 20 } = req.query
      const user = (req as any).user
      const userId = user?.userId
      const organizationId = user?.organizationId

      const aiResult = await AISearchService.parseNaturalLanguageSearch(
        searchQuery as string,
        userId,
        organizationId
      )

      const { filters } = aiResult

      const where: any = {
        isActive: true
      }

      if (organizationId) {
        where.organizationId = organizationId
      }


      if (filters.category) {
        where.category = {
          name: {
            contains: filters.category,
            mode: 'insensitive'
          }
        }
      }

      if (filters.priceMin || filters.priceMax) {
        where.price = {}
        if (filters.priceMin) {
          where.price.gte = filters.priceMin
        }
        if (filters.priceMax) {
          where.price.lte = filters.priceMax
        }
      }

      if (filters.keywords && filters.keywords.length > 0) {
        where.OR = [
          {
            name: {
              contains: filters.keywords.join(' '),
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: filters.keywords.join(' '),
              mode: 'insensitive'
            }
          }
        ]
      }

      if (filters.organization) {
        where.organization = {
          name: {
            contains: filters.organization,
            mode: 'insensitive'
          }
        }
      }

      const skip = (page - 1) * limit
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: true,
            organization: true
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.product.count({ where })
      ])

      const latencyMs = Date.now() - startTime

      await logSearchActivity({
        userId,
        organizationId,
        searchQuery: searchQuery as string,
        aiFilters: filters,
        aiSuccess: aiResult.aiSuccess,
        fallbackApplied: aiResult.fallbackUsed,
        statusCode: 200,
        latencyMs
      })

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          },
          searchInfo: {
            query: searchQuery,
            interpretation: aiResult.interpretation,
            aiSuccess: aiResult.aiSuccess,
            fallbackUsed: aiResult.fallbackUsed,
            filters
          }
        }
      })
    } catch (error) {
      const latencyMs = Date.now() - startTime
      const user = (req as any).user

      await logSearchActivity({
        userId: user?.userId,
        organizationId: user?.organizationId,
        searchQuery: req.query.q as string || '',
        aiFilters: {},
        aiSuccess: false,
        fallbackApplied: true,
        statusCode: 500,
        latencyMs
      })

      next(error)
    }
  }
)

router.get('/products',
  [
    query('q').optional(),
    query('category').optional(),
    query('minPrice').optional().isFloat({ min: 0 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return next(new AppError('Invalid query parameters', 400))
      }

      const { 
        q: searchQuery, 
        category, 
        minPrice, 
        maxPrice, 
        page = 1, 
        limit = 20 
      } = req.query

      const where: any = {
        isActive: true
      }

      if (searchQuery) {
        where.OR = [
          {
            name: {
              contains: searchQuery as string,
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: searchQuery as string,
              mode: 'insensitive'
            }
          }
        ]
      }

      if (category) {
        where.category = {
          name: {
            contains: category as string,
            mode: 'insensitive'
          }
        }
      }

      if (minPrice || maxPrice) {
        where.price = {}
        if (minPrice) {
          where.price.gte = parseFloat(minPrice as string)
        }
        if (maxPrice) {
          where.price.lte = parseFloat(maxPrice as string)
        }
      }

      const skip = (page - 1) * limit
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: true,
            organization: true
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.product.count({ where })
      ])

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router