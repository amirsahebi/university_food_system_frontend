'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import {
  Bell,
  UtensilsCrossed,
  ShoppingBag,
  CreditCard,
  Award,
  ChevronLeft,
  Volume2,
  CheckCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { toPersianDigits } from '@/lib/formatters'
import api from '@/lib/axios'
import { API_ROUTES, createApiUrl } from '@/lib/api'

const VAPID_PUBLIC_KEY = 'BLymNQ0DAvVqm6zISqV6s7z9tc8-UgRmIZ4Utz4Bj0WsyK8Y-QxEUNugVCaspGhJ2lzYR__gSh1fGsnkyiP9OAI'

function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

async function registerWebPushSubscription() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return
  }
  try {
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }
    if (sub) {
      const subJson = sub.toJSON()
      await api.post(createApiUrl(API_ROUTES.PUSH_SUBSCRIPTION), subJson)
    }
  } catch (err) {
    console.warn('Could not register web push subscription:', err)
  }
}

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
  createdAt?: number
  read: boolean
  orderId?: number
  foodName?: string
  actionLabel?: string
  actionType?: 'view_orders' | 'view_whats_new' | 'pwa_install' | 'custom'
}

function formatNotificationTime(item: AppNotification): string {
  let timeMs: number | null = null

  if (item.createdAt && typeof item.createdAt === 'number') {
    timeMs = item.createdAt
  } else if (item.timestamp && /^\d+$/.test(item.timestamp)) {
    timeMs = parseInt(item.timestamp, 10)
  } else if (item.id) {
    const match = item.id.match(/-(\d{12,14})$/)
    if (match) {
      timeMs = parseInt(match[1], 10)
    }
  }

  if (!timeMs && item.timestamp && item.timestamp !== 'هم‌اکنون') {
    const parsed = Date.parse(item.timestamp)
    if (!isNaN(parsed)) timeMs = parsed
  }

  if (!timeMs) return 'هم‌اکنون'

  const now = Date.now()
  const diffSec = Math.max(0, Math.floor((now - timeMs) / 1000))

  if (diffSec < 60) return 'هم‌اکنون'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${toPersianDigits(diffMin)} دقیقه پیش`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${toPersianDigits(diffHours)} ساعت پیش`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'دیروز'
  if (diffDays < 7) return `${toPersianDigits(diffDays)} روز پیش`

  try {
    return new Intl.DateTimeFormat('fa-IR', {
      month: 'numeric',
      day: 'numeric',
    }).format(new Date(timeMs))
  } catch {
    return `${toPersianDigits(diffDays)} روز پیش`
  }
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

export function NotificationCenter({
  reservations = [],
  onViewOrders,
}: NotificationCenterProps) {
  const { user } = useAuth()
  const userKey = user ? String(user.id || user.phone_number) : null

  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default')
  const [isClient, setIsClient] = useState(false)

  // Initialize notifications from localStorage scoped strictly to current user
  useEffect(() => {
    setIsClient(true)
    if (typeof window === 'undefined') return

    // Purge any legacy shared keys so previous accounts never leak to another student
    try {
      localStorage.removeItem('javanfoods_notifications_store_v1')
      localStorage.removeItem('javanfoods_notifications_store_v2')
      localStorage.removeItem('javanfoods_notified_ready_orders')
      localStorage.removeItem('javanfoods_notified_ready_orders_v2')
    } catch {}

    if ('Notification' in window) {
      setPermissionState(Notification.permission)
      if (Notification.permission === 'granted' && userKey) {
        registerWebPushSubscription().catch(() => {})
      }
    }

    if (!userKey) {
      setNotifications([])
      return
    }

    const storageKey = `javanfoods_notifications_${userKey}`
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored) as AppNotification[]
        setNotifications(parsed)
      } else {
        setNotifications([])
      }
    } catch {
      setNotifications([])
    }
  }, [userKey])

  // Sync notifications to user-isolated localStorage
  const persistNotifications = useCallback((items: AppNotification[]) => {
    setNotifications(items)
    if (typeof window !== 'undefined' && userKey) {
      try {
        localStorage.setItem(`javanfoods_notifications_${userKey}`, JSON.stringify(items))
      } catch (err) {
        console.error('Failed to persist notifications:', err)
      }
    }
  }, [userKey])

  // Request browser Notification Permission
  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('مرورگر شما از اعلان‌ها پشتیبانی نمی‌کند')
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setPermissionState(permission)

      if (permission === 'granted') {
        await registerWebPushSubscription()
        toast.success('اعلان‌های هوشمند سلف با موفقیت فعال شد')
        await sendNativeNotification(
          'اعلان‌های هوشمند فعال شد 🔔',
          'به محض آماده شدن غذای شما در سلف، حتی در صورت بسته بودن مرورگر مطلع خواهید شد.'
        )
      } else {
        toast.error('اجازه ارسال اعلان داده نشد')
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err)
    }
  }

  // Robust Native System Push Notification Dispatcher (Compatible with Android Chrome, Samsung Internet & iOS PWA)
  const sendNativeNotification = async (title: string, body: string, orderId?: number) => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) return

    if (Notification.permission !== 'granted') return

    const options = {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: orderId ? `food-ready-${orderId}` : `javanfoods-${Date.now()}`,
      data: { url: '/student-dashboard?tab=orders' },
    } as NotificationOptions & { vibrate?: number[] }

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready
        if (reg && reg.showNotification) {
          await reg.showNotification(title, options)
          return
        }
      }

      if (typeof Notification === 'function') {
        new Notification(title, options)
      }
    } catch (e) {
      console.warn('Native notification dispatch error:', e)
    }
  }

  // Detect when an order of THIS STUDENT becomes ready and trigger notification
  useEffect(() => {
    if (!reservations || reservations.length === 0 || !isClient || !userKey) return

    const notifiedKey = `javanfoods_notified_ready_${userKey}`
    let notifiedIds: number[] = []
    try {
      const raw = localStorage.getItem(notifiedKey)
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
        const title = 'غذای شما آماده تحویل است 🍲'
        const description = `سفارش «${foodName}» (شماره #${order.id}) آماده تحویل می‌باشد.`
        const now = Date.now()

        newItems.push({
          id: `food-ready-${order.id}-${now}`,
          type: 'food_ready',
          title,
          description,
          timestamp: new Date(now).toISOString(),
          createdAt: now,
          read: false,
          orderId: order.id,
          foodName,
          actionLabel: 'مشاهده فیش تحویل',
          actionType: 'view_orders',
        })

        sendNativeNotification(title, description, order.id)
        notifiedIds.push(order.id)
      })

      try {
        localStorage.setItem(notifiedKey, JSON.stringify(notifiedIds))
      } catch (err) {
        console.error('Failed to update notified orders:', err)
      }

      setNotifications((prev) => {
        const updated = [...newItems, ...prev]
        if (userKey) {
          try {
            localStorage.setItem(`javanfoods_notifications_${userKey}`, JSON.stringify(updated))
          } catch {}
        }
        return updated
      })
    }
  }, [reservations, isClient, userKey])

  // Listen for custom notification events
  useEffect(() => {
    const handleCustomNotification = (e: Event) => {
      const customEvent = e as CustomEvent<Partial<AppNotification>>
      if (!customEvent.detail) return

      const now = Date.now()
      const newNotif: AppNotification = {
        id: customEvent.detail.id || `notif-${now}`,
        type: customEvent.detail.type || 'announcement',
        title: customEvent.detail.title || 'اعلان جدید',
        description: customEvent.detail.description || '',
        timestamp: new Date(now).toISOString(),
        createdAt: now,
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

  // Mark single notification as read
  const handleItemClick = (item: AppNotification) => {
    if (!item.read) {
      const updated = notifications.map((n) => (n.id === item.id ? { ...n, read: true } : n))
      persistNotifications(updated)
    }
  }

  // Handle action button click
  const handleAction = (item: AppNotification, e: React.MouseEvent) => {
    e.stopPropagation()
    handleItemClick(item)
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

  // Icon mapping
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'food_ready':
        return (
          <div className="size-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <UtensilsCrossed className="size-4" />
          </div>
        )
      case 'order_placed':
        return (
          <div className="size-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center shrink-0">
            <ShoppingBag className="size-4" />
          </div>
        )
      case 'payment':
        return (
          <div className="size-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center shrink-0">
            <CreditCard className="size-4" />
          </div>
        )
      case 'trust_score':
        return (
          <div className="size-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center shrink-0">
            <Award className="size-4" />
          </div>
        )
      default:
        return (
          <div className="size-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center shrink-0">
            <Bell className="size-4" />
          </div>
        )
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="glass"
          size="sm"
          className="relative size-8 sm:size-9 p-0 rounded-full hover:bg-orange-500/10 text-foreground transition-transform active:scale-95 cursor-pointer shadow-xs"
          title="مرکز اعلان‌ها"
          aria-label="مرکز اعلان‌ها"
        >
          <Bell className="size-4 text-foreground/80" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-orange-600 text-[9px] font-bold text-white ring-2 ring-white dark:ring-neutral-900 animate-in zoom-in-75">
              {unreadCount > 9 ? '+۹' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        dir="rtl"
        align="end"
        sideOffset={8}
        collisionPadding={12}
        className="w-[calc(100vw-1.5rem)] sm:w-[380px] max-w-[380px] p-0 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-2xl overflow-hidden z-50"
      >
        {/* Clean, calm header */}
        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/60 dark:bg-neutral-900/60">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
              اعلان‌ها
            </span>
            {unreadCount > 0 && (
              <span className="text-[11px] font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-full">
                {unreadCount} جدید
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="text-[11px] font-medium text-neutral-500 hover:text-orange-600 dark:text-neutral-400 dark:hover:text-orange-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <CheckCheck className="size-3.5" />
              <span>خواندن همه</span>
            </button>
          )}
        </div>

        {/* Compact, clean permission banner */}
        {permissionState !== 'granted' && (
          <div className="px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Volume2 className="size-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
              <p className="text-[11px] text-neutral-600 dark:text-neutral-300 truncate">
                دریافت اعلان آماده شدن غذا
              </p>
            </div>
            <button
              type="button"
              onClick={requestNotificationPermission}
              className="h-6 px-2.5 text-[11px] font-medium bg-orange-600 hover:bg-orange-700 text-white rounded-md shrink-0 transition-colors cursor-pointer"
            >
              فعال‌سازی
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="max-h-[360px] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800 custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="py-10 text-center px-4">
              <div className="size-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-2.5 text-neutral-400 dark:text-neutral-500">
                <Bell className="size-5" />
              </div>
              <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                هیچ اعلانی ندارید
              </p>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1 leading-normal">
                به محض آماده شدن سفارش در سلف، اینجا مطلع خواهید شد.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={cn(
                  'flex items-start gap-3 p-3.5 transition-colors cursor-pointer',
                  !item.read
                    ? 'bg-orange-50/40 dark:bg-orange-950/15 hover:bg-orange-50/70 dark:hover:bg-orange-950/25'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                )}
              >
                {getNotificationIcon(item.type)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                      {formatNotificationTime(item)}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                    {item.description}
                  </p>

                  {item.actionLabel && (
                    <button
                      type="button"
                      onClick={(e) => handleAction(item, e)}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 transition-colors cursor-pointer"
                    >
                      <span>{item.actionLabel}</span>
                      <ChevronLeft className="size-3" />
                    </button>
                  )}
                </div>

                {!item.read && (
                  <span
                    className="size-1.5 rounded-full bg-orange-500 shrink-0 mt-1.5"
                    title="خوانده نشده"
                  />
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
