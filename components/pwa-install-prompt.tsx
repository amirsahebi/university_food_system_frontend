'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Download, X, Share, PlusSquare, Smartphone, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [showIOSModal, setShowIOSModal] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if already running in standalone mode
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true

    setIsStandalone(standaloneMode)
    if (standaloneMode) return

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isAppleDevice)

    // Check dismissal cooldown (7 days)
    const lastDismissed = localStorage.getItem('javanfoods_pwa_dismissed')
    const isDismissedRecently =
      lastDismissed && Date.now() - parseInt(lastDismissed, 10) < 7 * 24 * 60 * 60 * 1000

    // Capture standard install prompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      if (!isDismissedRecently) {
        // Show prompt after a short pleasant delay
        const timer = setTimeout(() => setShowPrompt(true), 3000)
        return () => clearTimeout(timer)
      }
    }

    const handleAppInstalled = () => {
      setInstalled(true)
      setShowPrompt(false)
      setShowIOSModal(false)
      setDeferredPrompt(null)
      localStorage.setItem('javanfoods_pwa_installed', 'true')
    }

    // Custom trigger from anywhere in the app (e.g. What's New modal or profile)
    const handleOpenPwaTrigger = () => {
      if (isAppleDevice) {
        setShowIOSModal(true)
      } else if (deferredPrompt) {
        deferredPrompt.prompt()
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            setShowPrompt(false)
            setInstalled(true)
          }
        })
      } else {
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('open-pwa-install', handleOpenPwaTrigger)

    // For iOS users who haven't dismissed recently, show the prompt gently
    if (isAppleDevice && !isDismissedRecently && !standaloneMode) {
      const timer = setTimeout(() => setShowPrompt(true), 4000)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('appinstalled', handleAppInstalled)
        window.removeEventListener('open-pwa-install', handleOpenPwaTrigger)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('open-pwa-install', handleOpenPwaTrigger)
    }
  }, [deferredPrompt])

  const handleInstallClick = useCallback(async () => {
    if (isIOS) {
      setShowIOSModal(true)
      setShowPrompt(false)
      return
    }

    if (!deferredPrompt) {
      alert('برای نصب این برنامه، در منوی مرورگر خود گزینه "Install app" یا "Add to Home screen" را انتخاب کنید.')
      return
    }

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      if (choiceResult.outcome === 'accepted') {
        setInstalled(true)
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    } catch (err) {
      console.warn('Error during PWA installation:', err)
    }
  }, [deferredPrompt, isIOS])

  const handleDismiss = useCallback(() => {
    setShowPrompt(false)
    localStorage.setItem('javanfoods_pwa_dismissed', Date.now().toString())
  }, [])

  if (isStandalone || installed) {
    return null
  }

  return (
    <>
      {/* Floating Bottom Install Banner */}
      {showPrompt && (
        <div
          dir="rtl"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="bg-slate-900/95 backdrop-blur-xl border border-orange-500/40 shadow-2xl rounded-2xl p-4 text-white relative">
            <button
              onClick={handleDismiss}
              className="absolute top-3 left-3 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="بستن"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 pl-6">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-orange-600/20 border border-orange-500/30 flex-shrink-0 flex items-center justify-center p-1.5 shadow-md">
                <Image
                  src="/icons/icon-192x192.png"
                  alt="لوگوی جوان فودز"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex-1">
                <h4 className="font-bold text-sm text-orange-400 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-orange-400" />
                  نصب اپلیکیشن جوان فودز
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  با نصب نسخه پیشرو (PWA)، بدون نیاز به مرورگر و با دسترسی سریع‌تر و آسان‌تر غذا رزرو کنید.
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleInstallClick}
                    className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-medium text-xs px-3.5 py-1.5 h-auto rounded-lg shadow-md flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    نصب برنامه
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDismiss}
                    className="text-slate-400 hover:text-slate-200 text-xs px-2.5 py-1.5 h-auto hover:bg-slate-800"
                  >
                    بعداً
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* iOS Install Instruction Modal */}
      {showIOSModal && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-orange-500/30 rounded-2xl p-5 max-w-sm w-full text-white shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-orange-400 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-orange-400" />
                راهنمای نصب در آیفون (iOS)
              </h3>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-sm text-slate-300 leading-relaxed">
              <div className="flex items-start gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold flex-shrink-0">
                  ۱
                </span>
                <p>
                  در نوار پایین مرورگر سافاری (Safari)، دکمه{' '}
                  <span className="inline-flex items-center text-orange-400 font-semibold gap-1">
                    <Share className="w-4 h-4 inline" /> اشتراک‌گذاری (Share)
                  </span>{' '}
                  را لمس کنید.
                </p>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold flex-shrink-0">
                  ۲
                </span>
                <p>
                  در منوی باز شده به پایین اسکرول کرده و گزینه{' '}
                  <span className="inline-flex items-center text-orange-400 font-semibold gap-1">
                    <PlusSquare className="w-4 h-4 inline" /> افزودن به صفحه اصلی (Add to Home Screen)
                  </span>{' '}
                  را انتخاب نمایید.
                </p>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold flex-shrink-0">
                  ۳
                </span>
                <p>
                  در گوشه بالا روی{' '}
                  <span className="text-orange-400 font-semibold">افزودن (Add)</span> کلیک کنید تا آیکون برنامه در صفحه گوشی شما قرار گیرد.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800">
              <Button
                onClick={() => setShowIOSModal(false)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
              >
                <Check className="w-4 h-4 ml-2" />
                متوجه شدم
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
