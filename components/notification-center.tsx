'use client'

import { useState, useEffect } from 'react'
import { Bell, Sparkles, Smartphone, Check, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const NOTIFICATION_VERSION = 'v2_2026_11'

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const lastRead = localStorage.getItem('javanfoods_notif_last_read')
    if (lastRead !== NOTIFICATION_VERSION) {
      setHasUnread(true)
    }
  }, [])

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      setHasUnread(false)
      localStorage.setItem('javanfoods_notif_last_read', NOTIFICATION_VERSION)
    }
  }

  const handleOpenWhatsNew = () => {
    setIsOpen(false)
    setHasUnread(false)
    localStorage.setItem('javanfoods_notif_last_read', NOTIFICATION_VERSION)
    window.dispatchEvent(new CustomEvent('open-whats-new'))
  }

  const handleOpenPwaInstall = () => {
    setIsOpen(false)
    window.dispatchEvent(new CustomEvent('open-pwa-install'))
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="glass"
          size="sm"
          className="relative size-8 sm:size-9 p-0 rounded-full hover:bg-orange-500/10 text-foreground transition-transform active:scale-95 cursor-pointer"
          title="مرکز اعلانات و پیام‌ها"
          aria-label="مرکز اعلانات"
        >
          <Bell className="size-4 text-primary" />
          {hasUnread && (
            <span className="absolute top-1 left-1 flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-orange-500"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        dir="rtl"
        align="start"
        sideOffset={8}
        className="w-[90vw] max-w-sm p-0 rounded-2xl bg-slate-900/95 border border-slate-700/80 text-white shadow-2xl backdrop-blur-2xl overflow-hidden z-50"
      >
        {/* Header */}
        <div className="p-3.5 bg-gradient-to-r from-orange-600/30 to-slate-800/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Bell className="size-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-white">مرکز اعلانات سامانه</h4>
              <p className="text-[10px] text-slate-400">پیام‌ها و رویدادهای مهم</p>
            </div>
          </div>

          {hasUnread ? (
            <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-medium">
              ۱ جدید
            </span>
          ) : (
            <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full font-normal">
              خوانده شده
            </span>
          )}
        </div>

        {/* Notifications List */}
        <div className="p-3 space-y-2.5 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* Notification 1: What's New Announcement */}
          <div className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800/90 border border-orange-500/30 transition-all">
            <div className="flex items-start gap-2.5">
              <div className="size-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shrink-0 mt-0.5">
                <Sparkles className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h5 className="font-bold text-xs text-white">به‌روزرسانی جدید جوان فودز</h5>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                    نسخه جدید
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed text-justify mb-2">
                  قابلیت‌های تازه از جمله نسخه وب‌اپلیکیشن (PWA)، طراحی شیشه‌ای مدرن، افزایش چشمگیر سرعت بارگذاری و رفع باگ‌های سامانه فعال گردید.
                </p>
                <Button
                  size="sm"
                  onClick={handleOpenWhatsNew}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs h-7 rounded-lg flex items-center justify-center gap-1 shadow-sm font-medium"
                >
                  <span>مشاهده جزئیات به‌روزرسانی</span>
                  <ChevronLeft className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Notification 2: PWA Install Notification */}
          <div className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/60 transition-all">
            <div className="flex items-start gap-2.5">
              <div className="size-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shrink-0 mt-0.5">
                <Smartphone className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h5 className="font-bold text-xs text-slate-100">نصب اپلیکیشن (PWA)</h5>
                  <span className="text-[9px] text-slate-400">پیشنهادی</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed text-justify mb-2">
                  برای دسترسی بدون نیاز به مرورگر و رزرو سریع‌تر غذا، می‌توانید سامانه را روی صفحه اصلی تلفن همراه خود نصب کنید.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOpenPwaInstall}
                  className="w-full border-slate-700 hover:border-orange-500/50 hover:bg-slate-700/50 text-slate-200 text-xs h-7 rounded-lg flex items-center justify-center gap-1"
                >
                  <span>نصب مستقیم اپلیکیشن</span>
                  <ChevronLeft className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Check className="size-3 text-emerald-400" />
            تمام اعلانات سامانه به‌روز هستند
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
