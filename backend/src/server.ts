import express, { Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'

import { logger } from './utils/logger'
import { requestLogger as loggingMiddleware } from './services/logService'
import { requestLogger } from './middleware/requestLogger'
import { errorHandler } from './middleware/errorHandler'
import authRoutes from './routes/auth'
import productRoutes from './routes/products'
import organizationRoutes from './routes/organizations'
import orderRoutes from './routes/orders'
import publicRoutes from './routes/public'
import logRoutes from './routes/logs'
import searchRoutes from './routes/search'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, 
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

app.use(helmet())
app.use(cors())
app.use(limiter)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(loggingMiddleware) 

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/organizations', organizationRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/public', publicRoutes)
app.use('/api/logs', logRoutes)
app.use('/api/search', searchRoutes)

app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'NGO Marketplace API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      products: '/api/products',
      organizations: '/api/organizations',
      orders: '/api/orders',
      public: '/api/public',
      logs: '/api/logs',
      search: '/api/search'
    }
  })
})

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use(errorHandler)

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
})