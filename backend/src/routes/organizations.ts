import { Router } from 'express'
import { authenticateToken, requireOrganization, AuthenticatedRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'

const router = Router()

router.use(authenticateToken)
router.use(requireOrganization)

router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const organization = await prisma.organization.findUnique({
      where: {
        id: req.organizationId!
      },
      include: {
        _count: {
          select: {
            products: {
              where: {
                isActive: true
              }
            },
            orders: true
          }
        }
      }
    })

    if (!organization) {
      return next(new AppError('Organization not found', 404))
    }

    res.json({
      success: true,
      data: { organization }
    })
  } catch (error) {
    next(error)
  }
})

router.get('/orders', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { page = '1', limit = '10', status } = req.query

    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)))
    const skip = (pageNum - 1) * limitNum

    const where: any = {
      organizationId: req.organizationId
    }

    if (status) {
      where.status = status as string
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          orderItems: {
            include: {
              product: {
                include: {
                  category: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.order.count({ where })
    ])

    const totalPages = Math.ceil(total / limitNum)

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router