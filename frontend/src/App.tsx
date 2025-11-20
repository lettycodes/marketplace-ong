import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { Navbar } from './components/Navbar'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { CartPage } from './pages/CartPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProductsManagePage } from './pages/ProductsManagePage'
import { LogsPage } from './pages/LogsPage'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute requireOrganization>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/products"
                  element={
                    <ProtectedRoute requireOrganization>
                      <ProductsManagePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/logs"
                  element={
                    <ProtectedRoute requireOrganization>
                      <LogsPage />
                    </ProtectedRoute>
                  }
                />
                {/* Redirect rota antiga para nova */}
                <Route
                  path="/products-manage"
                  element={<Navigate to="/dashboard/products" replace />}
                />
              </Routes>
            </main>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  )
}

export default App