import React from 'react'
import { useCart } from '../contexts/CartContext'

export const CartPage: React.FC = () => {
  const { items, updateQuantity, removeFromCart, getTotalPrice } = useCart()

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(price))
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Seu carrinho está vazio</h1>
          <p className="text-gray-600">Adicione alguns produtos para continuar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Carrinho de Compras</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center py-4 border-b border-gray-200 last:border-b-0">
              <img
                src={item.product.imageUrl || '/placeholder.jpg'}
                alt={item.product.name}
                className="w-20 h-20 object-cover rounded"
              />
              <div className="flex-1 ml-4">
                <h3 className="text-lg font-medium text-gray-900">{item.product.name}</h3>
                <p className="text-gray-500">{item.product.organization.name}</p>
                <p className="text-lg font-semibold text-primary-600">{formatPrice(item.product.price)}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded"
                >
                  -
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded"
                >
                  +
                </button>
              </div>
              
              <button
                onClick={() => removeFromCart(item.productId)}
                className="ml-4 text-red-600 hover:text-red-800"
              >
                Remover
              </button>
            </div>
          ))}
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-semibold">Total:</span>
              <span className="text-2xl font-bold text-primary-600">
                {formatPrice(getTotalPrice())}
              </span>
            </div>
            
            <button className="w-full btn-primary">
              Finalizar Pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}