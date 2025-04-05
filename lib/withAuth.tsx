import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { ComponentType, useEffect } from 'react'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export function withAuth<T extends object>(WrappedComponent: ComponentType<T>, allowedRoles: string[] = []) {
  return function AuthenticatedComponent(props: T) {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!isLoading && !user) {
        router.push('/')
      } else if (user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        router.push('/')
      }
    }, [isLoading, user, router])

    if (isLoading) {
      return <LoadingSpinner />
    }

    if (!user || (allowedRoles.length > 0 && !allowedRoles.includes(user.role))) {
      return null
    }

    return <WrappedComponent {...props} />
  }
}
