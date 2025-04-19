import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/lib/auth-context'

export const metadata = {
  title: 'رستوران جوان',
  description: 'سامانه رزرو غذای دانشگاه',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa">
      <head>
        <link rel="icon" href="images/javanfoods_logo.png" />
      </head>
      <body className={`font-sans bg-pattern bg-pattern-animate min-h-screen`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
