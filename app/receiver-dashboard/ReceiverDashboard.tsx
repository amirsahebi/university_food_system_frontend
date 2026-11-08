"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  Loader2,
  CheckCircle,
  Package,
  User,
  LogOut,
  Calendar,
  Clock,
  Utensils,
  X,
  Sun,
  Moon,
  AlertTriangle,
  Printer,
  Eye,
  Copy,
  CheckCheck,
  Search,
  Sparkles,
  Smartphone,
} from "lucide-react"
import { toast, Toaster } from "react-hot-toast"
import DatePicker, { DateObject } from "react-multi-date-picker"
import persian from "react-date-object/calendars/persian"
import persian_fa from "react-date-object/locales/persian_fa"

import api from "@/lib/axios"
import { toPersianDigits, formatPersianPrice, normalizeForSearch } from "@/lib/formatters"
import { API_ROUTES, createApiUrl } from "@/lib/api"

interface Reservation {
  id: number
  student: {
    id: number
    first_name: string
    last_name: string
    phone_number: string
  }
  food: {
    id: number
    name: string
    decsription?: string
    price: string | number
    category_name?: string
  }
  time_slot: {
    id: number
    start_time: string
    end_time: string
    capacity: number
  }
  reserved_date: string
  has_voucher: boolean
  meal_type: "lunch" | "dinner"
  price: string | number
  status: "waiting" | "preparing" | "ready_to_pickup" | "picked_up" | "not_picked_up"
  qr_code: string
  delivery_code: string
  reservation_number: string
  created_at: string
  updated_at: string | null
}

interface AppUser {
  first_name: string
  last_name: string
  phone_number: string
}

const getIranCurrentHour = () => {
  const iranTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Tehran" })
  return new Date(iranTime).getHours()
}

export default function ReceiverDashboard() {
  const router = useRouter()
  const { logout } = useAuth()
  const [user] = useState<AppUser>({
    first_name: "تحویل‌دهنده",
    last_name: "receiver",
    phone_number: "09123456789",
  })
  const [deliveryCode, setDeliveryCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [currentReservation, setCurrentReservation] = useState<Reservation | null>(null)
  const [isReservationDialogOpen, setIsReservationDialogOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("waiting")

  // Orders by status
  const [waitingOrders, setWaitingOrders] = useState<Reservation[]>([])
  const [preparingOrders, setPreparingOrders] = useState<Reservation[]>([])
  const [readyToPickupOrders, setReadyToPickupOrders] = useState<Reservation[]>([])
  const [pickedUpOrders, setPickedUpOrders] = useState<Reservation[]>([])
  const [notPickedUpOrders, setNotPickedUpOrders] = useState<Reservation[]>([])

  const currentHour = getIranCurrentHour()
  const defaultMeal = currentHour < 17 ? "lunch" : "dinner"

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedMeal, setSelectedMeal] = useState<"lunch" | "dinner">(defaultMeal)

  // Search filter
  const filterReservationsBySearch = useCallback(
    (reservations: Reservation[]) => {
      if (!searchTerm.trim()) return reservations
      const q = normalizeForSearch(searchTerm)
      return reservations.filter((reservation) =>
        normalizeForSearch(reservation.reservation_number).includes(q) ||
        normalizeForSearch(reservation.student.first_name).includes(q) ||
        normalizeForSearch(reservation.student.last_name).includes(q) ||
        normalizeForSearch(reservation.food.name).includes(q)
      )
    },
    [searchTerm]
  )

  const fetchAllOrders = useCallback(async () => {
    try {
      const formattedDate = new DateObject(selectedDate).format("YYYY-MM-DD")
      const chefResponse = await api.get(createApiUrl(API_ROUTES.GET_RECEIVER_ORDERS), {
        params: { reserved_date: formattedDate, meal_type: selectedMeal },
      })

      const allOrders = chefResponse.data.sort((a: Reservation, b: Reservation) => {
        if (!a.time_slot || !b.time_slot || !a.time_slot.start_time || !b.time_slot.start_time) {
          return 0
        }
        const startTimeA = new Date(`1970-01-01T${a.time_slot.start_time}`).getTime()
        const startTimeB = new Date(`1970-01-01T${b.time_slot.start_time}`).getTime()
        if (startTimeA !== startTimeB) return startTimeA - startTimeB
        const reservationNumberA = String(a.reservation_number || "")
        const reservationNumberB = String(b.reservation_number || "")
        return reservationNumberA.localeCompare(reservationNumberB)
      })

      setWaitingOrders(allOrders.filter((order: Reservation) => order.status === "waiting"))
      setPreparingOrders(allOrders.filter((order: Reservation) => order.status === "preparing"))
      setReadyToPickupOrders(allOrders.filter((order: Reservation) => order.status === "ready_to_pickup"))
      setPickedUpOrders(allOrders.filter((order: Reservation) => order.status === "picked_up"))
      setNotPickedUpOrders(allOrders.filter((order: Reservation) => order.status === "not_picked_up"))
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast.error("خطا در دریافت سفارش‌ها")
    }
  }, [selectedDate, selectedMeal])

  useEffect(() => {
    fetchAllOrders()
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchAllOrders()
      }
    }, 15000)
    return () => clearInterval(interval)
  }, [fetchAllOrders])

  const handleUpdateStatus = async (
    reservationId: number,
    newStatus: "waiting" | "preparing" | "ready_to_pickup" | "picked_up" | "not_picked_up"
  ) => {
    try {
      await api.patch(createApiUrl(API_ROUTES.UPDATE_ORDER_STATUS(String(reservationId))), { status: newStatus })

      const updatedOrder = {
        ...(waitingOrders.find((o) => o.id === reservationId) ||
          preparingOrders.find((o) => o.id === reservationId) ||
          readyToPickupOrders.find((o) => o.id === reservationId) ||
          pickedUpOrders.find((o) => o.id === reservationId) ||
          notPickedUpOrders.find((o) => o.id === reservationId)),
        status: newStatus,
      } as Reservation

      if (newStatus === "preparing") {
        setWaitingOrders((prev) => prev.filter((order) => order.id !== reservationId))
        setPreparingOrders((prev) => [...prev, updatedOrder])
      } else if (newStatus === "ready_to_pickup") {
        setPreparingOrders((prev) => prev.filter((order) => order.id !== reservationId))
        setReadyToPickupOrders((prev) => [...prev, updatedOrder])
      } else if (newStatus === "picked_up") {
        setReadyToPickupOrders((prev) => prev.filter((order) => order.id !== reservationId))
        setPickedUpOrders((prev) => [...prev, updatedOrder])
      } else if (newStatus === "not_picked_up") {
        setReadyToPickupOrders((prev) => prev.filter((order) => order.id !== reservationId))
        setNotPickedUpOrders((prev) => [...prev, updatedOrder])
      }

      toast.success(`وضعیت رزرو ${updatedOrder.reservation_number} به ${getStatusTitle(newStatus)} تغییر کرد`)
    } catch (error) {
      console.error("Error updating reservation status:", error)
      toast.error("خطا در به‌روزرسانی وضعیت رزرو")
    }
  }

  const verifyDeliveryCode = useCallback(async () => {
    if (!deliveryCode || deliveryCode.trim() === "") {
      toast.error("لطفا کد تحویل را وارد کنید")
      return
    }

    setIsVerifying(true)
    try {
      const formattedDate = new DateObject(selectedDate).format("YYYY-MM-DD")
      const response = await api.post(createApiUrl(API_ROUTES.VERIFY_DELIVERY_CODE), {
        delivery_code: deliveryCode.trim(),
        meal_type: selectedMeal,
        date: formattedDate,
      })
      setCurrentReservation(response.data)
      toast.success("کد تحویل با موفقیت تایید شد")
      setIsReservationDialogOpen(true)
    } catch (error) {
      console.error("Error verifying delivery code:", error)
      toast.error("کد تحویل نامعتبر است. لطفاً دوباره تلاش کنید")
    } finally {
      setIsVerifying(false)
      setDeliveryCode("")
    }
  }, [deliveryCode, selectedDate, selectedMeal])

  const handleDeliverOrder = async (status: "picked_up" | "not_picked_up" = "picked_up", orderData?: Reservation) => {
    const order = orderData || currentReservation
    if (!order) return

    try {
      let response
      if (status === "picked_up") {
        response = await api.patch(createApiUrl(API_ROUTES.DELIVER_ORDER(order.id.toString())))
      } else {
        response = await api.patch(createApiUrl(API_ROUTES.NOT_PICKED_UP_ORDER(order.id.toString())))
      }

      const updatedOrder = response.data || response || order
      setReadyToPickupOrders((prev) => prev.filter((o) => o.id !== order.id))

      if (status === "picked_up") {
        setPickedUpOrders((prev) => {
          const exists = prev.some((o) => o.id === updatedOrder.id)
          return exists ? prev : [...prev, updatedOrder]
        })
        toast.success(`سفارش ${toPersianDigits(order.reservation_number)} با موفقیت تحویل داده شد`)
      } else {
        setNotPickedUpOrders((prev) => {
          const exists = prev.some((o) => o.id === updatedOrder.id)
          return exists ? prev : [...prev, updatedOrder]
        })
        toast.success(`سفارش ${toPersianDigits(order.reservation_number)} به عنوان تحویل گرفته نشده ثبت شد`)
      }

      if (!orderData) {
        setCurrentReservation(null)
        setIsReservationDialogOpen(false)
      }
    } catch (error) {
      console.error("Error delivering order:", error)
      toast.error("خطا در ثبت وضعیت تحویل سفارش")
    }
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

  const printReservationSlip = useCallback((order: Reservation) => {
    const printWindow = window.open("", "_blank", "width=600,height=800")
    if (!printWindow) {
      toast.error("خطا در باز کردن پنجره چاپ")
      return
    }

    const slipHtml = `
      <html>
        <head>
          <title>رسید تحویل غذا - سلف جوان</title>
          <style>
            body { 
              font-family: Tahoma, Arial, sans-serif; 
              direction: rtl; 
              text-align: right; 
              width: 220px; 
              margin: 10px auto; 
              padding: 5px; 
              font-size: 11px;
            }
            .header { text-align: center; border-bottom: 2px dashed #F47B20; padding-bottom: 8px; margin-bottom: 10px; }
            .header h2 { margin: 0; color: #F47B20; font-size: 16px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 6px; }
            .code-box { 
              border: 2px solid #000; 
              text-align: center; 
              font-size: 18px; 
              font-weight: bold; 
              letter-spacing: 4px; 
              padding: 8px; 
              margin: 12px 0; 
              background: #f9f9f9;
            }
            .footer { text-align: center; font-size: 10px; color: #777; margin-top: 12px; border-top: 1px dotted #ccc; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>رستوران جوان</h2>
            <p>رسید تحویل غذای سلف دانشجویی</p>
          </div>
          <div class="row"><span>شماره رزرو:</span><strong>${toPersianDigits(order.reservation_number)}#</strong></div>
          <div class="row"><span>دانشجو:</span><strong>${order.student.first_name} ${order.student.last_name}</strong></div>
          <div class="row"><span>غذا:</span><strong>${order.food.name}</strong></div>
          <div class="row"><span>تاریخ:</span><strong>${toPersianDigits(new Intl.DateTimeFormat("fa-IR").format(new Date(order.reserved_date)))}</strong></div>
          <div class="row"><span>ساعت توزیع:</span><strong>${order.time_slot ? toPersianDigits(order.time_slot.start_time.slice(0, 5)) + ' الی ' + toPersianDigits(order.time_slot.end_time.slice(0, 5)) : ''}</strong></div>
          <div class="row"><span>مبلغ:</span><strong>${formatPersianPrice(order.price)} تومان</strong></div>
          <div class="code-box">${toPersianDigits(order.delivery_code || order.id.toString().padStart(6, "0"))}</div>
          <div class="footer">از همراهی شما سپاسگزاریم</div>
        </body>
      </html>
    `
    printWindow.document.write(slipHtml)
    printWindow.document.close()
    printWindow.print()
  }, [])

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      waiting: "bg-amber-100 text-amber-800 border-amber-200",
      preparing: "bg-sky-100 text-sky-800 border-sky-200",
      ready_to_pickup: "bg-orange-100 text-orange-800 border-orange-200",
      picked_up: "bg-emerald-100 text-emerald-800 border-emerald-200",
      not_picked_up: "bg-rose-100 text-rose-800 border-rose-200",
      pending_payment: "bg-purple-100 text-purple-800 border-purple-200",
      cancelled: "bg-gray-100 text-gray-800 border-gray-200",
    }
    return colorMap[status] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getStatusTitle = (status: string) => {
    const statusMap: Record<string, string> = {
      waiting: "در انتظار تایید",
      preparing: "در حال آماده‌سازی",
      ready_to_pickup: "آماده تحویل در سلف",
      picked_up: "تحویل داده شده",
      not_picked_up: "عدم تحویل / غایب",
      pending_payment: "در انتظار پرداخت",
      cancelled: "لغو شده",
    }
    return statusMap[status] || status
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setIsCopied(true)
    toast.success("کد تحویل کپی شد")
    setTimeout(() => setIsCopied(false), 2000)
  }

  // Format today jalali string for header badge
  const todayJalali = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date())

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-rose-50/40 relative text-gray-900 pb-16 selection:bg-orange-500/20"
      dir="rtl"
    >
      <Toaster position="top-center" />

      {/* Ambient background glow spheres (Glassmorphism layer) */}
      <div className="fixed top-[-10%] right-[-5%] w-[480px] h-[480px] rounded-full bg-gradient-to-br from-orange-400/15 via-amber-300/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-[35%] left-[-10%] w-[420px] h-[420px] rounded-full bg-gradient-to-tr from-rose-400/10 via-amber-200/15 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* 1. Ultra-Refined Frosted Glass Navbar */}
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-4 sticky top-0 z-40">
        <header className="backdrop-blur-2xl bg-white/75 border border-white/80 rounded-3xl shadow-sm px-4 sm:px-6 py-3 flex items-center justify-between transition-all">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-11 w-11 rounded-2xl bg-gradient-to-tr from-orange-500/15 to-amber-400/20 p-2 border border-orange-200/60 shadow-2xs group-hover:scale-105 transition-transform duration-300">
                <Image src="/images/javanfoods_logo.png" alt="رستوران جوان" fill className="object-contain p-1.5" priority />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-black tracking-tight text-gray-900 group-hover:text-[#F47B20] transition-colors">
                    رستوران جوان
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100/80 text-orange-700 border border-orange-200/50">
                    پنل تحویل‌دهنده
                  </span>
                </div>
                <span className="text-[11px] text-gray-500 font-medium">
                  مدیریت آماده‌سازی و تحویل سفارشات سلف
                </span>
              </div>
            </Link>
          </div>

          {/* Center Date Badge */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl backdrop-blur-md bg-white/60 border border-white/80 text-xs font-semibold text-gray-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-[#F47B20]" />
            <span>{todayJalali}</span>
          </div>

          {/* Left Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-10 px-3 rounded-2xl border border-gray-200/60 bg-white/60 hover:bg-white hover:border-orange-200 text-xs font-semibold text-gray-700 transition-all flex items-center gap-2"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-orange-100 text-orange-700 text-xs font-bold">
                      {user.first_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">{user.first_name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 rounded-2xl p-1.5 backdrop-blur-xl bg-white/95 border border-orange-100 shadow-lg text-xs" align="start">
                <DropdownMenuItem className="rounded-xl flex items-center gap-2 py-2 cursor-pointer">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>پروفایل کاربری</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => window.dispatchEvent(new CustomEvent("open-whats-new"))}
                  className="rounded-xl flex items-center gap-2 py-2 cursor-pointer text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                >
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>امکانات و تغییرات جدید</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => window.dispatchEvent(new CustomEvent("open-pwa-install"))}
                  className="rounded-xl flex items-center gap-2 py-2 cursor-pointer text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                >
                  <Smartphone className="h-4 w-4 text-orange-500" />
                  <span>نصب نسخه اپلیکیشن (PWA)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="rounded-xl flex items-center gap-2 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer">
                  <LogOut className="h-4 w-4" />
                  <span>خروج از حساب</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
      </div>

      <main className="max-w-6xl mx-auto px-3.5 sm:px-6 mt-6 space-y-6">
        {/* 2. Glass Live Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {[
            { title: "در انتظار تایید", count: waitingOrders.length, icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50/70 border-amber-200/60" },
            { title: "در حال پخت", count: preparingOrders.length, icon: Clock, color: "text-sky-500", bg: "bg-sky-50/70 border-sky-200/60" },
            { title: "آماده تحویل", count: readyToPickupOrders.length, icon: Package, color: "text-[#F47B20]", bg: "bg-orange-50/70 border-orange-200/60" },
            { title: "تحویل داده شده", count: pickedUpOrders.length, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50/70 border-emerald-200/60" },
            { title: "غایب / تحویل‌نشده", count: notPickedUpOrders.length, icon: X, color: "text-rose-500", bg: "bg-rose-50/70 border-rose-200/60" },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`backdrop-blur-xl bg-white/75 border border-white/80 p-4 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-bold text-gray-600">{item.title}</span>
                <div className={`p-1.5 rounded-xl ${item.bg}`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
              </div>
              <div className="text-2xl font-black text-gray-900 font-mono tracking-tight pt-1">
                {toPersianDigits(item.count)}
              </div>
            </div>
          ))}
        </div>

        {/* 3. Action Terminal: Delivery Code Verification + Date/Meal Switcher */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Box 1: Quick Code Verification */}
          <div className="backdrop-blur-xl bg-white/80 border border-white/90 p-5 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-orange-100/60">
              <div className="p-2 rounded-xl bg-orange-50 text-[#F47B20] border border-orange-200/50">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">تایید کد ۶ رقمی تحویل غذا</h3>
                <p className="text-[11px] text-gray-500">کد اعلامی توسط دانشجو را وارد کنید</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="مثال: ۰۰۰۱۴۰"
                value={deliveryCode}
                onChange={(e) => setDeliveryCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verifyDeliveryCode()}
                className="rounded-2xl border-orange-100/90 bg-white/80 text-center font-mono text-base tracking-widest placeholder:tracking-normal placeholder:font-sans placeholder:text-xs form-input-focus h-11"
              />
              <Button
                onClick={verifyDeliveryCode}
                disabled={isVerifying || !deliveryCode}
                className="bg-gradient-to-r from-[#F47B20] to-[#E06A10] hover:from-[#E06A10] hover:to-[#D05A00] text-white rounded-2xl font-bold text-xs h-11 px-5 shadow-md shadow-orange-500/20 active:scale-95 transition-all shrink-0"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="ml-1.5 h-4 w-4 animate-spin" />
                    <span>بررسی...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="ml-1.5 h-4 w-4" />
                    <span>تایید کد</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Box 2: Date & Meal Selector */}
          <div className="backdrop-blur-xl bg-white/80 border border-white/90 p-5 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-orange-100/60">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/50">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">تنظیم تاریخ و وعده غذایی</h3>
                <p className="text-[11px] text-gray-500">فهرست سفارشات بر اساس روز و وعده</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <DatePicker
                  value={selectedDate}
                  onChange={(date) => {
                    if (date instanceof DateObject) {
                      setSelectedDate(date.toDate())
                    }
                  }}
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  inputClass="w-full h-11 px-3.5 py-2 rounded-2xl bg-white/80 text-xs font-semibold text-gray-800 border border-orange-100/90 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#F47B20]"
                  containerClassName="w-full"
                />
              </div>

              {/* Meal Toggle */}
              <div className="flex rounded-2xl p-1 bg-orange-50/70 border border-orange-100/80 h-11">
                <button
                  type="button"
                  onClick={() => setSelectedMeal("lunch")}
                  className={`flex-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    selectedMeal === "lunch"
                      ? "bg-gradient-to-r from-[#F47B20] to-[#E06A10] text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>ناهار</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMeal("dinner")}
                  className={`flex-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    selectedMeal === "dinner"
                      ? "bg-gradient-to-r from-[#F47B20] to-[#E06A10] text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>شام</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Search Filter */}
        <div className="backdrop-blur-md bg-white/70 border border-white/80 p-3 rounded-2xl shadow-2xs flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="جستجو با شماره رزرو، نام دانشجو یا نام غذا..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 rounded-xl border-orange-100 bg-white/80 form-input-focus text-xs h-10"
            />
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 5. Main Frosted Glass Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
          <div className="flex justify-center">
            <TabsList className="backdrop-blur-xl bg-white/75 border border-white/80 p-1.5 h-12 rounded-3xl shadow-sm flex items-center gap-1 w-full max-w-2xl overflow-x-auto">
              {[
                { id: "waiting", label: "در انتظار", count: waitingOrders.length, icon: AlertTriangle },
                { id: "preparing", label: "در حال پخت", count: preparingOrders.length, icon: Clock },
                { id: "ready_to_pickup", label: "آماده تحویل", count: readyToPickupOrders.length, icon: Package },
                { id: "picked_up", label: "تحویل داده شده", count: pickedUpOrders.length, icon: CheckCircle },
                { id: "not_picked_up", label: "غایب", count: notPickedUpOrders.length, icon: X },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-1 h-9 rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F47B20] data-[state=active]:to-[#E06A10] data-[state=active]:text-white data-[state=active]:shadow-md font-bold text-xs text-gray-700 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap px-2"
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 data-[state=inactive]:bg-orange-100 data-[state=inactive]:text-orange-700 font-mono font-bold">
                      {toPersianDigits(tab.count)}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Orders Lists Helper */}
          {["waiting", "preparing", "ready_to_pickup", "picked_up", "not_picked_up"].map((statusKey) => {
            const ordersMap: Record<string, Reservation[]> = {
              waiting: waitingOrders,
              preparing: preparingOrders,
              ready_to_pickup: readyToPickupOrders,
              picked_up: pickedUpOrders,
              not_picked_up: notPickedUpOrders,
            }
            const currentList = filterReservationsBySearch(ordersMap[statusKey] || [])

            return (
              <TabsContent key={statusKey} value={statusKey} className="space-y-4 focus-visible:outline-none">
                {currentList.length === 0 ? (
                  <div className="py-16 text-center rounded-3xl backdrop-blur-xl bg-white/70 border border-white/80 shadow-sm space-y-2">
                    <Package className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="text-xs text-gray-500">هیچ سفارشی در این وضعیت موجود نیست</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentList.map((order) => (
                      <div
                        key={order.reservation_number}
                        className="backdrop-blur-xl bg-white/85 border border-white/90 rounded-3xl shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
                      >
                        {/* Header: Reservation Number & Status */}
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500">شماره رزرو:</span>
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-orange-50 text-gray-900 border border-orange-100" dir="ltr">
                              #{toPersianDigits(order.reservation_number)}
                            </span>
                          </div>
                          <Badge variant="outline" className={`text-[10px] font-bold ${getStatusColor(order.status)}`}>
                            {getStatusTitle(order.status)}
                          </Badge>
                        </div>

                        {/* Body Details */}
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between items-center text-gray-700">
                            <span className="text-gray-500 font-medium">نام دانشجو:</span>
                            <span className="font-bold text-gray-900">{order.student.first_name} {order.student.last_name}</span>
                          </div>
                          <div className="flex justify-between items-center text-gray-700">
                            <span className="text-gray-500 font-medium">خوراک درخواستی:</span>
                            <span className="font-bold text-gray-900">{order.food.name}</span>
                          </div>
                          <div className="flex justify-between items-center text-gray-700">
                            <span className="text-gray-500 font-medium">ساعت تحویل:</span>
                            <span className="font-mono text-gray-800">
                              {order.time_slot ? toPersianDigits(order.time_slot.start_time.slice(0, 5)) + " الی " + toPersianDigits(order.time_slot.end_time.slice(0, 5)) : "تعریف نشده"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-gray-700">
                            <span className="text-gray-500 font-medium">مبلغ پرداختی:</span>
                            <span className="font-bold font-mono text-gray-900">
                              {formatPersianPrice(order.price)} <span className="text-[10px] text-gray-500 font-normal">تومان</span>
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCurrentReservation(order)
                                setIsReservationDialogOpen(true)
                              }}
                              className="rounded-xl h-9 text-xs text-gray-700 hover:bg-orange-50 border-gray-200 gap-1"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#F47B20]" />
                              <span>جزئیات</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => printReservationSlip(order)}
                              className="rounded-xl h-9 text-xs text-gray-700 hover:bg-gray-100 border-gray-200 gap-1"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>چاپ</span>
                            </Button>
                          </div>

                          {/* Status Progression CTAs */}
                          {order.status === "waiting" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                handleUpdateStatus(order.id, "preparing")
                                printReservationSlip(order)
                              }}
                              className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl h-9 text-xs font-bold gap-1 shadow-xs"
                            >
                              <Utensils className="w-3.5 h-3.5" />
                              <span>شروع پخت</span>
                            </Button>
                          )}
                          {order.status === "preparing" && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(order.id, "ready_to_pickup")}
                              className="bg-gradient-to-r from-[#F47B20] to-[#E06A10] hover:from-[#E06A10] hover:to-[#D05A00] text-white rounded-xl h-9 text-xs font-bold gap-1 shadow-xs"
                            >
                              <Package className="w-3.5 h-3.5" />
                              <span>آماده تحویل</span>
                            </Button>
                          )}
                          {order.status === "ready_to_pickup" && (
                            <div className="flex items-center gap-1.5">
                              <Button
                                size="sm"
                                onClick={() => handleDeliverOrder("picked_up", order)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 text-xs font-bold gap-1 shadow-xs"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>تحویل غذا</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeliverOrder("not_picked_up", order)}
                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl h-9 text-xs font-bold gap-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>غایب</span>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </main>

      {/* 6. Reservation Details Radix Modal */}
      <Dialog open={isReservationDialogOpen} onOpenChange={setIsReservationDialogOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden backdrop-blur-2xl bg-white/95 border border-orange-100 shadow-2xl rounded-3xl" dir="rtl">
          {currentReservation && (
            <div className="flex flex-col">
              <div className="p-5 pb-4 border-b border-orange-100/80 bg-white/80 flex items-center justify-between">
                <div>
                  <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#F47B20]" />
                    <span>سفارش شماره {toPersianDigits(currentReservation.reservation_number)}#</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-500 mt-0.5">
                    مشخصات و اقلام تحویل سفارش سلف
                  </DialogDescription>
                </div>
                <Badge variant="outline" className={`text-[10px] font-bold ${getStatusColor(currentReservation.status)}`}>
                  {getStatusTitle(currentReservation.status)}
                </Badge>
              </div>

              <div className="p-5 space-y-3.5 text-xs">
                {/* 6-Digit Code Display */}
                <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-gray-500 block">کد ۶ رقمی تحویل غذا:</span>
                    <span className="font-mono text-2xl font-black text-gray-900 tracking-widest" dir="ltr">
                      {toPersianDigits(currentReservation.delivery_code || currentReservation.id.toString().padStart(6, "0"))}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(currentReservation.delivery_code || currentReservation.id.toString().padStart(6, "0"))}
                    className="h-9 w-9 rounded-xl hover:bg-orange-100 text-orange-700"
                  >
                    {isCopied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-gray-500 font-medium">نام دانشجو:</span>
                    <span className="font-bold text-gray-900">{currentReservation.student.first_name} {currentReservation.student.last_name}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-gray-500 font-medium">شماره تماس:</span>
                    <span className="font-mono text-gray-900" dir="ltr">{toPersianDigits(currentReservation.student.phone_number)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-gray-500 font-medium">خوراک:</span>
                    <span className="font-bold text-gray-900">{currentReservation.food.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-gray-500 font-medium">تاریخ و وعده:</span>
                    <span className="text-gray-900">
                      {toPersianDigits(new Intl.DateTimeFormat("fa-IR").format(new Date(currentReservation.reserved_date)))} • {currentReservation.meal_type === "dinner" ? "شام" : "ناهار"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-gray-500 font-medium">ساعت تحویل در سلف:</span>
                    <span className="font-mono text-gray-900">
                      {currentReservation.time_slot ? toPersianDigits(currentReservation.time_slot.start_time.slice(0, 5)) + " الی " + toPersianDigits(currentReservation.time_slot.end_time.slice(0, 5)) : "تعریف نشده"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-gray-500 font-medium">استفاده از سهمیه ژتون:</span>
                    <span className="font-bold text-gray-900">{currentReservation.has_voucher ? "بله (با اعمال تخفیف ژتون)" : "خیر (پرداخت آزاد)"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500 font-medium">مبلغ نهایی:</span>
                    <span className="font-bold font-mono text-sm text-gray-900">
                      {formatPersianPrice(currentReservation.price)} <span className="text-xs text-gray-500 font-normal">تومان</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 border-t border-orange-100/80 bg-gray-50/60 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsReservationDialogOpen(false)}
                  className="rounded-2xl border-gray-200 text-gray-700 hover:bg-gray-100 text-xs h-10 px-4"
                >
                  بستن
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => printReservationSlip(currentReservation)}
                    className="rounded-2xl border-gray-200 text-gray-700 hover:bg-gray-100 text-xs h-10 px-4 gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>چاپ فیش</span>
                  </Button>

                  {currentReservation.status === "ready_to_pickup" && (
                    <Button
                      onClick={() => handleDeliverOrder("picked_up")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold h-10 px-5 gap-1.5 shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>ثبت تحویل غذا</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
