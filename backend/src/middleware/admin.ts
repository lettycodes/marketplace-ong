import { Request, Response, NextFunction } from 'express'
import { AppError } from './errorHandler'

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user

  if (!user) {
    return next(new AppError('Authentication required', 401))
  }

  if (!user.isAdmin) {
    return next(new AppError('Admin access required', 403))
  }

  next()
}