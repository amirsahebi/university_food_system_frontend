"use client"

import { useMemo, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { NotificationCenter } from "@/components/notification-center"
import { InteractiveDateSlider } from "@/components/interactive-date-slider"
import {
  Utensils,
  Clock,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Copy,
  CheckCheck,
  ShieldCheck,
  Info,
  Ticket,
  Sun,
  Moon,
  ShoppingBag,
  User,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FoodImage } from "@/components/ui/food-image"
import { cn } from "@/lib/utils"
import { toast, Toaster } from "react-hot-toast"
import { DateObject } from "react-multi-date-picker"
import { API_ROUTES, createApiUrl } from "@/lib/api"
import api from "@/lib/axios"
import { useAuth } from "@/lib/auth-context"
import { toPersianDigits, formatPersianPrice } from "@/lib/formatters"

/* ---------- Data Types ---------- */
interface TimeSlot {
  id: number
  start_time: string
  end_time: string
  capacity?: number
}

interface TrustScoreData {
  trust_score: number
  trust_score_updated_at: string
  can_use_vouchers: boolean
  status: "good" | "recovery_in_progress"
  recovery_info?: {
    points_to_recover: number
    estimated_days: number
    recovery_rate: string
    message: string
  }
}

interface UserProfile {
  id?: number
  username?: string
  student?: {
    id?: number
    first_name?: string
    last_name?: string
    phone_number?: string
  }
  trust_score?: number
  trust_score_recovery_days?: number
  trust_score_data?: TrustScoreData
}

interface VoucherType {
  id: number
  code: string
  name: string
  discount_amount: number | string
  is_active: boolean
  description?: string
}

interface MenuItem {
  id: number
  food: {
    id: number
    name: string
    price: number
    image_url: string
    category_id: number
    category_name: string
    allowed_vouchers?: VoucherType[]
    supports_extra_voucher?: boolean
  }
  start_time: string
  end_time: string
  time_slot_count: number
  time_slot_capacity: number
  daily_capacity: number
  is_available: boolean
  time_slots: TimeSlot[]
}

interface DailyMenu {
  id: number
  date: string
  meal_type: string
  items: MenuItem[]
}

type ReservationStatus =
  | "waiting"
  | "preparing"
  | "ready_to_pickup"
  | "picked_up"
  | "not_picked_up"
  | "pending_payment"
  | "cancelled"

interface Reservation {
  id: number
  student: {
    id: number
    phone_number: string
  }
  food: {
    id: number
    name: string
    image_url: string
  }
  time_slot: TimeSlot
  reserved_date: string
  voucher_type?: VoucherType
  voucher_discount_applied?: number
  has_voucher: boolean
  price: number
  status: ReservationStatus
  delivery_code: string
  reservation_number: string
  payment_status?: "pending" | "paid" | "failed"
  meal_type: string
}

const STATUS: Record<string, { label: string; cls: string }> = {
  waiting: { label: "در انتظار", cls: "bg-info-soft text-info" },
  preparing: { label: "در حال آماده‌سازی", cls: "bg-warning-soft text-warning" },
  ready_to_pickup: { label: "آماده تحویل", cls: "bg-success-soft text-success" },
  picked_up: { label: "تحویل شده", cls: "bg-muted text-muted-foreground" },
  not_picked_up: { label: "تحویل نگرفته", cls: "bg-destructive-soft text-destructive" },
  pending_payment: { label: "در انتظار پرداخت", cls: "bg-accent text-accent-foreground" },
  cancelled: { label: "لغو شده", cls: "bg-destructive-soft text-destructive" },
}

/* ---------- Sheet / Modal Component ---------- */
function Sheet({
  open,
  onClose,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs sm:items-center p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "glass-strong w-full max-h-[88vh] flex flex-col rounded-t-[2rem] sm:w-[460px] sm:rounded-[2rem] shadow-2xl border border-glass-border overflow-hidden",
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ---------- Trust Card Component ---------- */
function TrustCard({
  score,
  recoveryDays,
}: {
  score: number
  recoveryDays?: number | null
}) {
  const tone =
    score > 5
      ? ["عالی", "bg-success-soft text-success", "text-success"]
      : score > 0
      ? ["خوب", "bg-success-soft text-success", "text-success"]
      : score === 0
      ? ["خنثی", "bg-warning-soft text-warning", "text-warning"]
      : ["محدود", "bg-destructive-soft text-destructive", "text-destructive"]

  const pct = Math.max(4, Math.min(100, 50 + score * 2.5))
  const rules = [
    ["+", "افزایش امتیاز", "هر ۱۰٬۰۰۰ تومان پرداخت موفق", "۱+", "bg-success-soft text-success"],
    ["−", "کاهش امتیاز", "رزرو با ژتون که تحویل گرفته نشود", "۱۰-", "bg-destructive-soft text-destructive"],
    ["↻", "بازیابی خودکار", "فقط برای امتیاز منفی، تا صفر", "۲+ / روز", "bg-info-soft text-info"],
  ]

  return (
    <div className="glass mx-auto max-w-xl rounded-[1.75rem] p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-brand text-primary-foreground shadow-glow">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h3 className="font-bold">امتیاز اعتبار</h3>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="text-primary hover:opacity-80 transition cursor-pointer"
                    aria-label="توضیح امتیاز"
                  >
                    <Info className="size-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent dir="rtl" className="glass-strong w-80 rounded-2xl p-4 shadow-xl border border-glass-border">
                  <h4 className="mb-2 font-bold text-primary">امتیاز اعتبار چیست؟</h4>
                  <p className="mb-3 text-xs leading-6 text-muted-foreground">
                    میزان اعتماد سیستم به شما بر اساس رفتار پرداخت و رزرو. در صورت منفی بودن امتیاز، امکان استفاده از ژتون وجود ندارد.
                  </p>
                  <div className="space-y-2">
                    {rules.map(([i, t, d, v, c]) => (
                      <div key={t} className="flex items-center gap-2 rounded-xl bg-glass p-2">
                        <span className={cn("grid size-7 place-items-center rounded-full text-sm font-bold", c)}>
                          {i}
                        </span>
                        <div className="flex-1">
                          <div className="text-xs font-semibold">{t}</div>
                          <div className="text-[0.7rem] text-muted-foreground">{d}</div>
                        </div>
                        <span className={cn("rounded-full px-2 py-0.5 text-[0.7rem] font-bold", c)}>
                          {v}
                        </span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <p className="text-xs text-muted-foreground">وضعیت حساب شما</p>
          </div>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", tone[1])}>
          {tone[0]}
        </span>
      </div>
      <div className="mt-5 flex items-end justify-between">
        <span className="text-sm text-muted-foreground">امتیاز فعلی</span>
        <div className="text-left">
          <span className={cn("text-3xl font-extrabold", tone[2])}>{toPersianDigits(score)}</span>
          {score < 0 && recoveryDays && (
            <div className="text-[0.7rem] text-destructive mt-0.5">
              زمان بازیابی: {toPersianDigits(recoveryDays)} روز دیگر
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/* ---------- Main Dashboard Component ---------- */
export default function StudentDashboard() {
  const router = useRouter()
  const { logout } = useAuth()

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedMeal, setSelectedMeal] = useState<"lunch" | "dinner">("lunch")
  const [activeTab, setActiveTab] = useState<"menu" | "orders">("menu")
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

  const [dailyMenu, setDailyMenu] = useState<DailyMenu | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [voucherTypes, setVoucherTypes] = useState<VoucherType[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  const [selectedFood, setSelectedFood] = useState<MenuItem | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<number | null>(null)
  const [selectedVoucherId, setSelectedVoucherId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false)

  const [copiedId, setCopiedId] = useState<number | null>(null)

  /* ---------- Data Fetching ---------- */
  const fetchUserProfile = useCallback(async () => {
    try {
      const userResponse = await api.get(createApiUrl(API_ROUTES.ME))
      try {
        const trustScoreResponse = await api.get(createApiUrl(API_ROUTES.GET_TRUST_SCORE))
        const trustData = trustScoreResponse.data
        setUserProfile({
          ...userResponse.data,
          trust_score: trustData.trust_score,
          trust_score_recovery_days: trustData.recovery_info?.estimated_days || null,
          trust_score_data: trustData,
        })
      } catch (trustError) {
        console.error("Error fetching trust score", trustError)
        setUserProfile(userResponse.data)
      }
    } catch (error) {
      console.error("Error fetching user profile", error)
    }
  }, [])

  const fetchDailyMenu = useCallback(async () => {
    try {
      const formattedDate = new DateObject(selectedDate).format("YYYY-MM-DD")
      const response = await api.get(createApiUrl(API_ROUTES.GET_DAILY_MENU), {
        params: {
          date: formattedDate,
          meal_type: selectedMeal,
        },
      })
      setDailyMenu(response.data)
    } catch (error) {
      console.error("Error fetching daily menu:", error)
      setDailyMenu(null)
    }
  }, [selectedDate, selectedMeal])

  const fetchVoucherTypes = useCallback(async () => {
    try {
      const response = await api.get(createApiUrl(API_ROUTES.GET_VOUCHER_TYPES))
      setVoucherTypes(response.data)
    } catch (error) {
      console.error("Error fetching voucher types:", error)
      setVoucherTypes([])
    }
  }, [])

  const fetchReservations = useCallback(async () => {
    try {
      const response = await api.get(createApiUrl(API_ROUTES.GET_STUDENT_ORDERS))
      setReservations(response.data)
    } catch (error) {
      console.error("Error fetching reservations:", error)
      setReservations([])
    }
  }, [])

  useEffect(() => {
    fetchDailyMenu()
    fetchReservations()
    fetchVoucherTypes()
    fetchUserProfile()
  }, [fetchDailyMenu, fetchReservations, fetchVoucherTypes, fetchUserProfile])

  // Refresh reservations on window focus
  useEffect(() => {
    const handleFocus = () => {
      fetchReservations()
    }
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [fetchReservations])

  /* ---------- Menu Categories & Filtering ---------- */
  const categories = useMemo(() => {
    if (!dailyMenu?.items) return []
    const map = new Map<number, string>()
    dailyMenu.items.forEach((item) => {
      if (item.food?.category_id && item.food?.category_name) {
        map.set(item.food.category_id, item.food.category_name)
      }
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [dailyMenu])

  const menuItems = useMemo(() => {
    if (!dailyMenu?.items) return []
    return dailyMenu.items.filter(
      (item) => selectedCategory === null || item.food.category_id === selectedCategory
    )
  }, [dailyMenu, selectedCategory])

  /* ---------- Pricing Calculations ---------- */
  const calculateTotalPrice = useCallback(() => {
    if (!selectedFood) return 0
    let totalPrice = Number(selectedFood.food.price)
    if (selectedVoucherId) {
      const vt = voucherTypes.find((v) => v.id === selectedVoucherId)
      if (vt) {
        totalPrice -= Number(vt.discount_amount)
      }
    }
    return Math.max(0, totalPrice)
  }, [selectedFood, selectedVoucherId, voucherTypes])

  const selectedVoucher = useMemo(() => {
    if (!selectedVoucherId) return null
    return voucherTypes.find((v) => v.id === selectedVoucherId) || null
  }, [selectedVoucherId, voucherTypes])

  const voucherDiscount = useMemo(() => {
    return selectedVoucher ? Number(selectedVoucher.discount_amount) : 0
  }, [selectedVoucher])

  /* ---------- Dialog & Order Handlers ---------- */
  const handleOpenFood = (item: MenuItem) => {
    const validTimeSlots = (item.time_slots || [])
      .filter((slot) => slot !== null)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))

    setSelectedFood({
      ...item,
      time_slots: validTimeSlots,
    })
    const firstAvailableSlot = validTimeSlots.find((s) => s.capacity === undefined || s.capacity > 0)
    setSelectedTimeSlot(firstAvailableSlot ? firstAvailableSlot.id : null)
    setSelectedVoucherId(null)
    setIsDialogOpen(true)
  }

  const handleConfirmSelection = () => {
    if (!selectedFood || !selectedTimeSlot) {
      toast.error("لطفاً یک بازه زمانی انتخاب کنید")
      return
    }

    const canUseVouchers =
      userProfile?.trust_score_data?.can_use_vouchers ??
      (userProfile?.trust_score !== undefined ? userProfile.trust_score >= 0 : true)

    if (!canUseVouchers && selectedVoucherId) {
      toast.error("به دلیل امتیاز اعتبار منفی، امکان استفاده از ژتون وجود ندارد")
      return
    }

    if (selectedVoucherId) {
      const allowed = selectedFood.food.allowed_vouchers || []
      const isAllowed = allowed.some((v) => v.id === selectedVoucherId)
      if (!isAllowed) {
        toast.error("این غذا از ژتون انتخاب‌شده پشتیبانی نمی‌کند")
        return
      }
    }

    setIsDialogOpen(false)
    setIsPaymentDialogOpen(true)
  }

  const handlePayment = async () => {
    if (!selectedFood || !selectedTimeSlot) {
      toast.error("لطفاً یک غذا و یک بازه زمانی برای دریافت غذا انتخاب کنید")
      return
    }

    setIsPaymentProcessing(true)

    try {
      const callbackUrl = `${window.location.origin}/payment/verify`
      const totalPrice = calculateTotalPrice()

      const orderResponse = await api.post(createApiUrl(API_ROUTES.PLACE_ORDER), {
        food: selectedFood.food.id,
        time_slot: selectedTimeSlot,
        meal_type: selectedMeal,
        reserved_date: new DateObject(selectedDate).format("YYYY-MM-DD"),
        voucher_type: selectedVoucherId,
        has_voucher: Boolean(selectedVoucherId),
      })

      if (totalPrice === 0) {
        toast.success("سفارش با موفقیت ثبت شد")
        setIsPaymentProcessing(false)
        setIsPaymentDialogOpen(false)
        setSelectedFood(null)
        setActiveTab("orders")
        fetchReservations()
        return
      }

      const paymentResponse = await api.post(createApiUrl(API_ROUTES.PAYMENT_REQUEST), {
        amount: totalPrice,
        callback_url: callbackUrl,
        reservation_id: orderResponse.data.id,
      })

      if (paymentResponse.status === 201) {
        window.location.href = paymentResponse.data.redirect_url
      } else {
        toast.error("خطا در ایجاد درخواست پرداخت. لطفاً دوباره تلاش کنید")
        setIsPaymentProcessing(false)
      }
    } catch (error: unknown) {
      const isAxiosError = (
        err: unknown
      ): err is { response?: { data?: { message?: string; non_field_errors?: string[] } } } => {
        return typeof err === "object" && err !== null && "response" in err
      }

      if (
        isAxiosError(error) &&
        error.response?.data?.non_field_errors?.[0] ===
          "You already have a reservation for this date and meal type."
      ) {
        toast.error("شما قبلاً سفارشی برای این تاریخ و وعده داشته اید")
        setIsPaymentProcessing(false)
        return
      }

      console.error("Error in payment process:", error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : isAxiosError(error)
          ? error.response?.data?.message || "خطا در پرداخت"
          : "خطا در فرآیند پرداخت. لطفاً دوباره تلاش کنید"
      toast.error(errorMessage)
      setIsPaymentProcessing(false)
    }
  }

  const handlePaymentForOrder = async (reservation: Reservation) => {
    setIsPaymentProcessing(true)
    try {
      const response: { data: unknown } = await api.post(
        createApiUrl(API_ROUTES.PAYMENT_REQUEST),
        {
          reservation_id: reservation.id,
          amount: Math.round(reservation.price),
          callback_url: `${window.location.origin}/payment/verify`,
        }
      )
      window.location.href = (response.data as { redirect_url: string }).redirect_url
    } catch (error) {
      console.error("Error processing payment:", error)
      toast.error("خطا در پرداخت سفارش")
      setIsPaymentProcessing(false)
    }
  }

  const handleCancelReservation = async (reservationId: number) => {
    try {
      await api.delete(createApiUrl(API_ROUTES.CANCEL_RESERVATION(String(reservationId))))
      toast.success("سفارش با موفقیت لغو شد")
      fetchReservations()
    } catch (error) {
      console.error("Error cancelling reservation:", error)
      toast.error("خطا در لغو سفارش")
    }
  }

  const copyToClipboard = (o: Reservation) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(String(o.delivery_code))
    }
    setCopiedId(o.id)
    toast.success("کد تحویل کپی شد")
    setTimeout(() => setCopiedId(null), 1500)
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast.success("با موفقیت از حساب کاربری خارج شدید")
    } catch (error) {
      console.error("Error logging out:", error)
      toast.error("خطا در خروج از حساب کاربری")
    }
  }

  const trustScore = userProfile?.trust_score ?? 0
  const recoveryDays = userProfile?.trust_score_recovery_days ?? null

  return (
    <div dir="rtl" className="bg-page min-h-screen pb-16 font-sans text-foreground">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="sticky top-0 z-40 px-2 sm:px-4 pt-3 sm:pt-4">
        <div className="glass mx-auto flex max-w-6xl items-center justify-between rounded-full px-3 sm:px-4 py-2 sm:py-2.5">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="relative size-8 sm:size-9 shrink-0 drop-shadow-sm">
              <Image
                src="/images/javanfoods_logo.png"
                alt="رستوران جوان"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-extrabold text-sm sm:text-base text-foreground tracking-tight truncate">
              رستوران جوان
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Notification Center */}
            <NotificationCenter />

            {/* PWA Install */}
            <Button
              variant="glass"
              size="sm"
              className="gap-1.5 text-orange-500 hover:text-orange-600 size-8 sm:size-auto sm:px-3 p-0 sm:py-1.5 rounded-full"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("open-pwa-install"))
              }}
              title="نصب نسخه وب‌اپلیکیشن (PWA)"
            >
              <Download className="size-4" />
              <span className="hidden md:inline text-xs font-medium">نصب برنامه</span>
            </Button>

            {/* Payment History */}
            <Button
              variant="glass"
              size="sm"
              className="gap-1.5 size-8 sm:size-auto sm:px-3 p-0 sm:py-1.5 rounded-full"
              onClick={() => router.push("/payment/history")}
              title="تاریخچه پرداخت‌ها"
            >
              <CreditCard className="size-4 text-primary" />
              <span className="hidden sm:inline text-xs">تراکنش‌ها</span>
            </Button>

            {/* Profile */}
            <Button
              variant="glass"
              size="sm"
              className="gap-1.5 size-8 sm:size-auto sm:px-3 p-0 sm:py-1.5 rounded-full"
              onClick={() => router.push("/edit-profile")}
              title="پروفایل کاربری"
            >
              <User className="size-4 text-primary" />
              <span className="hidden sm:inline text-xs">پروفایل</span>
            </Button>

            {/* Logout */}
            <Button
              variant="glass"
              size="sm"
              className="gap-1.5 size-8 sm:size-auto sm:px-3 p-0 sm:py-1.5 rounded-full hover:text-destructive"
              onClick={handleLogout}
              title="خروج از حساب کاربری"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline text-xs">خروج</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto mt-6 max-w-6xl space-y-6 px-4">
        {/* Trust Card */}
        <TrustCard score={trustScore} recoveryDays={recoveryDays} />

        {/* Controls: Date Picker & Meal Switcher */}
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <InteractiveDateSlider
            selectedDate={selectedDate}
            onChange={setSelectedDate}
          />

          <div className="glass flex rounded-full p-1.5">
            {([["lunch", "ناهار", Sun], ["dinner", "شام", Moon]] as const).map(([k, l, I]) => {
              const isActive = selectedMeal === k
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSelectedMeal(k)}
                  className={cn(
                    "relative flex flex-1 items-center justify-center gap-1.5 rounded-full px-5 py-2 text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "text-primary-foreground font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeMealPill"
                      className="absolute inset-0 rounded-full bg-brand shadow-glow"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <I className="size-4" />
                    {l}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="glass mx-auto flex max-w-md rounded-full p-1.5">
          {([["menu", "منوی غذا", Utensils], ["orders", "سفارش‌های من", ShoppingBag]] as const).map(
            ([k, l, I]) => {
              const isActive = activeTab === k
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setActiveTab(k)}
                  className={cn(
                    "relative flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-colors cursor-pointer",
                    isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      className="absolute inset-0 rounded-full bg-glass-strong shadow-sm"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <I className="size-4" />
                    {l}
                    {k === "orders" && reservations.length > 0 && (
                      <span className="rounded-full bg-brand px-1.5 text-[0.65rem] text-primary-foreground font-bold">
                        {toPersianDigits(reservations.length)}
                      </span>
                    )}
                  </span>
                </button>
              )
            }
          )}
        </div>

        {/* Tab Content with Smooth Transition */}
        <AnimatePresence mode="wait">
          {activeTab === "menu" ? (
            <motion.section
              key={`menu-${selectedMeal}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="space-y-4"
            >
            {categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 overscroll-x-contain [touch-action:pan-x] custom-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-1.5 text-sm transition cursor-pointer",
                    selectedCategory === null
                      ? "bg-brand text-primary-foreground shadow-glow"
                      : "glass text-muted-foreground hover:text-foreground"
                  )}
                >
                  همه
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c.id)}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-1.5 text-sm transition cursor-pointer",
                      selectedCategory === c.id
                        ? "bg-brand text-primary-foreground shadow-glow"
                        : "glass text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {menuItems.map((item) => {
                const hasVouchers =
                  (item.food.allowed_vouchers && item.food.allowed_vouchers.length > 0) ||
                  item.food.supports_extra_voucher
                return (
                  <article
                    key={item.id}
                    className="glass group overflow-hidden rounded-[1.75rem] p-2 transition-transform duration-200 sm:hover:-translate-y-1 [content-visibility:auto] [contain-intrinsic-size:0_320px]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[1.4rem]">
                      <FoodImage
                        src={item.food.image_url}
                        alt={item.food.name}
                        fill
                        className="size-full object-cover sm:transition-transform sm:duration-500 sm:group-hover:scale-105"
                      />
                      {item.food.category_name && (
                        <span className="absolute right-3 top-3 rounded-full bg-black/50 text-white backdrop-blur-xs px-2.5 py-1 text-xs font-medium border border-white/20 shadow-xs">
                          {item.food.category_name}
                        </span>
                      )}
                      {hasVouchers && (
                        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[0.7rem] text-primary-foreground shadow-sm">
                          <Ticket className="size-3" />
                          ژتون
                        </span>
                      )}
                      {!item.is_available && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                          <span className="rounded-full bg-destructive px-3 py-1 text-xs font-bold text-destructive-foreground">
                            ناموجود
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3">
                      <div>
                        <h3 className="font-bold">{item.food.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          <span className="font-bold text-primary">
                            {formatPersianPrice(item.food.price)}
                          </span>{" "}
                          تومان
                        </p>
                        {item.is_available && item.daily_capacity !== undefined && (
                          <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
                            ظرفیت: {toPersianDigits(item.daily_capacity)}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="brand"
                        disabled={!item.is_available}
                        onClick={() => handleOpenFood(item)}
                      >
                        رزرو
                      </Button>
                    </div>
                  </article>
                )
              })}
            </div>

            {menuItems.length === 0 && (
              <div className="glass rounded-[1.75rem] p-12 text-center col-span-full">
                <div className="mx-auto mb-4 grid size-16 place-items-center rounded-3xl bg-glass-strong text-muted-foreground">
                  <Utensils className="size-8" />
                </div>
                <h3 className="text-lg font-bold">غذایی در این بخش موجود نیست</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  لطفاً تاریخ یا وعده دیگری را انتخاب فرمایید.
                </p>
              </div>
            )}
          </motion.section>
        ) : (
          /* Tab Content: Orders */
          <motion.section
            key="orders"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="grid gap-4 md:grid-cols-2"
          >
            {[...reservations]
              .sort((a, b) => new Date(b.reserved_date).getTime() - new Date(a.reserved_date).getTime())
              .map((o) => {
                const statusInfo = STATUS[o.status] || {
                  label: o.status,
                  cls: "bg-muted text-muted-foreground",
                }
                const formattedDate = new Intl.DateTimeFormat("fa-IR", {
                  weekday: "short",
                  day: "numeric",
                  month: "long",
                }).format(new Date(o.reserved_date))
                const timeSlotText = o.time_slot
                  ? `${toPersianDigits(o.time_slot.start_time.slice(0, 5))} - ${toPersianDigits(
                      o.time_slot.end_time.slice(0, 5)
                    )}`
                  : "زمان نامشخص"

                return (
                  <article key={o.id} className="glass rounded-[1.75rem] p-4">
                    <div className="flex gap-3">
                      <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl">
                        <FoodImage
                          src={o.food.image_url}
                          alt={o.food.name}
                          fill
                          className="size-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold">{o.food.name}</h3>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold",
                              statusInfo.cls
                            )}
                          >
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formattedDate} · {o.meal_type === "dinner" ? "شام" : "ناهار"}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3.5" />
                          {timeSlotText}
                        </p>
                        {o.reservation_number && (
                          <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
                            شماره رزرو: #{toPersianDigits(o.reservation_number)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-2xl bg-glass p-3">
                      <div>
                        <div className="text-[0.7rem] text-muted-foreground">کد تحویل</div>
                        <div className="text-xl font-extrabold tracking-[0.3em] text-primary">
                          {toPersianDigits(o.delivery_code)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {formatPersianPrice(o.price)}{" "}
                          <span className="text-xs text-muted-foreground">تومان</span>
                        </span>
                        <button
                          type="button"
                          aria-label="کپی کد تحویل"
                          onClick={() => copyToClipboard(o)}
                          className="grid size-9 place-items-center rounded-full bg-glass-strong text-primary hover:opacity-80 transition cursor-pointer"
                        >
                          {copiedId === o.id ? (
                            <CheckCheck className="size-4 text-success" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {o.status === "pending_payment" && (
                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="brand"
                          className="flex-1"
                          size="sm"
                          onClick={() => handlePaymentForOrder(o)}
                        >
                          پرداخت سفارش
                          <ChevronLeft className="size-4" />
                        </Button>
                        <Button
                          variant="glass"
                          className="text-destructive hover:bg-destructive-soft"
                          size="sm"
                          onClick={() => handleCancelReservation(o.id)}
                        >
                          لغو
                        </Button>
                      </div>
                    )}

                    {o.status === "waiting" && (
                      <button
                        type="button"
                        onClick={() => handleCancelReservation(o.id)}
                        className="mt-3 w-full rounded-full py-2 text-sm text-destructive hover:bg-destructive-soft transition cursor-pointer"
                      >
                        لغو سفارش
                      </button>
                    )}
                  </article>
                )
              })}

            {reservations.length === 0 && (
              <div className="glass rounded-[1.75rem] p-12 text-center md:col-span-2">
                <div className="mx-auto mb-4 grid size-16 place-items-center rounded-3xl bg-glass-strong text-muted-foreground">
                  <ShoppingBag className="size-8" />
                </div>
                <h3 className="text-lg font-bold">هیچ سفارشی یافت نشد</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  از منوی غذا یک غذا را انتخاب و رزرو فرمایید.
                </p>
                <Button variant="brand" className="mt-4" onClick={() => setActiveTab("menu")}>
                  مشاهده منوی غذا
                </Button>
              </div>
            )}
          </motion.section>
        )}
        </AnimatePresence>
      </main>

      {/* Food Selection Sheet / Modal */}
      <Sheet open={isDialogOpen && !isPaymentDialogOpen} onClose={() => setIsDialogOpen(false)}>
        {selectedFood && (
          <div className="flex flex-col h-full max-h-[88vh] overflow-hidden">
            {/* Top Compact Image Banner */}
            <div className="relative h-32 sm:h-40 w-full shrink-0 overflow-hidden bg-muted">
              <FoodImage
                src={selectedFood.food.image_url}
                alt={selectedFood.food.name}
                fill
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/35 pointer-events-none" />

              {/* Close Button */}
              <button
                type="button"
                aria-label="بستن"
                onClick={() => setIsDialogOpen(false)}
                className="absolute left-3 top-3 grid size-8 sm:size-9 place-items-center rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-xs transition cursor-pointer text-white shadow-md z-10"
              >
                <X className="size-4" />
              </button>

              {/* Category tag */}
              {selectedFood.food.category_name && (
                <span className="absolute right-3 top-3 rounded-full bg-black/45 backdrop-blur-xs px-2.5 py-0.5 text-xs text-white border border-white/20">
                  {selectedFood.food.category_name}
                </span>
              )}

              {/* Food Title & Base Price on banner */}
              <div className="absolute bottom-2.5 right-3 left-3 flex items-center justify-between text-white">
                <h2 className="text-base sm:text-lg font-black drop-shadow-md truncate">
                  {selectedFood.food.name}
                </h2>
                <span className="font-extrabold text-xs sm:text-sm text-white drop-shadow-md shrink-0 bg-black/45 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/20">
                  قیمت پایه: {formatPersianPrice(selectedFood.food.price)} تومان
                </span>
              </div>
            </div>

            {/* Scrollable Middle Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-5 space-y-4 custom-scrollbar">
              {/* Time Slots */}
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs sm:text-sm font-bold text-foreground">
                  <Clock className="size-3.5 sm:size-4 text-primary" />
                  زمان تحویل
                </h4>
                {selectedFood.time_slots && selectedFood.time_slots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2" dir="ltr">
                    {[...selectedFood.time_slots]
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          disabled={s.capacity !== undefined && s.capacity <= 0}
                          onClick={() => setSelectedTimeSlot(s.id)}
                          className={cn(
                            "rounded-2xl border p-2.5 sm:p-3 text-center text-xs sm:text-sm transition disabled:opacity-40 cursor-pointer",
                            selectedTimeSlot === s.id
                              ? "border-primary bg-primary/15 text-primary font-bold shadow-xs"
                              : "border-glass-border bg-glass hover:bg-glass-strong text-foreground"
                          )}
                        >
                          <div className="font-semibold" dir="ltr">
                            {toPersianDigits(s.start_time.slice(0, 5))} - {toPersianDigits(s.end_time.slice(0, 5))}
                          </div>
                          <div className="text-[0.68rem] text-muted-foreground mt-0.5">
                            {s.capacity !== undefined
                              ? s.capacity > 0
                                ? `${toPersianDigits(s.capacity)} ظرفیت`
                                : "تکمیل"
                              : ""}
                          </div>
                        </button>
                      ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/10 p-2.5 text-center text-xs text-amber-700 dark:text-amber-300">
                    در حال حاضر بازه زمانی تحویل برای این غذا ثبت نشده است.
                  </div>
                )}
              </div>

              {/* Voucher Selection */}
              {((selectedFood.food.allowed_vouchers && selectedFood.food.allowed_vouchers.length > 0) || voucherTypes.length > 0) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-foreground">
                      <Ticket className="size-3.5 sm:size-4 text-primary" />
                      <span>انتخاب فیش / ژتون</span>
                    </h4>
                    <span className="text-[0.65rem] sm:text-[0.7rem] text-muted-foreground">
                      (اسکرول برای مشاهده گزینه‌ها)
                    </span>
                  </div>

                  {userProfile?.trust_score !== undefined && userProfile.trust_score < 0 && (
                    <div className="rounded-2xl bg-destructive-soft border border-destructive/20 p-2 text-xs text-destructive text-center">
                      به دلیل امتیاز اعتبار منفی، امکان استفاده از ژتون وجود ندارد
                    </div>
                  )}

                  {/* Internal Scrollable Container for Voucher Options */}
                  <div className="flex flex-col gap-2 w-full max-h-36 sm:max-h-44 overflow-y-auto pr-1 overscroll-contain custom-scrollbar">
                    {/* Option: No Voucher */}
                    <button
                      type="button"
                      onClick={() => setSelectedVoucherId(null)}
                      className={cn(
                        "w-full rounded-2xl p-2.5 sm:p-3 flex items-center justify-between transition-all cursor-pointer border text-right",
                        selectedVoucherId === null
                          ? "border-primary bg-primary/10 shadow-xs"
                          : "border-glass-border bg-glass/60 hover:bg-glass-strong"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            "size-4 sm:size-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                            selectedVoucherId === null
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/40 bg-transparent"
                          )}
                        >
                          {selectedVoucherId === null && (
                            <div className="size-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-foreground">
                            بدون ژتون
                          </div>
                          <div className="text-[0.65rem] text-muted-foreground">
                            پرداخت کامل مبلغ غذا (قیمت آزاد)
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <span className="rounded-full bg-glass px-2 py-0.5 text-[0.68rem] font-medium text-muted-foreground border border-glass-border">
                          قیمت پایه
                        </span>
                      </div>
                    </button>

                    {/* Voucher Options */}
                    {voucherTypes.map((vt) => {
                      const isAllowed = selectedFood.food.allowed_vouchers?.some(
                        (v) => v.id === vt.id
                      )
                      const isTrustBlocked =
                        userProfile?.trust_score !== undefined && userProfile.trust_score < 0
                      const isDisabled = !isAllowed || isTrustBlocked
                      const isSelected = selectedVoucherId === vt.id

                      return (
                        <button
                          key={vt.id}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setSelectedVoucherId(vt.id)}
                          className={cn(
                            "w-full rounded-2xl p-2.5 sm:p-3 flex items-center justify-between transition-all border text-right",
                            isDisabled
                              ? "opacity-45 cursor-not-allowed border-dashed border-glass-border bg-glass/30"
                              : isSelected
                              ? "border-primary bg-primary/10 shadow-xs cursor-pointer"
                              : "border-glass-border bg-glass/60 hover:bg-glass-strong cursor-pointer"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={cn(
                                "size-4 sm:size-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                                isSelected
                                  ? "border-primary bg-primary"
                                  : "border-muted-foreground/40 bg-transparent"
                              )}
                            >
                              {isSelected && (
                                <div className="size-1.5 rounded-full bg-white" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs sm:text-sm text-foreground truncate">
                                {vt.name}
                              </div>
                              <div className="text-[0.65rem] text-muted-foreground truncate">
                                {isDisabled
                                  ? "غیرقابل استفاده برای این غذا"
                                  : "کسر از مبلغ نهایی سفارش"}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {vt.discount_amount ? (
                              <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[0.68rem] font-bold">
                                {formatPersianPrice(vt.discount_amount)}− تومان
                              </span>
                            ) : (
                              <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[0.68rem] font-bold">
                                رایگان
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky / Fixed Bottom Footer (Always Visible Without Scrolling!) */}
            <div className="shrink-0 border-t border-glass-border bg-white/95 dark:bg-card/95 backdrop-blur-md px-4 py-3 sm:px-5 sm:py-3.5 shadow-lg">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[0.68rem] text-muted-foreground font-medium">مبلغ نهایی قابل پرداخت</div>
                  <div className="text-lg sm:text-xl font-black text-primary">
                    {formatPersianPrice(calculateTotalPrice())}{" "}
                    <span className="text-xs font-normal text-muted-foreground">تومان</span>
                  </div>
                </div>

                <Button
                  variant="brand"
                  disabled={!selectedTimeSlot}
                  onClick={handleConfirmSelection}
                  className="h-11 px-5 sm:px-6 rounded-xl text-sm font-bold shadow-glow cursor-pointer shrink-0 gap-1.5 disabled:opacity-50"
                >
                  <span>ادامه پرداخت</span>
                  <ChevronLeft className="size-4" />
                </Button>
              </div>
              {!selectedTimeSlot && (
                <p className="text-[0.68rem] text-amber-600 dark:text-amber-400 mt-1.5 text-center font-medium">
                  لطفاً برای ادامه، یکی از بازه‌های زمانی تحویل بالا را انتخاب کنید
                </p>
              )}
            </div>
          </div>
        )}
      </Sheet>

      {/* Payment Confirmation Sheet / Modal */}
      <Sheet open={isPaymentDialogOpen} onClose={() => setIsPaymentDialogOpen(false)}>
        <div className="space-y-5 p-6 text-center overflow-y-auto custom-scrollbar">
          <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-brand text-primary-foreground shadow-glow">
            <CreditCard className="size-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-foreground">تأیید و پرداخت</h2>
            <p className="mt-1 text-sm text-muted-foreground">{selectedFood?.food.name}</p>
          </div>

          <div className="rounded-2xl bg-glass p-4 text-sm space-y-2.5 border border-glass-border text-foreground">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>قیمت پایه غذا:</span>
              <span>{formatPersianPrice(selectedFood?.food.price ?? 0)} تومان</span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>نوع ژتون:</span>
              <span className="font-medium text-foreground">
                {selectedVoucher ? selectedVoucher.name : "بدون ژتون (پرداخت نقدی)"}
              </span>
            </div>
            {voucherDiscount > 0 && (
              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-medium">
                <span>تخفیف ژتون:</span>
                <span>−{formatPersianPrice(voucherDiscount)} تومان</span>
              </div>
            )}
            <div className="border-t border-glass-border pt-3 flex justify-between items-center font-bold text-base">
              <span>مبلغ قابل پرداخت:</span>
              <span className="text-primary font-black">{formatPersianPrice(calculateTotalPrice())} تومان</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-glass-border">
            <Button
              variant="brand"
              className="flex-[2] gap-1 h-11 rounded-xl text-sm font-bold shadow-md cursor-pointer"
              disabled={isPaymentProcessing}
              onClick={handlePayment}
            >
              {isPaymentProcessing ? (
                "در حال پردازش..."
              ) : (
                <>
                  <ChevronRight className="size-4" />
                  <span>پرداخت و ثبت سفارش</span>
                </>
              )}
            </Button>
            <Button
              variant="glass"
              className="flex-1 gap-1 h-11 rounded-xl text-sm cursor-pointer"
              onClick={() => {
                setIsPaymentDialogOpen(false)
                setIsDialogOpen(true)
              }}
            >
              <span>بازگشت</span>
              <ChevronLeft className="size-4" />
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  )
}
