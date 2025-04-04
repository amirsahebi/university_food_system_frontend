'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token')
    if (token) {
      try {
        const response = await api.get(createApiUrl(API_ROUTES.ME))
        setUser(response.data)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        if (window.location.pathname !== '/edit-profile' && !window.location.pathname.includes('/payment/verify')) {
          router.push(`/${response.data.role}-dashboard`)
        }
      } catch (error) {
        console.error('Authentication check failed:', error)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        if (window.location.pathname !== '/') {
          router.push('/')
        }
      }
    } else if (window.location.pathname !== '/') {
      router.push('/')
    }
    setIsLoading(false)
  }

  const login = async (userData: User) => {
    setUser(userData)
    api.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('access_token')}`
    router.push(`/${userData.role}-dashboard`)
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    delete api.defaults.headers.common['Authorization']
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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

