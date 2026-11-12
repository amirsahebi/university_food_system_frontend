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
  logout: () => Promise<void> | void
  isLoading: boolean
  isAuthenticated: boolean
}

// Define authentication-related constants
const PROTECTED_ROUTES = ['/edit-profile', '/payment/verify', '/payment/history', '/payment/start']
const PUBLIC_ROUTES = ['/', '/sign-up', '/forgot-password']
const LOGIN_ROUTE = '/'
const DASHBOARD_ROUTE_PREFIX = '-dashboard'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  // Hydrate session immediately from localStorage on mount (0ms latency)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('access_token')
    const cachedUser = localStorage.getItem('user_data')
    if (token && cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser) as User
        setUser(parsed)
        setIsAuthenticated(true)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } catch {
        // Invalid json, will be re-fetched by checkAuth
      }
    }
  }, [])

  const clearAuthState = useCallback(() => {
    setUser(null)
    setIsAuthenticated(false)
    setIsLoading(false)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_data')
    localStorage.removeItem('user_role')
    try {
      localStorage.removeItem('javanfoods_notifications_store_v1')
      localStorage.removeItem('javanfoods_notifications_store_v2')
      localStorage.removeItem('javanfoods_notified_ready_orders')
      localStorage.removeItem('javanfoods_notified_ready_orders_v2')
    } catch {}
    delete api.defaults.headers.common['Authorization']
  }, [])

  const checkAuth = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    
    if (!token) {
      clearAuthState()
      const isPublicRoute = PUBLIC_ROUTES.includes(window.location.pathname)
      if (!isPublicRoute) {
        router.replace(LOGIN_ROUTE)
      }
      setIsLoading(false)
      return
    }

    try {
      const response = await api.get(createApiUrl(API_ROUTES.ME))
      const userData: User = response.data
      setUser(userData)
      setIsAuthenticated(true)
      localStorage.setItem('user_data', JSON.stringify(userData))
      localStorage.setItem('user_role', userData.role)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`

      // Prevent redirecting if already on a dashboard or protected route
      const currentPath = window.location.pathname
      const isProtectedRoute = PROTECTED_ROUTES.some(route => currentPath.includes(route))
      const isDashboardRoute = currentPath.includes(DASHBOARD_ROUTE_PREFIX)
      
      if (!isProtectedRoute && !isDashboardRoute) {
        router.replace(`/${userData.role}${DASHBOARD_ROUTE_PREFIX}`)
      }
    } catch (error) {
      console.error('Authentication check failed:', error)
      clearAuthState()
      
      const isPublicRoute = PUBLIC_ROUTES.includes(window.location.pathname)
      if (!isPublicRoute) {
        router.replace(LOGIN_ROUTE)
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
    localStorage.setItem('user_data', JSON.stringify(userData))
    localStorage.setItem('user_role', userData.role)
    const token = localStorage.getItem('access_token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    router.replace(`/${userData.role}${DASHBOARD_ROUTE_PREFIX}`)
  }

  const logout = useCallback(async () => {
    try {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null
      if (refreshToken) {
        try {
          await api.post(createApiUrl(API_ROUTES.SIGNOUT), { refresh_token: refreshToken })
        } catch {
          // ignore API error and proceed with local signout
        }
      }
    } finally {
      clearAuthState()
      if (typeof window !== 'undefined') {
        window.location.href = LOGIN_ROUTE
      } else {
        router.replace(LOGIN_ROUTE)
      }
    }
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
