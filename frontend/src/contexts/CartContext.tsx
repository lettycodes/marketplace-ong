import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { CartItem, Product } from '../types'

interface CartContextType {
  items: CartItem[]
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

interface CartProviderProps {
  children: ReactNode
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const savedCart = localStorage.getItem('cart_items')
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (error) {
        localStorage.removeItem('cart_items')
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('cart_items', JSON.stringify(items))
  }, [items])

  const addToCart = (product: Product, quantity = 1) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.productId === product.id)
      
      if (existingItem) {
        const newQuantity = Math.min(existingItem.quantity + quantity, product.stockQty)
        return currentItems.map(item =>
          item.productId === product.id
            ? { ...item, quantity: newQuantity }
            : item
        )
      }
      
      return [...currentItems, {
        productId: product.id,
        quantity: Math.min(quantity, product.stockQty),
        product
      }]
    })
  }

  const removeFromCart = (productId: string) => {
    setItems(currentItems => currentItems.filter(item => item.productId !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setItems(currentItems =>
      currentItems.map(item => {
        if (item.productId === productId) {
          const maxQuantity = item.product.stockQty
          return { ...item, quantity: Math.min(quantity, maxQuantity) }
        }
        return item
      })
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (Number(item.product.price) * item.quantity), 0)
  }

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}