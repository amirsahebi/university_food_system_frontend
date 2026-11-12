'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Bell,
  UtensilsCrossed,
  ShoppingBag,
  Sparkles,
  CreditCard,
  Award,
  Check,
  ChevronLeft,
  ChevronDown,
  Volume2,
  ExternalLink,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type NotificationType =
  | 'food_ready'
  | 'order_placed'
  | 'payment'
  | 'trust_score'
  | 'announcement'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  description: string
  timestamp: string
  read: boolean
  orderId?: number
  foodName?: string
  actionLabel?: string
  actionType?: 'view_orders' | 'view_whats_new' | 'pwa_install' | 'custom'
}

interface ReservationSummary {
  id: number
  status: string
  food?: {
    name: string
  }
}

interface NotificationCenterProps {
  reservations?: ReservationSummary[]
  onViewOrders?: () => void
}

const STORAGE_KEY = 'javanfoods_notifications_store_v1'
const NOTIFIED_READY_KEY = 'javanfoods_notified_ready_orders'

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-trust-score',
    type: 'trust_score',
    title: 'سیستم هوشمند امتیاز اعتماد',
    description:
      'به ازای هر ۱۰۰ هزار تومان خرید آزاد، ۱ امتیاز به امتیاز اعتماد شما افزوده می‌شود. با امتیاز مثبت می‌توانید از فیش دانشجویی با تخفیف سلف استفاده کنید.',
    timestamp: 'امروز',
    read: false,
    actionLabel: 'متوجه شدم',
  },
  {
    id: 'notif-pwa',
    type: 'announcement',
    title: 'نصب نسخه وب‌اپلیکیشن (PWA)',
    description:
      'برای دسترسی سریع‌تر، عدم نیاز به مرورگر و دریافت بی‌درنگ نوتیفیکیشن آماده شدن غذا، سامانه جوان‌فودز را به صفحه اصلی گوشی خود اضافه کنید.',
    timestamp: 'به‌تازگی',
    read: true,
    actionLabel: 'نصب برنامه',
    actionType: 'pwa_install',
  },
  {
    id: 'notif-welcome',
    type: 'announcement',
    title: 'طراحی شیشه‌ای جدید جوان‌فودز',
    description:
      'رابط کاربری جدید با سرعت بارگذاری فوق‌العاده، طراحی شفاف شیشه‌ای و مرکز اعلان‌های لحظه‌ای برای رفاه دانشجویان راه‌اندازی شد.',
    timestamp: 'به‌تازگی',
    read: true,
    actionLabel: 'مشاهده جزئیات',
    actionType: 'view_whats_new',
  },
]

export function NotificationCenter({
  reservations = [],
  onViewOrders,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [activeFilter, setActiveFilter] = useState<'all' | 'food_ready' | 'unread'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default')
  const [isClient, setIsClient] = useState(false)

  // Initialize notifications from localStorage
  useEffect(() => {
    setIsClient(true)
    if (typeof window === 'undefined') return

    if ('Notification' in window) {
      setPermissionState(Notification.permission)
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as AppNotification[]
        setNotifications(parsed)
      } else {
        setNotifications(DEFAULT_NOTIFICATIONS)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS))
      }
    } catch {
      setNotifications(DEFAULT_NOTIFICATIONS)
    }
  }, [])

  // Sync notifications to localStorage
  const persistNotifications = useCallback((items: AppNotification[]) => {
    setNotifications(items)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
      } catch (err) {
        console.error('Failed to persist notifications:', err)
      }
    }
  }, [])

  // Request browser Notification Permission
  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return

    try {
      const permission = await Notification.requestPermission()
      setPermissionState(permission)

      if (permission === 'granted') {
        // Send a pleasant test notification confirmation
        sendNativeNotification(
          'اعلان‌های هوشمند فعال شد 🔔',
          'از این پس به محض آماده شدن غذای شما در سلف، سریعاً باخبر خواهید شد.'
        )
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err)
    }
  }

  // Helper to send native system push notification
  const sendNativeNotification = (title: string, body: string, orderId?: number) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
            vibrate: [200, 100, 200],
            tag: orderId ? `food-ready-${orderId}` : 'javanfoods-general',
            data: { url: '/student-dashboard?tab=orders' },
          } as any)
        })
      } else {
        new Notification(title, {
          body,
          icon: '/icons/icon-192x192.png',
        })
      }
    } catch (e) {
      console.warn('Native notification dispatch error:', e)
    }
  }

  // Detect when an order becomes ready and trigger notification
  useEffect(() => {
    if (!reservations || reservations.length === 0 || !isClient) return

    let notifiedIds: number[] = []
    try {
      const raw = localStorage.getItem(NOTIFIED_READY_KEY)
      if (raw) notifiedIds = JSON.parse(raw)
    } catch {
      notifiedIds = []
    }

    const readyOrders = reservations.filter(
      (r) => r.status === 'ready_to_pickup' && !notifiedIds.includes(r.id)
    )

    if (readyOrders.length > 0) {
      const newItems: AppNotification[] = []

      readyOrders.forEach((order) => {
        const foodName = order.food?.name || 'سفارش غذا'
        const title = 'غذای شما آماده تحویل است! 🍲'
        const description = `سفارش «${foodName}» (شماره سفارش #${order.id}) در سلف آماده تحویل می‌باشد. لطفاً جهت دریافت مراجعه نمایید.`

        newItems.push({
          id: `food-ready-${order.id}-${Date.now()}`,
          type: 'food_ready',
          title,
          description,
          timestamp: 'هم‌اکنون',
          read: false,
          orderId: order.id,
          foodName,
          actionLabel: 'مشاهده فیش سفارش',
          actionType: 'view_orders',
        })

        // Fire native OS/Browser push notification
        sendNativeNotification(title, description, order.id)

        notifiedIds.push(order.id)
      })

      try {
        localStorage.setItem(NOTIFIED_READY_KEY, JSON.stringify(notifiedIds))
      } catch (err) {
        console.error('Failed to update notified orders:', err)
      }

      setNotifications((prev) => {
        const updated = [...newItems, ...prev]
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        } catch {}
        return updated
      })
    }
  }, [reservations, isClient])

  // Listen for custom notification events
  useEffect(() => {
    const handleCustomNotification = (e: Event) => {
      const customEvent = e as CustomEvent<Partial<AppNotification>>
      if (!customEvent.detail) return

      const newNotif: AppNotification = {
        id: customEvent.detail.id || `notif-${Date.now()}`,
        type: customEvent.detail.type || 'announcement',
        title: customEvent.detail.title || 'اعلان جدید',
        description: customEvent.detail.description || '',
        timestamp: 'هم‌اکنون',
        read: false,
        actionLabel: customEvent.detail.actionLabel,
        actionType: customEvent.detail.actionType,
      }

      setNotifications((prev) => {
        const next = [newNotif, ...prev]
        persistNotifications(next)
        return next
      })
    }

    window.addEventListener('javanfoods-add-notification', handleCustomNotification)
    return () => window.removeEventListener('javanfoods-add-notification', handleCustomNotification)
  }, [persistNotifications])

  // Unread badge counter
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length
  }, [notifications])

  // Mark all as read
  const handleMarkAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }))
    persistNotifications(updated)
  }

  // Toggle item expand and mark single as read
  const handleItemClick = (item: AppNotification) => {
    setExpandedId((prev) => (prev === item.id ? null : item.id))
    if (!item.read) {
      const updated = notifications.map((n) => (n.id === item.id ? { ...n, read: true } : n))
      persistNotifications(updated)
    }
  }

  // Handle action button click
  const handleAction = (item: AppNotification, e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(false)

    if (item.actionType === 'view_orders') {
      if (onViewOrders) {
        onViewOrders()
      } else {
        window.dispatchEvent(new CustomEvent('switch-to-orders-tab'))
      }
    } else if (item.actionType === 'view_whats_new') {
      window.dispatchEvent(new CustomEvent('open-whats-new'))
    } else if (item.actionType === 'pwa_install') {
      window.dispatchEvent(new CustomEvent('open-pwa-install'))
    }
  }

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'food_ready') {
      return notifications.filter((n) => n.type === 'food_ready')
    }
    if (activeFilter === 'unread') {
      return notifications.filter((n) => !n.read)
    }
    return notifications
  }, [notifications, activeFilter])

  // Visual configuration for each notification type
  const getTypeConfig = (type: NotificationType) => {
    switch (type) {
      case 'food_ready':
        return {
          icon: UtensilsCrossed,
          tag: 'آماده تحویل',
          iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/25',
          chipBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          cardBg: 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20',
        }
      case 'order_placed':
        return {
          icon: ShoppingBag,
          tag: 'ثبت سفارش',
          iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sky-500/25',
          chipBg: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
          cardBg: 'bg-sky-500/5 hover:bg-sky-500/10 border-sky-500/20',
        }
      case 'payment':
        return {
          icon: CreditCard,
          tag: 'تراکنش مالی',
          iconBg: 'bg-gradient-to-br from-amber-500 to-yellow-600 text-white shadow-amber-500/25',
          chipBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
          cardBg: 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20',
        }
      case 'trust_score':
        return {
          icon: Award,
          tag: 'امتیاز اعتماد',
          iconBg: 'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-orange-500/25',
          chipBg: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
          cardBg: 'bg-orange-500/5 hover:bg-orange-500/10 border-orange-500/20',
        }
      case 'announcement':
      default:
        return {
          icon: Sparkles,
          tag: 'اطلاعیه',
          iconBg: 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-purple-500/25',
          chipBg: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
          cardBg: 'bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/20',
        }
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="glass"
          size="sm"
          className="relative size-9 p-0 rounded-full hover:bg-orange-500/10 text-foreground transition-transform active:scale-95 cursor-pointer shadow-xs"
          title="مرکز اعلانات هوشمند"
          aria-label="مرکز اعلانات"
        >
          <Bell className="size-4 text-primary" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-orange-600 text-[10px] font-black text-white shadow-sm ring-2 ring-white dark:ring-neutral-900 animate-in zoom-in-75">
              {unreadCount > 9 ? '+۹' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        dir="rtl"
        align="start"
        sideOffset={8}
        className="w-[94vw] max-w-sm p-0 rounded-3xl glass-strong border border-glass-border text-foreground shadow-2xl backdrop-blur-2xl overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-3.5 bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-transparent border-b border-black/5 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-xs">
              <Bell className="size-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-foreground">مرکز اعلانات هوشمند</h4>
              <p className="text-[10px] text-muted-foreground">اطلاع‌رسانی لحظه‌ای سفارش‌ها و سلف</p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline px-2 py-1 rounded-lg transition-colors cursor-pointer"
            >
              خواندن همه
            </button>
          )}
        </div>

        {/* Web Push Permission Prompt (Replacing SMS for Food Ready) */}
        {permissionState !== 'granted' && (
          <div className="p-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border-b border-emerald-500/20">
            <div className="flex items-start gap-2.5">
              <div className="size-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Volume2 className="size-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  اعلان لحظه‌ای آماده شدن غذا (جایگزین پیامک)
                </h5>
                <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed mt-0.5">
                  برای مطلع شدن سریع از آماده شدن غذا حتی خارج از صفحه سایت، اجازه اعلان مرورگر را صادر کنید.
                </p>
                <Button
                  size="sm"
                  onClick={requestNotificationPermission}
                  className="mt-2 h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <ShieldCheck className="size-3.5" />
                  فعال‌سازی اعلان هوشمند
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Chips */}
        <div className="px-3 pt-2.5 pb-1 flex items-center gap-1.5 border-b border-black/5 dark:border-white/10">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer',
              activeFilter === 'all'
                ? 'bg-brand text-white shadow-xs'
                : 'text-muted-foreground hover:bg-black/5'
            )}
          >
            همه ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('food_ready')}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1',
              activeFilter === 'food_ready'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-muted-foreground hover:bg-black/5'
            )}
          >
            <span className="size-1.5 rounded-full bg-emerald-500" />
            آماده تحویل
          </button>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('unread')}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer',
                activeFilter === 'unread'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:bg-black/5'
              )}
            >
              خوانده‌نشده ({unreadCount})
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="p-3 space-y-2 max-h-[58vh] overflow-y-auto custom-scrollbar">
          {filteredNotifications.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Check className="size-8 mx-auto text-emerald-500/60 mb-2" />
              <p className="text-xs font-medium">اعلانی در این دسته وجود ندارد</p>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const cfg = getTypeConfig(item.type)
              const Icon = cfg.icon
              const isExpanded = expandedId === item.id

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    'p-3 rounded-2xl border transition-all cursor-pointer relative overflow-hidden',
                    cfg.cardBg,
                    !item.read && 'ring-1 ring-orange-500/30'
                  )}
                >
                  {/* Unread Indicator Bar */}
                  {!item.read && (
                    <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-amber-500" />
                  )}

                  <div className="flex items-start gap-2.5">
                    {/* Squircle Shape Icon with Gradient */}
                    <div
                      className={cn(
                        'size-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-0.5',
                        cfg.iconBg
                      )}
                    >
                      <Icon className="size-4.5 stroke-[2.2]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Top Meta: Tag & Timestamp */}
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                            cfg.chipBg
                          )}
                        >
                          {cfg.tag}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {item.timestamp}
                        </span>
                      </div>

                      {/* Title */}
                      <h5 className="font-bold text-xs text-foreground leading-snug">
                        {item.title}
                      </h5>

                      {/* Description with Expand/Collapse */}
                      <p
                        className={cn(
                          'text-[11px] text-muted-foreground leading-relaxed mt-1 text-justify transition-all',
                          !isExpanded && 'line-clamp-2'
                        )}
                      >
                        {item.description}
                      </p>

                      {/* Expanded View Details & Action Button */}
                      {isExpanded && item.actionLabel && (
                        <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-2 animate-in fade-in-0 duration-150">
                          {item.orderId && (
                            <span className="text-[10px] font-mono text-muted-foreground">
                              کد پیگیری: #{item.orderId}
                            </span>
                          )}
                          <Button
                            size="sm"
                            onClick={(e) => handleAction(item, e)}
                            className="mr-auto h-7 px-3 bg-brand text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1 hover:brightness-105 active:scale-95 transition-all"
                          >
                            <span>{item.actionLabel}</span>
                            <ChevronLeft className="size-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/5 dark:border-white/10 text-center">
          <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1.5 font-medium">
            <Check className="size-3 text-emerald-500" />
            اعلانات سلف و سفارشات به صورت زنده همگام هستند
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
