import { Router } from 'express'
import { body, validationResult, param } from 'express-validator'
import { authenticateToken, requireOrganization, AuthenticatedRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'

const router = Router()

router.use(authenticateToken)
router.use(requireOrganization)

router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { page = '1', limit = '10', category, search } = req.query

    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)))
    const skip = (pageNum - 1) * limitNum

    const where: any = {
      organizationId: req.organizationId
    }

    if (category) {
      where.category = {
        name: category as string
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          category: true,
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.product.count({ where })
    ])

    const totalPages = Math.ceil(total / limitNum)

    res.json({
      success: true,
      data: {
        products,
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

router.get('/:id',
  [param('id').isUUID()],
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return next(new AppError('Invalid product ID', 400))
      }

      const product = await prisma.product.findFirst({
        where: {
          id: req.params.id,
          organizationId: req.organizationId
        },
        include: {
          category: true,
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      if (!product) {
        return next(new AppError('Product not found', 404))
      }

      res.json({
        success: true,
        data: { product }
      })
    } catch (error) {
      next(error)
    }
  }
)

router.post('/',
  [
    body('name').trim().isLength({ min: 1, max: 255 }),
    body('description').trim().isLength({ min: 1, max: 2000 }),
    body('price').isFloat({ min: 0.01 }),
    body('categoryId').isUUID(),
    body('stockQty').isInt({ min: 0 }),
    body('weightGrams').isInt({ min: 1 })
  ],
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array())
        console.log('Request body:', req.body)
        return next(new AppError(`Validation failed: ${errors.array().map(e => e.msg).join(', ')}`, 400))
      }

      const {
        name,
        description,
        price,
        categoryId,
        imageUrl,
        stockQty,
        weightGrams
      } = req.body

      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      })

      if (!category) {
        return next(new AppError('Category not found', 404))
      }

      const product = await prisma.product.create({
        data: {
          name,
          description,
          price,
          categoryId,
          imageUrl: imageUrl || null,
          stockQty,
          weightGrams,
          organizationId: req.organizationId!
        },
        include: {
          category: true,
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      res.status(201).json({
        success: true,
        data: { product }
      })
    } catch (error) {
      next(error)
    }
  }
)

router.put('/:id',
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1, max: 255 }),
    body('description').optional().trim().isLength({ min: 1, max: 2000 }),
    body('price').optional().isFloat({ min: 0.01 }),
    body('categoryId').optional().isUUID(),
    body('stockQty').optional().isInt({ min: 0 }),
    body('weightGrams').optional().isInt({ min: 1 }),
    body('isActive').optional().isBoolean()
  ],
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        console.log('PUT Validation errors:', errors.array())
        console.log('PUT Request body:', req.body)
        return next(new AppError(`Validation failed: ${errors.array().map(e => e.msg).join(', ')}`, 400))
      }

      const existingProduct = await prisma.product.findFirst({
        where: {
          id: req.params.id,
          organizationId: req.organizationId
        }
      })

      if (!existingProduct) {
        return next(new AppError('Product not found', 404))
      }

      const updateData: any = {}
      
      if (req.body.name !== undefined) updateData.name = req.body.name
      if (req.body.description !== undefined) updateData.description = req.body.description
      if (req.body.price !== undefined) updateData.price = req.body.price
      if (req.body.imageUrl !== undefined) updateData.imageUrl = req.body.imageUrl
      if (req.body.stockQty !== undefined) updateData.stockQty = req.body.stockQty
      if (req.body.weightGrams !== undefined) updateData.weightGrams = req.body.weightGrams
      if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive

      if (req.body.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: req.body.categoryId }
        })
        if (!category) {
          return next(new AppError('Category not found', 404))
        }
        updateData.categoryId = req.body.categoryId
      }

      const product = await prisma.product.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          category: true,
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      res.json({
        success: true,
        data: { product }
      })
    } catch (error) {
      next(error)
    }
  }
)

router.delete('/:id',
  [param('id').isUUID()],
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return next(new AppError('Invalid product ID', 400))
      }

      const existingProduct = await prisma.product.findFirst({
        where: {
          id: req.params.id,
          organizationId: req.organizationId
        }
      })

      if (!existingProduct) {
        return next(new AppError('Product not found', 404))
      }

      await prisma.orderItem.deleteMany({
        where: {
          productId: req.params.id
        }
      })

      await prisma.product.delete({
        where: { id: req.params.id }
      })

      res.json({
        success: true,
        message: 'Product deleted successfully (including related order items)',
        data: { deleted: true }
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router