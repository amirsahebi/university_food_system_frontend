'use client'

import AdminDashboard from './AdminDashboard'
import { withAuth } from '@/lib/withAuth'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LoadingSpinner } from '@/components/LoadingSpinner'

const AdminDashboardPage = () => {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
    } else if (user && user.role !== 'admin') {
      router.push('/')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  return <AdminDashboard />
}

export default withAuth(AdminDashboardPage, ['admin'])

