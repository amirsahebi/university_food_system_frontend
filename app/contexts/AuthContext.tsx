'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  role: 'admin' | 'student' | 'chef' | 'receiver'
  username: string
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock user data for preview
const mockUsers = [
  { id: '1', name: 'Admin User', role: 'admin', username: 'admin', password: 'admin123' },
  { id: '2', name: 'Student User', role: 'student', username: 'student', password: 'student123' },
  { id: '3', name: 'Chef User', role: 'chef', username: 'chef', password: 'chef123' },
  { id: '4', name: 'Receiver User', role: 'receiver', username: 'receiver', password: 'receiver123' },
]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser) as User)
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    // Mock login logic
    const foundUser = mockUsers.find(u => u.username === username && u.password === password)
    if (foundUser) {
      /* eslint-disable @typescript-eslint/no-unused-vars */
      const { password: _, ...userWithoutCredentials } = foundUser
      setUser(userWithoutCredentials as User)
      localStorage.setItem('user', JSON.stringify(userWithoutCredentials))
      router.push(`/${foundUser.role}-dashboard`)
    } else {
      throw new Error('Invalid credentials')
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
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
