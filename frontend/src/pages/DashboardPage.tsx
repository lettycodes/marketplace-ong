import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface DashboardStats {
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  lowStockProducts: number
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStockProducts: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const productsResponse = await fetch('/api/products?limit=1000', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        const products = productsData.data.products
        
        setStats({
          totalProducts: products.length,
          totalOrders: 0, 
          totalRevenue: 0, 
          lowStockProducts: products.filter((p: any) => p.stockQty <= 5).length
        })
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard: React.FC<{ title: string; value: string | number; color: string; icon: string }> = 
    ({ title, value, color, icon }) => (
      <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${color}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className="text-3xl">{icon}</div>
        </div>
      </div>
    )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Carregando dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Bem-vindo, {user?.name}! Gerencie sua organização aqui.
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total de Produtos"
            value={stats.totalProducts}
            color="border-blue-500"
            icon="📦"
          />
          <StatCard
            title="Pedidos"
            value={stats.totalOrders}
            color="border-green-500"
            icon="🛒"
          />
          <StatCard
            title="Receita Total"
            value={`R$ ${stats.totalRevenue.toFixed(2)}`}
            color="border-purple-500"
            icon="💰"
          />
          <StatCard
            title="Estoque Baixo"
            value={stats.lowStockProducts}
            color="border-red-500"
            icon="⚠️"
          />
        </div>

        {/* Ações Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            to="/dashboard/products"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-blue-500 block group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
                  Gerenciar Produtos
                </h3>
                <p className="text-gray-600 text-sm">
                  Adicionar, editar e excluir produtos do seu catálogo
                </p>
              </div>
              <div className="text-2xl group-hover:scale-110 transition-transform">
                🏷️
              </div>
            </div>
            <div className="mt-4 text-sm text-blue-600 font-medium">
              Ver produtos →
            </div>
          </Link>

          <Link
            to="/dashboard/logs"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500 block group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-green-600">
                  Logs do Sistema
                </h3>
                <p className="text-gray-600 text-sm">
                  Visualizar logs de atividades e observabilidade básica
                </p>
              </div>
              <div className="text-2xl group-hover:scale-110 transition-transform">
                📋
              </div>
            </div>
            <div className="mt-4 text-sm text-green-600 font-medium">
              Ver logs →
            </div>
          </Link>
        </div>

        {/* Produtos com Estoque Baixo */}
        {stats.lowStockProducts > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                ⚠️ Produtos com Estoque Baixo
              </h3>
              <Link 
                to="/dashboard/products"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Ver todos
              </Link>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                Você tem {stats.lowStockProducts} produto(s) com estoque baixo (≤ 5 unidades). 
                <Link to="/dashboard/products" className="font-medium underline ml-1">
                  Clique aqui para gerenciar
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Ações Rápidas */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/dashboard/products"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <span>➕</span>
              Adicionar Produto
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <span>🔄</span>
              Atualizar Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}