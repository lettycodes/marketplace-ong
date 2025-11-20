import { Router } from 'express'
import { body, validationResult, param } from 'express-validator'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'

const router = Router()

router.post('/',
  [
    body('items').isArray({ min: 1 }),
    body('items.*.productId').isUUID(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('customerName').trim().isLength({ min: 2, max: 255 }),
    body('customerEmail').isEmail().normalizeEmail(),
    body('customerPhone').optional().trim().isLength({ min: 10, max: 20 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return next(new AppError('Validation failed', 400))
      }

      const { items, customerName, customerEmail, customerPhone } = req.body

      const productIds = items.map((item: any) => item.productId)
      
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          isActive: true
        },
        include: {
          organization: true
        }
      })

      if (products.length !== productIds.length) {
        return next(new AppError('One or more products not found or inactive', 404))
      }

      for (const item of items) {
        const product = products.find(p => p.id === item.productId)
        if (!product) {
          return next(new AppError(`Product ${item.productId} not found`, 404))
        }
        
        if (product.stockQty < item.quantity) {
          return next(new AppError(`Insufficient stock for product: ${product.name}`, 400))
        }
      }

      const ordersByOrg = new Map<string, any>()
      
      for (const item of items) {
        const product = products.find(p => p.id === item.productId)!
        const orgId = product.organizationId
        
        if (!ordersByOrg.has(orgId)) {
          ordersByOrg.set(orgId, {
            organizationId: orgId,
            items: [],
            totalAmount: 0
          })
        }
        
        const orderData = ordersByOrg.get(orgId)
        orderData.items.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price
        })
        orderData.totalAmount += product.price.toNumber() * item.quantity
      }

      const createdOrders = []

      for (const [orgId, orderData] of ordersByOrg) {
        const order = await prisma.order.create({
          data: {
            organizationId: orgId,
            customerName,
            customerEmail,
            customerPhone: customerPhone || null,
            totalAmount: orderData.totalAmount,
            orderItems: {
              create: orderData.items
            }
          },
          include: {
            orderItems: {
              include: {
                product: {
                  include: {
                    category: true
                  }
                }
              }
            },
            organization: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        })

        createdOrders.push(order)
      }

      res.status(201).json({
        success: true,
        data: {
          orders: createdOrders,
          summary: {
            totalOrders: createdOrders.length,
            totalAmount: createdOrders.reduce((sum, order) => sum + order.totalAmount.toNumber(), 0),
            organizationsInvolved: createdOrders.length
          }
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

router.get('/customer/:email',
  [param('email').isEmail().normalizeEmail()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return next(new AppError('Invalid email format', 400))
      }

      const { page = '1', limit = '10' } = req.query

      const pageNum = Math.max(1, parseInt(page as string))
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)))
      const skip = (pageNum - 1) * limitNum

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where: {
            customerEmail: req.params.email
          },
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
            },
            organization: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.order.count({
          where: {
            customerEmail: req.params.email
          }
        })
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
  }
)

router.get('/:id',
  [param('id').isUUID()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return next(new AppError('Invalid order ID', 400))
      }

      const order = await prisma.order.findUnique({
        where: {
          id: req.params.id
        },
        include: {
          orderItems: {
            include: {
              product: {
                include: {
                  category: true
                }
              }
            }
          },
          organization: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              description: true,
              website: true,
              address: true
            }
          }
        }
      })

      if (!order) {
        return next(new AppError('Order not found', 404))
      }

      res.json({
        success: true,
        data: { order }
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router