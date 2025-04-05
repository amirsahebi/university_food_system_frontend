"use client"

import React, { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Utensils, Clock, User, LogOut, AlertCircle, X, ChevronLeft, ChevronRight, CreditCard } from "lucide-react"
import { toast, Toaster } from "react-hot-toast"
import DatePicker from "react-multi-date-picker"
import persian from "react-date-object/calendars/persian"
import persian_fa from "react-date-object/locales/persian_fa"
import { DateObject } from "react-multi-date-picker"
import QRCode from "react-qr-code"
import { API_ROUTES, createApiUrl } from "@/lib/api"
import api from "@/lib/axios"
import { motion, AnimatePresence } from "framer-motion"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"

interface TimeSlot {
  id: number
  start_time: string
  end_time: string
}

interface MenuItem {
  id: number
  food: {
    id: number
    name: string
    price: number
    image_url: string
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
  has_voucher: boolean
  price: number
  status: "waiting" | "preparing" | "ready_to_pickup" | "picked_up" | "pending_payment"
  qr_code: string
  payment_status?: "pending" | "paid" | "failed"
}

const ModalOrSheet = ({
  isOpen, 
  children,
  onClose,
}: { 
  isOpen: boolean; 
  children: React.ReactNode;
  onClose?: () => void;
}) => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-end justify-center sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 500 }}
            className={`bg-[#FBF7F4] w-full sm:w-[425px] ${isMobile ? "rounded-t-3xl" : "rounded-xl"} shadow-[0_0_10px_rgba(0,0,0,0.1)] overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function StudentDashboard() {
  const router = useRouter()
  const { logout } = useAuth()
  const [dailyMenu, setDailyMenu] = useState<DailyMenu | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedMeal, setSelectedMeal] = useState<"lunch" | "dinner">("lunch")
  const [selectedFood, setSelectedFood] = useState<MenuItem | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<number | null>(null)
  const [hasVoucher, setHasVoucher] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState("menu")
  const [voucherPrice, setVoucherPrice] = useState<number>(0)

  const fetchDailyMenu = useCallback(async () => {
    try {
      const response = await api.get(createApiUrl(API_ROUTES.GET_DAILY_MENU), {
        params: { 
          date: new DateObject(selectedDate).format("YYYY-MM-DD"), 
          meal_type: selectedMeal 
        },
      })
      setDailyMenu(response.data)
    } catch (error) {
      console.error("Error fetching daily menu:", error)
      setDailyMenu(null)
    }
  }, [selectedDate, selectedMeal])

  useEffect(() => {
    fetchDailyMenu()
    fetchReservations()
    fetchVoucherPrice()
  }, [fetchDailyMenu])

  // Add effect to refresh orders when returning from payment verification
  useEffect(() => {
    const handleFocus = () => {
      fetchReservations()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // Add effect to refresh orders when the page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchReservations()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const fetchVoucherPrice = async () => {
    try {
      const response = await api.get(createApiUrl(API_ROUTES.GET_VOUCHER_PRICE))
      setVoucherPrice(Number(response.data["price"]))
    } catch (error) {
      console.error("Error fetching voucher price:", error)
      setVoucherPrice(0)
    }
  }

  const fetchReservations = async () => {
    try {
      const response = await api.get(createApiUrl(API_ROUTES.GET_STUDENT_ORDERS))
      setReservations(response.data)
    } catch (error) {
      console.error("Error fetching reservations:", error)
      setReservations([])
    }
  }

  const handleFoodSelect = (item: MenuItem) => {
    setSelectedFood(item)
    setIsDialogOpen(true)
  }

  const handleTimeSelect = (slotId: number) => {
    setSelectedTimeSlot(slotId)
  }

  const handleVoucherToggle = (checked: boolean) => {
    setHasVoucher(checked)
  }

  const calculateTotalPrice = () => {
    if (!selectedFood) return 0
    return hasVoucher ? selectedFood.food.price - voucherPrice : selectedFood.food.price
  }

  const handleOrder = () => {
    if (!selectedFood || !selectedTimeSlot) {
      toast.error("لطفاً یک غذا و یک بازه زمانی برای دریافت غذا انتخاب کنید")
      return
    }

    setIsDialogOpen(false)
    setIsPaymentDialogOpen(true)
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

  const handlePayment = async () => {
    if (!selectedFood || !selectedTimeSlot) {
      toast.error("لطفاً یک غذا و یک بازه زمانی برای دریافت غذا انتخاب کنید")
      return
    }

    setIsPaymentProcessing(true)

    try {
      const callbackUrl = `${window.location.origin}/payment/verify`

      // First place the order
      const orderResponse = await api.post(createApiUrl(API_ROUTES.PLACE_ORDER), {
        food: selectedFood.food.id,
        time_slot: selectedTimeSlot,
        meal_type: selectedMeal,
        reserved_date: new DateObject(selectedDate).format("YYYY-MM-DD"),
        has_voucher: hasVoucher,
      })

      if (orderResponse.status !== 201) {
        toast.error("خطا در ثبت سفارش. لطفاً دوباره تلاش کنید")
        setIsPaymentProcessing(false)
        return
      }

      // Then create a payment request
      const paymentResponse = await api.post(createApiUrl(API_ROUTES.PAYMENT_REQUEST), {
        amount: calculateTotalPrice(),
        callback_url: callbackUrl,
        reservation_id: orderResponse.data.id,
      })

      // If we get a payment authority, redirect to ZarinPal
      if (paymentResponse.status === 201) {
        window.location.href = paymentResponse.data.redirect_url
      } else {
        toast.error("خطا در ایجاد درخواست پرداخت. لطفاً دوباره تلاش کنید")
        setIsPaymentProcessing(false)
      }
    } catch (error: unknown) {
      console.error("Error in payment process:", error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "خطا در فرآیند پرداخت. لطفاً دوباره تلاش کنید"
      toast.error(errorMessage)
      setIsPaymentProcessing(false)
    }
  }

  const handlePaymentForOrder = async (reservation: Reservation) => {
    setIsPaymentProcessing(true)

    try {
      const response: { data: unknown } = await api.post(createApiUrl(API_ROUTES.PAYMENT_REQUEST), {
        reservation_id: reservation.id,
        amount: Math.round(reservation.price),
        callback_url: `${window.location.origin}/payment/verify`
      })

      // Redirect to payment URL
      window.location.href = (response.data as { redirect_url: string }).redirect_url
    } catch (error) {
      console.error("Error processing payment:", error)
      toast.error("خطا در پرداخت سفارش")
      setIsPaymentProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF7F4] p-4 rtl">
      <Toaster position="top-center" />
      <header className="flex justify-between items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full transition-all duration-300 ease-in-out hover:scale-105"
          onClick={() => router.push("/payment/history")}
        >
          <CreditCard className="h-6 w-6" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full transition-all duration-300 ease-in-out hover:scale-105"
            >
              <User className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuItem asChild dir="rtl">
              <Link href="/edit-profile" className="flex items-center">
                <User className="ml-2 h-4 w-4" />
                <span>ویرایش پروفایل</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} dir="rtl">
              <LogOut className="ml-2 h-4 w-4" />
              <span>خروج</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="space-y-4 max-w-7xl mx-auto">
        <div className="flex gap-2 h-[42px] md:w-2/3 lg:w-1/2 mx-auto">
          <div className="flex-[3] h-full">
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
              inputClass="w-full h-full px-3 py-2 rounded-md bg-white shadow-[0_0_10px_rgba(0,0,0,0.1)] text-sm focus-visible:outline-none"
              containerClassName="w-full h-full"
              placeholder="انتخاب تاریخ"
            />
          </div>
          <div className="flex-1 h-full">
            <Select value={selectedMeal} onValueChange={(value: "lunch" | "dinner") => setSelectedMeal(value)}>
              <SelectTrigger className="w-full h-full bg-[#F4EDE7] shadow-[0_0_10px_rgba(0,0,0,0.1)] rounded-full">
                <SelectValue placeholder="وعده" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lunch">ناهار</SelectItem>
                <SelectItem value="dinner">شام</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-[#F4EDE7] p-1 h-auto rounded-full">
            <TabsTrigger
              value="menu"
              className="flex-1 data-[state=active]:bg-white rounded-full py-2 transition-all duration-300 ease-in-out text-gray-700"
              dir="rtl"
            >
              <Utensils className="w-4 h-4 ml-2" />
              منو
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="flex-1 data-[state=active]:bg-white rounded-full py-2 transition-all duration-300 ease-in-out text-gray-700"
              dir="rtl"
            >
              <Clock className="w-4 h-4 ml-2" />
              سفارش ها
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="menu"
            className={`mt-4 transition-all duration-300 ease-in-out ${activeTab === "menu" ? "animate-slide-right" : ""}`}
          >
            <motion.div
              initial={{ opacity: 0, x: activeTab === "menu" ? 0 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {dailyMenu?.items.map((item: MenuItem) => (
                <Card
                  key={item.id}
                  className="bg-white rounded-2xl shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out hover:shadow-[0_0_15px_rgba(0,0,0,0.2)] border border-gray-300"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="relative w-[100px] h-[100px]">
                        <Image
                          src={item.food.image_url || "/placeholder.svg"}
                          alt={item.food.name}
                          layout="fill"
                          objectFit="cover"
                          className="rounded-xl"
                        />
                        {!item.is_available && (
                          <Badge variant="destructive" className="absolute top-2 right-2 animate-pulse">
                            <AlertCircle className="w-4 h-4 ml-1" />
                            ناموجود
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col items-end flex-grow ">
                        <h3 className="font-semibold text-lg mb-1 mr-1">{item.food.name}</h3>
                        <p className="text-sm text-gray-500 bg-[#F4EDE7] px-2 py-1 rounded-full mb-10">
                          ظرفیت: {new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(item.daily_capacity)}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <Button
                        onClick={() => handleFoodSelect(item)}
                        className="bg-[#E8DED5] text-black hover:bg-[#E8DED5]/80 transition-all duration-300 ease-in-out hover:scale-105 rounded-full"
                        disabled={!item.is_available}
                      >
                        انتخاب
                      </Button>
                      <p className="text-xl font-bold text-primary estedad-font mr-1" dir="rtl">
                        {new Intl.NumberFormat("fa-IR", { useGrouping: true })
                          .format(item.food.price)
                          .replace(/٬/g, ",")}
                        <span className="text-sm mr-1">تومان</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </TabsContent>
          <TabsContent
            value="orders"
            className={`mt-4 transition-all duration-300 ease-in-out ${activeTab === "orders" ? "animate-slide-left" : ""}`}
          >
            <motion.div
              initial={{ opacity: 0, x: activeTab === "orders" ? 0 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {[...reservations].reverse().map((reservation) => (
                <Card
                  key={reservation.id}
                  className="bg-white rounded-2xl shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out hover:shadow-[0_0_15px_rgba(0,0,0,0.2)] border border-gray-300"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <Badge
                        variant={
                          reservation.status === "picked_up"
                            ? "default"
                            : reservation.status === "ready_to_pickup"
                              ? "secondary"
                              : reservation.status === "preparing"
                                ? "outline"
                                : reservation.status === "pending_payment"
                                  ? "destructive"
                                  : "destructive"
                        }
                        className="text-lg px-3 py-1"
                      >
                        {reservation.status === "waiting"
                          ? "در انتظار"
                          : reservation.status === "preparing"
                            ? "در حال آماده‌سازی"
                            : reservation.status === "ready_to_pickup"
                              ? "آماده تحویل"
                              : reservation.status === "pending_payment"
                                ? "در انتظار پرداخت"
                                : "تحویل داده شده"}
                      </Badge>
                      <h3 className="font-bold text-xl">سفارش #{reservation.id}</h3>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span dir="rtl">
                        {new Intl.NumberFormat("fa-IR", { useGrouping: true })
                          .format(reservation.price)
                          .replace(/٬/g, ",")}{" "}
                        تومان
                      </span>
                      <span>{reservation.food.name}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-600">
                          {reservation.time_slot.start_time.slice(0, 5).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])}{" "}
                          - {reservation.time_slot.end_time.slice(0, 5).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])}
                        </span>
                        <span className="font-bold">:زمان تحویل</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-600">{reservation.has_voucher ? "بله" : "خیر"}</span>
                        <span className="font-bold">:استفاده از ژتون</span>
                      </div>
                    </div>
                    {reservation.status === "pending_payment" && (
                      <div className="mt-4">
                        <Button
                          onClick={() => handlePaymentForOrder(reservation)}
                          className="w-full bg-black hover:bg-black/80 text-white transition-colors duration-200"
                        >
                          پرداخت سفارش
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {reservation.status !== "pending_payment" && (
                      <div className="mt-4">
                        <QRCode value={reservation.qr_code} size={150} className="mx-auto" />
                        <p className="text-center mt-2 text-gray-600">برای دریافت سفارش خود، این کد QR را اسکن کنید</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Food Selection Modal */}
      <ModalOrSheet isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4" dir="rtl">
            <h2 className="text-xl font-semibold text-black">انتخاب زمان تحویل</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDialogOpen(false)}
              className="text-black hover:text-black/80"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <p className="text-black mb-4" dir="rtl">
            لطفاً زمان تحویل مورد نظر خود را برای {selectedFood?.food.name} انتخاب کنید.
          </p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {selectedFood?.time_slots.map((slot) => (
              <Button
                key={slot.id}
                variant={selectedTimeSlot === slot.id ? "default" : "outline"}
                onClick={() => handleTimeSelect(slot.id)}
                className={`transition-all duration-200 ${
                  selectedTimeSlot === slot.id ? "bg-black text-white" : "text-black hover:bg-[#E8DED5]"
                }`}
              >
                {slot.start_time.slice(0, 5).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])}{" "}
                - {slot.end_time.slice(0, 5).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])}
              </Button>
            ))}
          </div>
          <div className="flex items-center justify-between mb-4">
            <Switch id="voucher" checked={hasVoucher} onCheckedChange={handleVoucherToggle} />
            <Label htmlFor="voucher" className="text-black">
              استفاده از ژتون
            </Label>
          </div>
          <div className="text-xl font-bold mb-6 text-black estedad-font">
            قیمت نهایی:{" "}
            {new Intl.NumberFormat("fa-IR", { useGrouping: true }).format(calculateTotalPrice()).replace(/٬/g, ",")}{" "}
            تومان
          </div>
          <div className="flex justify-end gap-4">
            <Button
              onClick={() => setIsDialogOpen(false)}
              variant="outline"
              className="text-black hover:bg-[#E8DED5] transition-colors duration-200"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              بازگشت
            </Button>
            <Button
              onClick={handleOrder}
              disabled={!selectedTimeSlot}
              className="bg-black hover:bg-black/80 text-white transition-colors duration-200"
            >
              ادامه به پرداخت
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </ModalOrSheet>

      {/* Payment Modal */}
      <ModalOrSheet isOpen={isPaymentDialogOpen} onClose={() => setIsPaymentDialogOpen(false)}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4" dir="rtl">
            <h2 className="text-xl font-semibold text-black">صورتحساب سفارش</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPaymentDialogOpen(false)}
              className="text-black hover:text-black/80"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <p className="text-black mb-4" dir="rtl">
            لطفاً جزئیات سفارش خود را بررسی کنید.
          </p>
          <div className="bg-[#E8DED5] p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-black" dir="rtl">
                {new Intl.NumberFormat("fa-IR", { useGrouping: true })
                  .format(Number(selectedFood?.food.price))
                  .replace(/٬/g, ",")}{" "}
                تومان
              </span>
              <span className="text-black">{selectedFood?.food.name}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-black">{hasVoucher ? "بله" : "خیر"}</span>
              <span className="font-semibold text-black">استفاده از ژتون</span>
            </div>
            <Separator className="my-2 bg-black" />
            <div className="flex justify-between items-center mt-2 text-lg font-bold">
              <span className="text-black" dir="rtl">
                {new Intl.NumberFormat("fa-IR", { useGrouping: true }).format(calculateTotalPrice()).replace(/٬/g, ",")}{" "}
                تومان
              </span>
              <span className="text-black">قیمت نهایی</span>
            </div>
          </div>

          <Button
            onClick={handlePayment}
            disabled={isPaymentProcessing}
            className="bg-black hover:bg-black/80 text-white transition-colors duration-200"
          >
            {isPaymentProcessing ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                در حال پردازش...
              </span>
            ) : (
              <span className="flex items-center">
                پرداخت و ثبت سفارش
                <ChevronRight className="ml-2 h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      </ModalOrSheet>
    </div>
  )
}
