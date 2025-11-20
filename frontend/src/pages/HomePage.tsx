import React, { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Product, Category, SearchResult } from '../types'
import { useCart } from '../contexts/CartContext'

export const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [searchInfo, setSearchInfo] = useState<any>(null)
  const { addToCart } = useCart()

  useEffect(() => {
    loadCategories()
    loadProducts()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await api.get('/public/categories')
      setCategories(response.data.data.categories)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadProducts = async (filters: any = {}) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filters.category) params.append('category', filters.category)
      if (filters.priceMin) params.append('priceMin', filters.priceMin)
      if (filters.priceMax) params.append('priceMax', filters.priceMax)
      if (filters.search) params.append('search', filters.search)

      const response = await api.get(`/public/products?${params.toString()}`)
      setProducts(response.data.data.products)
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSmartSearch = async () => {
    if (!searchQuery.trim()) {
      loadProducts()
      setSearchInfo(null)
      return
    }

    try {
      setLoading(true)
      const response = await api.post(`/public/search?q=${encodeURIComponent(searchQuery)}`)
      const data: SearchResult = response.data.data
      
      setProducts(data.products)
      setSearchInfo(data.searchInfo)
    } catch (error) {
      console.error('Error in smart search:', error)
      loadProducts({ search: searchQuery })
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = () => {
    const filters: any = {}
    
    if (selectedCategory) filters.category = selectedCategory
    if (priceRange.min) filters.priceMin = priceRange.min
    if (priceRange.max) filters.priceMax = priceRange.max

    loadProducts(filters)
    setSearchInfo(null)
  }

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(price))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Marketplace das ONGs
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Conectando consumidores conscientes com organizações que fazem a diferença. 
            Descubra produtos únicos e apoie causas importantes.
          </p>
        </div>

        {/* Smart Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Busca Inteligente</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ex: doces até 50 reais, artesanato da ONG Esperança..."
              className="input-field flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSmartSearch()}
            />
            <button
              onClick={handleSmartSearch}
              className="btn-primary whitespace-nowrap"
            >
              Buscar com AI
            </button>
          </div>
          
          {searchInfo && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Busca interpretada:</strong> {searchInfo.interpretation}
              </p>
              <div className="text-xs text-blue-600 mt-1">
                {searchInfo.aiSuccess ? '🤖 Processado pela AI' : '🔍 Busca simples (fallback)'}
                {searchInfo.fallbackUsed && ' • AI indisponível'}
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Preço mínimo"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
              className="input-field"
            />

            <input
              type="number"
              placeholder="Preço máximo"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
              className="input-field"
            />

            <button
              onClick={handleFilterChange}
              className="btn-secondary"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando produtos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Nenhum produto encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">{product.description}</p>
                  
                  <div className="mb-3">
                    <span className="inline-block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded">
                      {product.category.name}
                    </span>
                    <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded ml-2">
                      {product.organization.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-primary-600">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Estoque: {product.stockQty}
                    </span>
                  </div>

                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stockQty === 0}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                      product.stockQty === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'btn-primary'
                    }`}
                  >
                    {product.stockQty === 0 ? 'Sem estoque' : 'Adicionar ao Carrinho'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}