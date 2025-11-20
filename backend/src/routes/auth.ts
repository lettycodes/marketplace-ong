import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'

const router = Router()

router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('name').trim().isLength({ min: 2, max: 100 }),
    body('password').isLength({ min: 6 }),
    body('organizationName').optional().trim().isLength({ min: 2, max: 255 }),
    body('organizationEmail').optional().isEmail().normalizeEmail(),
    body('organizationDescription').optional().trim()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return next(new AppError('Validation failed', 400))
      }

      const { 
        email, 
        name, 
        password, 
        organizationName, 
        organizationEmail, 
        organizationDescription 
      } = req.body

      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return next(new AppError('User already exists', 409))
      }

      const hashedPassword = await bcrypt.hash(password, 12)

      let organizationId = null

      if (organizationName && organizationEmail) {
        const existingOrg = await prisma.organization.findUnique({
          where: { email: organizationEmail }
        })

        if (existingOrg) {
          return next(new AppError('Organization with this email already exists', 409))
        }

        const organization = await prisma.organization.create({
          data: {
            name: organizationName,
            email: organizationEmail,
            description: organizationDescription || null
          }
        })

        organizationId = organization.id
      }

      const user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash: hashedPassword,
          organizationId,
          isAdmin: organizationId ? true : false
        },
        include: {
          organization: true
        }
      })

      const JWT_SECRET = process.env.JWT_SECRET
      if (!JWT_SECRET) {
        return next(new AppError('JWT secret not configured', 500))
      }

      const token = jwt.sign(
        { userId: user.id },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: user.organizationId,
          organization: user.organization,
          isAdmin: user.isAdmin
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return next(new AppError('Validation failed', 400))
      }

      const { email, password } = req.body

      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          organization: true
        }
      })

      if (!user) {
        return next(new AppError('Invalid credentials', 401))
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash)
      if (!isValidPassword) {
        return next(new AppError('Invalid credentials', 401))
      }

      const JWT_SECRET = process.env.JWT_SECRET
      if (!JWT_SECRET) {
        return next(new AppError('JWT secret not configured', 500))
      }

      const token = jwt.sign(
        { userId: user.id },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: user.organizationId,
          organization: user.organization,
          isAdmin: user.isAdmin
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router