import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/lib/auth-context'

export const metadata = {
  title: 'سامانه رزرو غذای دانشگاه - ورود',
  description: 'ورود به سیستم رزرو غذای آنلاین برای دانشگاه',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa">
      <body className={`font-sans bg-pattern bg-pattern-animate min-h-screen`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
