'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import api from './axios'
import { API_ROUTES, createApiUrl } from './api'

interface User {
  id: string
  phone_number: string
  role: 'admin' | 'student' | 'chef' | 'receiver'
  first_name: string
  last_name: string
  avatar_url: string
}

interface AuthContextType {
  user: User | null
  login: (userData: User) => Promise<void>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}

// Define authentication-related constants
const PROTECTED_ROUTES = ['/edit-profile', '/payment/verify']
const LOGIN_ROUTE = '/'
const DASHBOARD_ROUTE_PREFIX = '-dashboard'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  const clearAuthState = useCallback(() => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    delete api.defaults.headers.common['Authorization']
  }, [])

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    
    if (!token) {
      clearAuthState()
      if (window.location.pathname !== LOGIN_ROUTE) {
        router.push(LOGIN_ROUTE)
      }
      setIsLoading(false)
      return
    }

    try {
      const response = await api.get(createApiUrl(API_ROUTES.ME))
      setUser(response.data)
      setIsAuthenticated(true)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`

      // Prevent redirecting from specific routes
      const currentPath = window.location.pathname
      const isProtectedRoute = PROTECTED_ROUTES.some(route => currentPath.includes(route))
      
      if (!isProtectedRoute) {
        router.push(`/${response.data.role}${DASHBOARD_ROUTE_PREFIX}`)
      }
    } catch (error) {
      console.error('Authentication check failed:', error)
      clearAuthState()
      
      if (window.location.pathname !== LOGIN_ROUTE) {
        router.push(LOGIN_ROUTE)
      }
    } finally {
      setIsLoading(false)
    }
  }, [router, clearAuthState])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (userData: User) => {
    setUser(userData)
    setIsAuthenticated(true)
    api.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('access_token')}`
    router.push(`/${userData.role}${DASHBOARD_ROUTE_PREFIX}`)
  }

  const logout = useCallback(() => {
    clearAuthState()
    router.push(LOGIN_ROUTE)
  }, [router, clearAuthState])

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading,
      isAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
