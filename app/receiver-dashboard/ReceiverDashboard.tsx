"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Html5QrcodeScanner } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Loader2,
  CheckCircle,
  QrCode,
  Package,
  User,
  LogOut,
  Calendar,
  Clock,
  DollarSign,
  Utensils,
  UserCheck,
  X,
  Moon,
} from "lucide-react"
import { toast, Toaster } from "react-hot-toast"
import DatePicker from "react-multi-date-picker"
import persian from "react-date-object/calendars/persian"
import persian_fa from "react-date-object/locales/persian_fa"
import { DateObject } from "react-multi-date-picker"

// Assume these are imported from your project's files
import api from "@/lib/axios"
import { API_ROUTES, createApiUrl } from "@/lib/api"

interface Reservation {
  id: number
  student: {
    id: number
    first_name: string
    last_name: string
  }
  food: {
    id: number
    name: string
    price: number
  }
  time_slot: {
    start_time: string
    end_time: string
  }
  reserved_date: string
  has_voucher: boolean
  price: number
  status: "waiting" | "preparing" | "ready_to_pickup" | "picked_up"
  qr_code: string
  created_at: string
  updated_at: string
}

interface User {
  first_name: string
  last_name: string
  phone_number: string
}

interface QRScannerProps {
  onResult: (result: string) => void
  onError?: (error: string) => void
}

function QRScanner({ onResult, onError }: QRScannerProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: {
          width: 250,
          height: 250,
        },
        aspectRatio: 1.0,
      },
      false,
    )

    scanner.render(
      (decodedText) => {
        scanner.clear()
        setErrorMessage(null)
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current)
        }
        onResult(decodedText)
      },
      (errorMessage) => {
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current)
        }
        errorTimeoutRef.current = setTimeout(() => {
          setErrorMessage("QR لطفا دوباره تلاش کنید. خطا در اسکن کد")
          if (onError) {
            onError(errorMessage)
          }
        }, 30000)
      },
    )

    return () => {
      scanner.clear().catch(console.error)
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current)
      }
    }
  }, [onResult, onError])

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div id="qr-reader" className="w-full max-w-sm mx-auto" />
        {errorMessage && <p className="text-red-500 text-center">{errorMessage}</p>}
      </div>
    </Card>
  )
}

interface ReservationDetailModalProps {
  reservation: Reservation
  onClose: () => void
  onDeliver: () => void
}

function ReservationDetailModal({ reservation, onClose, onDeliver }: ReservationDetailModalProps) {
  const statusSteps = [
    { title: "در انتظار", icon: Clock, color: "text-yellow-500" },
    { title: "در حال آماده‌سازی", icon: Utensils, color: "text-blue-500" },
    { title: "آماده تحویل", icon: Package, color: "text-green-500" },
    { title: "تحویل داده شده", icon: CheckCircle, color: "text-gray-400" },
  ]

  const currentStatusIndex = statusSteps.findIndex((step) => step.title === getStatusTitle(reservation.status))

  function getStatusTitle(status: Reservation["status"]) {
    switch (status) {
      case "waiting":
        return "در انتظار"
      case "preparing":
        return "در حال آماده‌سازی"
      case "ready_to_pickup":
        return "آماده تحویل"
      case "picked_up":
        return "تحویل داده شده"
      default:
        return ""
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-[90vw] sm:max-w-3xl mx-auto shadow-xl rtl relative"
    >
      <button
        onClick={onClose}
        className="absolute left-2 sm:left-4 top-2 sm:top-4 text-gray-500 hover:text-gray-700"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>

      <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-4 sm:mb-6" dir="rtl">
        جزئیات رزرو {new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(reservation.id)}#
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-end space-x-2">
            <span className="text-sm sm:text-base">
              {reservation.student.first_name} {reservation.student.last_name}
            </span>
            <span className="font-bold text-sm sm:text-base">:نام دانشجو</span>
            <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-primary ml-2" />
          </div>
          <div className="flex items-center justify-end space-x-2">
            <span className="text-sm sm:text-base">{reservation.food.name}</span>
            <span className="font-bold text-sm sm:text-base">:غذا</span>
            <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-primary ml-2" />
          </div>
          <div className="flex items-center justify-end space-x-2">
            <span className="text-sm sm:text-base">
              {reservation.time_slot.start_time.slice(0, 5).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])} -{" "}
              {reservation.time_slot.end_time.slice(0, 5).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])}
            </span>
            <span className="font-bold text-sm sm:text-base">:زمان تحویل</span>
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary ml-2" />
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-end space-x-2">
            <span className="text-sm sm:text-base">
              {new Intl.DateTimeFormat("fa-IR").format(new Date(reservation.reserved_date))}
            </span>
            <span className="font-bold text-sm sm:text-base">:تاریخ رزرو</span>
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary ml-2" />
          </div>
          <div className="flex items-center justify-end space-x-2">
            <span className="text-sm sm:text-base" dir="rtl">
              {new Intl.NumberFormat("fa-IR", { useGrouping: true }).format(reservation.food.price).replace(/٬/g, ",")}
              <span className="text-xs sm:text-sm mr-1">تومان</span>
            </span>
            <span className="font-bold text-sm sm:text-base">:قیمت</span>
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-primary ml-2" />
          </div>
          <div className="flex items-center justify-end space-x-2">
            {reservation.has_voucher ? (
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 ml-2" />
            ) : (
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 ml-2" />
            )}
            <span className="text-sm sm:text-base">{reservation.has_voucher ? "بله" : "خیر"}</span>
            <span className="font-bold text-sm sm:text-base">:کوپن</span>
          </div>
        </div>
      </div>

      <div className="mt-4 sm:mt-6">
        <h3 className="text-base sm:text-lg font-bold mb-2 text-right">وضعیت سفارش</h3>
        <div className="flex justify-between items-center bg-gray-100 p-2 sm:p-4 rounded-lg">
          {statusSteps.map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: index * 0.2 }}>
                <step.icon
                  className={`w-6 h-6 sm:w-8 sm:h-8 ${index <= currentStatusIndex ? step.color : "text-gray-300"}`}
                />
              </motion.div>
              <span className="text-xs sm:text-sm mt-1">{step.title}</span>
              {index < statusSteps.length - 1 && (
                <div
                  className={`h-1 w-8 sm:w-16 ${index < currentStatusIndex ? "bg-green-500" : "bg-gray-300"} mx-1 sm:mx-2`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 sm:mt-6">
        <Button
          onClick={onDeliver}
          className="w-full"
          disabled={reservation.status !== "ready_to_pickup"}
          variant={reservation.status === "ready_to_pickup" ? "default" : "secondary"}
        >
          <Package className="w-4 h-4 ml-2" />
          {reservation.status === "ready_to_pickup" ? "تحویل سفارش" : getStatusTitle(reservation.status)}
        </Button>
      </div>
    </motion.div>
  )
}

export default function ReceiverDashboard() {
  const router = useRouter()
  const [user] = useState<User>({ first_name: "زهرا تحویل‌دهنده", last_name: "receiver", phone_number: "09123456789" })
  const [scannedCode, setScannedCode] = useState("")
  const [currentReservation, setCurrentReservation] = useState<Reservation | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [readyToPickupOrders, setReadyToPickupOrders] = useState<Reservation[]>([])
  const [pickedUpOrders, setPickedUpOrders] = useState<Reservation[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedMealType, setSelectedMealType] = useState<"lunch" | "dinner">("lunch")
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false)
  const [isReservationDialogOpen, setIsReservationDialogOpen] = useState(false)

  const fetchOrders = useCallback(async () => {
    try {
      const formattedDate = new DateObject(selectedDate).format("YYYY-MM-DD")
      const [readyToPickupResponse, pickedUpResponse] = await Promise.all([
        api.get(createApiUrl(API_ROUTES.GET_READY_TO_PICKUP_ORDERS), {
          params: { reserved_date: formattedDate, meal_type: selectedMealType },
        }),
        api.get(createApiUrl(API_ROUTES.GET_PICKED_UP_ORDERS), {
          params: { reserved_date: formattedDate, meal_type: selectedMealType },
        }),
      ])
      setReadyToPickupOrders(readyToPickupResponse.data)
      setPickedUpOrders(pickedUpResponse.data)
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast.error("خطا در دریافت سفارش‌ها")
    }
  }, [selectedDate, selectedMealType])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleScan = useCallback(async (code: string) => {
    if (!code || code.trim() === "") {
      toast.error("را اسکن کنید QR لطفا کد")
      return
    }

    setIsScanning(true)

    try {
      const response = await api.post(createApiUrl(API_ROUTES.SCAN_QR), { qr_code_data: code })
      setCurrentReservation(response.data)
      toast.success("با موفقیت اسکن شد QR کد")
      setIsReservationDialogOpen(true)
      setIsQrDialogOpen(false) // Close the QR dialog after successful scan
    } catch (error) {
      console.error("Error scanning QR code:", error)
      toast.error("نامعتبر است QR لطفاً دوباره تلاش کنید. کد")
    } finally {
      setIsScanning(false)
      setScannedCode("")
    }
  }, [])

  const handleDeliverOrder = async () => {
    if (currentReservation) {
      try {
        const response = await api.patch(createApiUrl(API_ROUTES.DELIVER_ORDER(currentReservation.id.toString())))
        setReadyToPickupOrders(readyToPickupOrders.filter((order) => order.id !== currentReservation.id))
        setPickedUpOrders([...pickedUpOrders, response.data.data])
        setCurrentReservation(null)
        setIsReservationDialogOpen(false)
        toast.success(`سفارش ${currentReservation.id} با موفقیت تحویل داده شد`)
      } catch (error) {
        console.error("Error delivering order:", error)
        toast.error("خطا در تحویل سفارش")
      }
    }
  }

  const handleLogout = async () => {
    try {
      await api.post(createApiUrl(API_ROUTES.SIGNOUT), {
        refresh_token: localStorage.getItem("refresh_token"),
      })
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      toast.success("با موفقیت از حساب کاربری خارج شدید")
      router.push("/")
    } catch (error) {
      console.error("Error logging out:", error)
      toast.error("خطا در خروج از حساب کاربری")
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF7F4] rtl">
      <Toaster position="top-center" />
      <header className="sticky top-0 z-50 w-full bg-white shadow-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <Package className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary">سامانه رزرو غذای دانشگاه - تحویل</span>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-avatar.jpg" alt={user.first_name} />
                  <AvatarFallback>{user.first_name.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuItem>
                <User className="ml-2 h-4 w-4" />
                <span>پروفایل</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="ml-2 h-4 w-4" />
                <span>خروج</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="container mx-auto mt-8 px-4 pb-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-primary mb-2">داشبورد تحویل‌دهنده</h1>
            <p className="text-xl text-gray-600">و تحویل سفارش‌ ها QR اسکن کد</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-primary flex items-center" dir="rtl">
                  <QrCode className="w-6 h-6 ml-2" />
                  اسکن کد QR
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">QR اسکن کد</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>QR اسکن کد</DialogTitle>
                    </DialogHeader>
                    <QRScanner
                      onResult={handleScan}
                      onError={(error) => {
                        console.error("QR Scan Error:", error)
                        toast.error("QR لطفا دوباره تلاش کنید. خطا در اسکن کد")
                      }}
                    />
                  </DialogContent>
                </Dialog>
                <div className="flex space-x-4">
                  <Input
                    type="text"
                    placeholder="یا کد QR را وارد کنید"
                    value={scannedCode}
                    onChange={(e) => setScannedCode(e.target.value)}
                    className="flex-grow"
                    dir="rtl"
                  />
                  <Button onClick={() => handleScan(scannedCode)} disabled={isScanning || !scannedCode}>
                    {isScanning ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        در حال اسکن...
                      </>
                    ) : (
                      "اسکن دستی"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-primary flex items-center" dir="rtl">
                  <Calendar className="w-6 h-6 ml-2" />
                  انتخاب تاریخ و وعده غذایی
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4" dir="rtl">
                <div className="flex flex-col space-y-2">
                  <label htmlFor="date-picker" className="text-sm font-medium text-gray-700">
                    تاریخ:
                  </label>
                  <DatePicker
                    id="date-picker"
                    value={selectedDate}
                    onChange={(date) => {
                      if (date instanceof DateObject) {
                        setSelectedDate(date.toDate())
                      }
                    }}
                    calendar={persian}
                    locale={persian_fa}
                    calendarPosition="bottom-right"
                    inputClass="w-full px-3 py-2 rounded-md bg-white shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    containerClassName="w-full"
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <label htmlFor="meal-type" className="text-sm font-medium text-gray-700">
                    وعده غذایی:
                  </label>
                  <Select
                    value={selectedMealType}
                    onValueChange={(value) => setSelectedMealType(value as "lunch" | "dinner")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="انتخاب وعده غذایی" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lunch">
                        <div className="flex items-center">
                          <Utensils className="mr-2 h-4 w-4" />
                          <span>ناهار</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="dinner">
                        <div className="flex items-center">
                          <Moon className="mr-2 h-4 w-4" />
                          <span>شام</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {isReservationDialogOpen && currentReservation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <ReservationDetailModal
                reservation={currentReservation}
                onClose={() => setIsReservationDialogOpen(false)}
                onDeliver={handleDeliverOrder}
              />
            </div>
          )}

          <Tabs defaultValue="ready_to_pickup" className="w-full">
            <TabsList className="flex justify-between bg-gradient-to-r from-orange-100 to-red-100 p-1 rounded-xl mb-4 shadow-md">
              <TabsTrigger
                value="ready_to_pickup"
                className="flex-1 rounded-lg py-2 text-sm font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                dir="rtl"
              >
                <Package className="w-4 h-4 ml-2" />
                آماده تحویل
              </TabsTrigger>
              <TabsTrigger
                value="picked_up"
                className="flex-1 rounded-lg py-2 text-sm font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                dir="rtl"
              >
                <CheckCircle className="w-4 h-4 ml-2" />
                تحویل داده شده
              </TabsTrigger>
            </TabsList>
            <TabsContent value="ready_to_pickup">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-primary flex items-center" dir="rtl">
                    <Package className="w-6 h-6 ml-2" />
                    سفارش‌های آماده تحویل
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {readyToPickupOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-lg shadow-lg p-4 mb-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-xl">رزرو {new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(order.id)}#</h3>
                        <Badge className="bg-orange-500">آماده تحویل</Badge>
                      </div>
                      <p className="text-gray-600 mb-2">
                        دانشجو: {order.student.first_name} {order.student.last_name}
                      </p>
                      <p className="text-gray-600 mb-2">غذا: {order.food.name}</p>
                      <p className="text-gray-600 mb-2">
                        زمان تحویل: {order.time_slot.start_time.slice(0, 5).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])} - {order.time_slot.end_time.slice(0, 5).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])}
                      </p>
                      <p className="font-bold text-lg">
                        {new Intl.NumberFormat("fa-IR", { useGrouping: true }).format(order.price).replace(/٬/g, ",")}
                        <span className="text-xs sm:text-sm mr-1">تومان</span>
                      </p>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="picked_up">
              <Card dir="rtl">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary flex items-center" dir="rtl">
                    <CheckCircle className="w-6 h-6 ml-2" />
                    سفارش‌های تحویل داده شده
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pickedUpOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-lg shadow-lg p-4 mb-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-xl">رزرو {new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(order.id)}#</h3>
                        <Badge className="bg-green-500">تحویل داده شده</Badge>
                      </div>
                      <p className="text-gray-600 mb-2">
                        دانشجو: {order.student.first_name} {order.student.last_name}
                      </p>
                      <p className="text-gray-600 mb-2">غذا: {order.food.name}</p>
                      <p className="text-gray-600 mb-2">
                        زمان تحویل: {order.time_slot.start_time.slice(0, 5).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])} - {order.time_slot.end_time.slice(0, 5).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])}
                      </p>
                      <p className="font-bold text-lg">
                        {new Intl.NumberFormat("fa-IR", { useGrouping: true }).format(order.price).replace(/٬/g, ",")}
                        <span className="text-xs sm:text-sm mr-1">تومان</span>
                      </p>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

