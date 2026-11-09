import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/lib/auth-context'
import { PWARegister } from '@/components/pwa-register'
import { PWAInstallPrompt } from '@/components/pwa-install-prompt'
import { WhatsNewModal } from '@/components/whats-new-modal'
import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  themeColor: '#ea580c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'رستوران جوان | سامانه رزرو غذای دانشگاه',
  description: 'سامانه هوشمند سفارش، رزرو و تحویل آنلاین غذای دانشجویی رستوران جوان',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'جوان فودز',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  other: {
    enamad: '9523117',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <meta name="enamad" content="9523117" />
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="جوان فودز" />
      </head>
      <body className="font-sans bg-pattern bg-pattern-animate min-h-screen">
        <AuthProvider>
          {children}
          <WhatsNewModal />
          <PWAInstallPrompt />
          <PWARegister />
        </AuthProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
