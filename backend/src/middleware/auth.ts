import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'
import { AppError } from './errorHandler'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    name: string
    organizationId?: string
    isAdmin: boolean
  }
  userId?: string
  organizationId?: string
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return next(new AppError('Access token required', 401))
    }

    const JWT_SECRET = process.env.JWT_SECRET
    if (!JWT_SECRET) {
      return next(new AppError('JWT secret not configured', 500))
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        organization: true
      }
    })

    if (!user) {
      return next(new AppError('User not found', 401))
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId || undefined,
      isAdmin: user.isAdmin
    }

    req.userId = user.id
    req.organizationId = user.organizationId || undefined

    next()
  } catch (error) {
    return next(new AppError('Invalid token', 401))
  }
}

export const requireOrganization = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.organizationId) {
    return next(new AppError('Organization membership required', 403))
  }
  next()
}