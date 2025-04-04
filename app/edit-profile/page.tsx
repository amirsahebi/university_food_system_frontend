'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import EditProfile from './EditProfile'
import { withAuth } from '@/lib/withAuth'
import { LoadingSpinner } from '@/components/LoadingSpinner'

function EditProfilePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  return <EditProfile />
}

export default withAuth(EditProfilePage)

