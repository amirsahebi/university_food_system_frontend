'use client'

import ReceiverDashboard from './ReceiverDashboard'
import { withAuth } from '@/lib/withAuth'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LoadingSpinner } from '@/components/LoadingSpinner'

const ReceiverDashboardPage = () => {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
    } else if (user && user.role !== 'receiver') {
      router.push('/')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  return <ReceiverDashboard />
}

export default withAuth(ReceiverDashboardPage, ['receiver'])

