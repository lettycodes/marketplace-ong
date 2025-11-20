export interface User {
  id: string
  email: string
  name: string
  organizationId?: string
  organization?: Organization
  isAdmin: boolean
}

export interface Organization {
  id: string
  name: string
  email: string
  description?: string
  website?: string
  phone?: string
  address?: string
}

export interface Category {
  id: string
  name: string
  _count?: {
    products: number
  }
}

export interface Product {
  id: string
  name: string
  description: string
  price: string 
  imageUrl?: string
  stockQty: number
  weightGrams: number
  organizationId: string
  categoryId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  category: Category
  organization: {
    id: string
    name: string
    description?: string
  }
}

export interface CartItem {
  productId: string
  quantity: number
  product: Product
}

export interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: string 
  product: Product
}

export interface Order {
  id: string
  userId?: string
  organizationId: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  totalAmount: number
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
  orderItems: OrderItem[]
  organization: Organization
}

export interface SearchResult {
  products: Product[]
  searchInfo?: {
    originalQuery: string
    interpretation: string
    filters: SearchFilters
    aiSuccess: boolean
    fallbackUsed: boolean
  }
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface SearchFilters {
  category?: string
  priceMin?: number
  priceMax?: number
  keywords?: string[]
  organization?: string
}