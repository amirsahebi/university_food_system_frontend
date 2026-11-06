'use client'

import { useEffect } from 'react'

export function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          })

          // Check for worker updates immediately on page load
          try {
            await registration.update()
          } catch {
            // Ignore offline update check errors
          }
          
          if (registration.installing) {
            console.log('[PWA] Service worker installing')
          } else if (registration.waiting) {
            console.log('[PWA] Service worker installed')
          } else if (registration.active) {
            console.log('[PWA] Service worker active')
          }

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New version available')
                }
              })
            }
          })
        } catch (error) {
          console.warn('[PWA] Service worker registration failed:', error)
        }
      }

      if (document.readyState === 'complete') {
        registerServiceWorker()
      } else {
        window.addEventListener('load', registerServiceWorker)
        return () => window.removeEventListener('load', registerServiceWorker)
      }
    }
  }, [])

  return null
}
