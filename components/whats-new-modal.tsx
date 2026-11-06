'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import {
  Sparkles,
  Smartphone,
  Layers,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Download,
  ArrowLeft
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

const WHATS_NEW_VERSION = 'v2_2026_11'

interface FeatureItem {
  icon: React.ElementType
  title: string
  badge: string
  description: string
  color: string
  hasPwaAction?: boolean
}

const FEATURES: FeatureItem[] = [
  {
    icon: Smartphone,
    title: 'نصب نسخه وب‌اپلیکیشن (PWA)',
    badge: 'جدید و پرسرعت',
    description: 'امکان نصب مستقیم برنامه روی گوشی‌های هوشمند (اندروید و آیفون) و کامپیوتر بدون نیاز به استور؛ با دسترسی آنی از صفحه اصلی، لود پرسرعت و امکان کارکرد در وضعیت آفلاین.',
    color: 'from-orange-500 to-amber-500',
    hasPwaAction: true,
  },
  {
    icon: Layers,
    title: 'طراحی مدرن و شفاف (Glassmorphism)',
    badge: 'رابط کاربری جدید',
    description: 'بازطراحی کامل داشبورد دانشجویی و پنل‌های مدیریتی با جلوه‌های مدرن شیشه‌ای، کارت‌های جذاب و واکنش‌گرایی بهینه برای انواع نمایشگرهای موبایل و دسکتاپ.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Zap,
    title: 'افزایش سرعت و بهینه‌سازی عملکرد',
    badge: 'بهینه‌سازی سیستم',
    description: 'بهبود محسوس سرعت پاسخ‌دهی سامانه، کاهش زمان بارگذاری صفحات و سبد سفارش، و بهینه‌سازی ارتباط با سرور برای تجربه‌ای روان‌تر و پایدارتر در ساعت‌های اوج مراجعه.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: ShieldCheck,
    title: 'رفع باگ‌های کلی و جزئی',
    badge: 'پایداری و امنیت',
    description: 'برطرف‌سازی خطاهای لایه‌بندی و ریسپانسیو در نسخه‌های موبایل، ارتقای دقت فرمت‌های نمایشی و افزایش امنیت فرآیندهای پرداخت و مدیریت سفارشات.',
    color: 'from-purple-500 to-indigo-500',
  },
]

interface WhatsNewModalProps {
  forceOpen?: boolean
  onClose?: () => void
  isRegistration?: boolean
}

export function WhatsNewModal({ forceOpen = false, onClose, isRegistration = false }: WhatsNewModalProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (forceOpen) {
      setIsOpen(true)
      return
    }

    const handleManualOpen = () => {
      setIsOpen(true)
    }
    window.addEventListener('open-whats-new', handleManualOpen)

    if (!isLoading && isAuthenticated && user) {
      const storageKey = `javanfoods_whats_new_${user.id}_${WHATS_NEW_VERSION}`
      const hasSeen = localStorage.getItem(storageKey)

      if (!hasSeen) {
        const timer = setTimeout(() => {
          setIsOpen(true)
        }, 800)
        return () => {
          clearTimeout(timer)
          window.removeEventListener('open-whats-new', handleManualOpen)
        }
      }
    }

    return () => {
      window.removeEventListener('open-whats-new', handleManualOpen)
    }
  }, [user, isAuthenticated, isLoading, forceOpen])

  const handleClose = useCallback(() => {
    setIsOpen(false)

    if (user?.id) {
      const storageKey = `javanfoods_whats_new_${user.id}_${WHATS_NEW_VERSION}`
      localStorage.setItem(storageKey, 'true')
    }

    localStorage.setItem(`javanfoods_whats_new_seen_${WHATS_NEW_VERSION}`, 'true')

    if (onClose) {
      onClose()
    }
  }, [user, onClose])

  const triggerPwaInstall = useCallback(() => {
    window.dispatchEvent(new CustomEvent('open-pwa-install'))
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        dir="rtl"
        className="w-[94vw] max-w-lg p-0 overflow-hidden bg-slate-900/95 border border-slate-700/80 text-white rounded-2xl sm:rounded-3xl shadow-2xl backdrop-blur-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col [&>button:last-child]:bg-slate-800/80 [&>button:last-child]:text-slate-300 [&>button:last-child]:border-slate-700/60 [&>button:last-child]:hover:bg-slate-700 [&>button:last-child]:hover:text-white [&>button:last-child]:top-3 [&>button:last-child]:left-3 sm:[&>button:last-child]:top-4 sm:[&>button:last-child]:left-4"
      >
        <VisuallyHidden>
          <DialogTitle>امکانات و ویژگی‌های به‌روزرسانی‌شده سامانه جوان فودز</DialogTitle>
          <DialogDescription>آشنایی با قابلیت‌های جدید نسخه جدید رستوران جوان</DialogDescription>
        </VisuallyHidden>

        {/* Modal Header */}
        <div className="relative shrink-0 p-4 sm:p-5 sm:pb-4 bg-gradient-to-br from-orange-600/30 via-slate-800/60 to-slate-900 border-b border-white/10 pl-12 sm:pl-14">
          <div className="flex items-center gap-3">
            <div className="relative size-10 sm:size-12 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-tr from-orange-500 to-amber-400 p-0.5 shadow-md shadow-orange-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] sm:rounded-[14px] flex items-center justify-center p-1.5 sm:p-2">
                <Image
                  src="/images/javanfoods_logo.png"
                  alt="لوگو"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[11px] sm:text-xs font-semibold mb-1">
                <Sparkles className="size-3 text-orange-400 shrink-0" />
                <span>{isRegistration ? 'ثبت‌نام موفقیت‌آمیز بود 🎉' : 'به‌روزرسانی جدید سامانه'}</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug">
                {isRegistration ? 'خوش آمدید! امکانات جدید سامانه' : 'امکانات و تغییرات جدید جوان فودز'}
              </h2>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-300 leading-relaxed text-justify">
            در این نسخه امکانات جدیدی برای سرعت بالاتر، دسترسی آسان‌تر و بهبود تجربه رزرو غذای شما فراهم گردیده است:
          </p>
        </div>

        {/* Features Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-2.5 custom-scrollbar">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div
                key={idx}
                className="group relative p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/60 hover:border-orange-500/40 transition-all duration-200"
              >
                <div className="flex items-start gap-2.5 sm:gap-3.5">
                  <div
                    className={`size-9 sm:size-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform duration-200 mt-0.5`}
                  >
                    <Icon className="size-4 sm:size-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Consistent Title on Line 1 */}
                    <h3 className="font-bold text-xs sm:text-sm text-slate-100 leading-tight">
                      {feature.title}
                    </h3>

                    {/* Consistent Badge on Line 2 for ALL items */}
                    <div className="mt-1 mb-1.5">
                      <span className="inline-block whitespace-nowrap text-[10px] font-semibold text-orange-300 bg-orange-950/70 border border-orange-500/30 px-2 py-0.5 rounded-md">
                        {feature.badge}
                      </span>
                    </div>

                    {/* Justified Description on Line 3+ */}
                    <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed text-justify">
                      {feature.description}
                    </p>

                    {feature.hasPwaAction && (
                      <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                        <Button
                          size="sm"
                          onClick={triggerPwaInstall}
                          className="bg-orange-600 hover:bg-orange-700 text-white text-xs h-7 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-sm w-full sm:w-auto font-medium"
                        >
                          <Download className="size-3.5" />
                          <span>نصب مستقیم اپلیکیشن</span>
                        </Button>
                        <span className="text-[10px] sm:text-[11px] text-slate-400 text-center sm:text-right">
                          بدون نیاز به دانلود فایل سنگین
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 p-3 sm:p-4 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[11px] sm:text-xs text-slate-400 order-2 sm:order-1">
            <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
            <span>تنها یک‌بار به شما نمایش داده می‌شود</span>
          </div>

          <Button
            onClick={handleClose}
            className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 h-10 sm:h-auto rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 order-1 sm:order-2"
          >
            <span>متوجه شدم و ورود به سامانه</span>
            <ArrowLeft className="size-4 shrink-0" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
