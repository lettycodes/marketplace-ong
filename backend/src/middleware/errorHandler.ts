import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export class AppError extends Error {
  statusCode: number
  isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err }
  error.message = err.message

  logger.error({
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    })
  }

  if (err.name === 'ValidationError') {
    const message = 'Validation Error'
    return res.status(400).json({
      success: false,
      message
    })
  }

  if (err.name === 'CastError') {
    const message = 'Invalid ID format'
    return res.status(400).json({
      success: false,
      message
    })
  }

  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  })
}