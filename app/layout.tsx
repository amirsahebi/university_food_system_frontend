import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/lib/auth-context'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={`${inter.className} bg-pattern bg-pattern-animate min-h-screen`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}

