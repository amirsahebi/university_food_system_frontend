"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Loader2,
  CheckCircle,
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
  AlertTriangle,
  Printer,
  Eye,
  Copy,
  CheckCheck,
  Search,
  Ticket,
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
  reservation_number: string;
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
  return new Date(iranTime).getHours() // Get the hour from Iran's local time
}

export default function ReceiverDashboard() {
  const router = useRouter()
  const [user] = useState<AppUser>({
    first_name: "تحویل‌دهنده",
    last_name: "receiver",
    phone_number: "09123456789",
  })
  const [deliveryCode, setDeliveryCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [currentReservation, setCurrentReservation] = useState<Reservation | null>(null)
  const [isReservationDialogOpen, setIsReservationDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Reservation | null>(null)
  const [isOrderDetailsDialogOpen, setIsOrderDetailsDialogOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  // Add a new state for the search term
  const [searchTerm, setSearchTerm] = useState<string>("")

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

  // Add a search function to filter reservations by reservation number
  const filterReservationsBySearch = useCallback(
    (reservations: Reservation[]) => {
      if (!searchTerm.trim()) return reservations

      return reservations.filter((reservation) => reservation.reservation_number.toString().includes(searchTerm.trim()))
    },
    [searchTerm],
  )

  const fetchAllOrders = useCallback(async () => {
    try {
      const formattedDate = new DateObject(selectedDate).format("YYYY-MM-DD")

      // Fetch all orders for the chef view
      const chefResponse = await api.get(createApiUrl(API_ROUTES.GET_RECEIVER_ORDERS), {
        params: { reserved_date: formattedDate, meal_type: selectedMeal },
      })

      // Separate orders by status and sort
      const allOrders = chefResponse.data.sort((a: Reservation, b: Reservation) => {
        // First check if time_slot exists for both orders
        if (!a.time_slot || !b.time_slot) {
          return 0; // Keep original order if time_slot is missing
        }
        
        if (!a.time_slot.start_time || !b.time_slot.start_time) {
          return 0; // Keep original order if start_time is missing
        }
        
        // First, compare start times
        const startTimeA = new Date(`1970-01-01T${a.time_slot.start_time}`).getTime()
        const startTimeB = new Date(`1970-01-01T${b.time_slot.start_time}`).getTime()
        
        if (startTimeA !== startTimeB) {
          return startTimeA - startTimeB
        }
        
        // If start times are equal, compare reservation numbers
        // Handle undefined, null, or non-string values
        const reservationNumberA = String(a.reservation_number || '')
        const reservationNumberB = String(b.reservation_number || '')
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
  }, [fetchAllOrders])

  const handleUpdateStatus = async (
    reservationId: number,
    newStatus: "waiting" | "preparing" | "ready_to_pickup" | "picked_up" | "not_picked_up",
  ) => {
    try {
      const apiStatus = {
        waiting: "waiting",
        preparing: "preparing",
        ready_to_pickup: "ready_to_pickup",
        picked_up: "picked_up",
        not_picked_up: "not_picked_up",
      }[newStatus]

      await api.patch(createApiUrl(API_ROUTES.UPDATE_ORDER_STATUS(String(reservationId))), { status: apiStatus })

      // Update the local state based on the new status
      const updatedOrder = {
        ...(waitingOrders.find((o) => o.id === reservationId) ||
          preparingOrders.find((o) => o.id === reservationId) ||
          readyToPickupOrders.find((o) => o.id === reservationId) ||
          pickedUpOrders.find((o) => o.id === reservationId) ||
          notPickedUpOrders.find((o) => o.id === reservationId)),
        status: newStatus,
      } as Reservation

      // Remove from current status list
      if (newStatus === "preparing") {
        setWaitingOrders(waitingOrders.filter((order) => order.id !== reservationId))
        setPreparingOrders([...preparingOrders, updatedOrder])
      } else if (newStatus === "ready_to_pickup") {
        setPreparingOrders(preparingOrders.filter((order) => order.id !== reservationId))
        setReadyToPickupOrders([...readyToPickupOrders, updatedOrder])
      } else if (newStatus === "picked_up") {
        setReadyToPickupOrders(readyToPickupOrders.filter((order) => order.id !== reservationId))
        setPickedUpOrders([...pickedUpOrders, updatedOrder])
      } else if (newStatus === "not_picked_up") {
        setReadyToPickupOrders(readyToPickupOrders.filter((order) => order.id !== reservationId))
        setNotPickedUpOrders([...notPickedUpOrders, updatedOrder])
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
      // Replace with your API endpoint for verifying delivery code
      const response = await api.post(createApiUrl(API_ROUTES.VERIFY_DELIVERY_CODE), {
        delivery_code: deliveryCode,
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
    const order = orderData || currentReservation;
    
    if (order) {
      try {
        let response;
        
        if (status === "picked_up") {
          response = await api.patch(createApiUrl(API_ROUTES.DELIVER_ORDER(order.id.toString())));
        } else {
          // Use separate API endpoint for "not picked up" status
          response = await api.patch(createApiUrl(API_ROUTES.NOT_PICKED_UP_ORDER(order.id.toString())));
        }
        
        // More flexible response handling
        const updatedOrder = response.data || response || order
        
        // Update orders
        setReadyToPickupOrders(readyToPickupOrders.filter((o) => o.id !== order.id))
        
        if (status === "picked_up") {
          setPickedUpOrders((prevOrders) => {
            // Check if the order is already in picked up orders to avoid duplicates
            const isAlreadyInPickedUp = prevOrders.some((o) => o.id === updatedOrder.id)
            return isAlreadyInPickedUp ? prevOrders : [...prevOrders, updatedOrder]
          })
          toast.success(`سفارش ${new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(
            Number(order.reservation_number),
          )} با موفقیت تحویل داده شد`)
        } else {
          setNotPickedUpOrders((prevOrders) => {
            // Check if the order is already in not picked up orders to avoid duplicates
            const isAlreadyInNotPickedUp = prevOrders.some((o) => o.id === updatedOrder.id)
            return isAlreadyInNotPickedUp ? prevOrders : [...prevOrders, updatedOrder]
          })
          toast.success(`سفارش ${new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(
            Number(order.reservation_number),
          )} به عنوان تحویل گرفته نشده ثبت شد`)
        }
        
        // Only close the modal and clear current reservation if we're in the modal flow
        if (!orderData) {
          setCurrentReservation(null)
          setIsReservationDialogOpen(false)
        }
      } catch (error) {
        console.error("Error delivering order:", error)
        if (error instanceof Error) {
          toast.error(`خطا در تحویل سفارش: ${error.message}`)
        } else {
          toast.error("خطا در تحویل سفارش")
        }
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

  // Update the printReservationSlip function to enhance the logo in the receipt
  const printReservationSlip = useCallback((order: Reservation) => {
    // Create a new window for printing with thermal paper dimensions (97x58mm)
    const printWindow = window.open("", "_blank", "width=600,height=800")

    if (!printWindow) {
      toast.error("خطا در باز کردن پنجره چاپ")
      return
    }

    // Generate HTML for the reservation slip with thermal paper styling
    const slipHtml = `
  <html>
    <head>
      <title>رسید رزرو غذا</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          direction: rtl; 
          text-align: right; 
          width: 160px;  /* 57mm = ~170px at 96dpi */
          margin: 10px;   /* Smaller margin for thermal paper */
          padding: 0;
          line-height: 1.1;
          font-size: 10px;  /* Smaller font size for 57mm width */
          page-break-inside: avoid;
        }
        
        .slip-header { 
          background-color: #f4f4f4; 
          padding: 5px;  
          text-align: center; 
          border-bottom: 2px solid #F47B20;
        }
        
        .slip-details { 
          margin-top: 15px;  
        }
        
        .slip-details div { 
          margin-bottom: 3px;
        }
        
        .slip-footer { 
          margin-top: 10px;
          text-align: center;
          font-size: 10px;
        }
        
        .logo {
          max-width: 120px;
          margin: 0 auto 5px;  
          display: block;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }
        
        .delivery-code {
          font-size: 14px;
          font-weight: bold;
          text-align: center;
          margin: 10px 0;
          padding: 5px;
          border: 1px dashed #000;
          letter-spacing: 2px;
        }
        .slip-header { 
          background-color: #f4f4f4; 
          padding: 5px;  
          text-align: center; 
          border-bottom: 2px solid #F47B20;
        }
        .slip-details { 
          margin-top: 15px;  
        }
        .slip-details div { 
          margin-bottom: 10px;  
        }
        .slip-footer { 
          margin-top: 30px;  
          text-align: center; 
          font-size: 0.8em; 
          color: #666; 
        }
        .delivery-code {
          font-size: 14px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
          padding: 15px;
          background-color: #FFF8F2;
          border: 2px dashed #F47B20;
          border-radius: 10px;
          letter-spacing: 5px;
        }
        .logo {
          max-width: 120px;
          margin: 0 auto 5px;  
          display: block;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }
      </style>
    </head>
    <body>
      <div class="slip-header">
        <img src="/images/javanfoods_logo.png" alt="جوان" class="logo">
        <h1 style="color: #F47B20;">رسید رزرو غذا</h1>
        <p>سیستم رزرواسیون غذای جوان</p>
      </div>
      <div class="slip-details">
        <div><strong>شماره رزرو:</strong> ${new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(
          Number(order.reservation_number),
        )}</div>
        <div><strong>نام دانشجو:</strong> ${order.student.first_name} ${order.student.last_name}</div>
        <div><strong>شماره تماس:</strong> ${order.student.phone_number}</div>
        <div><strong>غذا:</strong> ${order.food.name}</div>
        ${order.food.category_name ? `<div><strong>دسته‌بندی:</strong> ${order.food.category_name}</div>` : ""}
        <div><strong>تاریخ رزرو:</strong> ${new Intl.DateTimeFormat("fa-IR").format(new Date(order.reserved_date))}</div>
        <div><strong>زمان سرو:</strong> ${order.time_slot && order.time_slot.start_time
          ? order.time_slot.end_time.slice(0, 5).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]) + ' - ' + order.time_slot.start_time.slice(0, 5).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])
          : ''}</div>
        <div><strong>فیش دارد:</strong> ${order.has_voucher ? "بله" : "نه"}</div>
        <div><strong>قیمت:</strong> ${new Intl.NumberFormat("fa-IR", { useGrouping: true })
        .format(Number(order.price))
        .replace(/٬/g, ",")}
        <span className="text-xs sm:text-sm mr-1">تومان</span>
        </div>
        <div class="delivery-code">کد تحویل: ${order.delivery_code || order.id.toString().padStart(6, "0")}</div>
      </div>
    </body>
  </html>
`

    // Write the HTML to the new window
    printWindow.document.write(slipHtml)

    // Close the document writing
    printWindow.document.close()

    // Trigger print
    printWindow.print()
  }, [])

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      waiting: "bg-yellow-500",
      preparing: "bg-blue-500",
      ready_to_pickup: "bg-[#F47B20]",
      picked_up: "bg-[#5CB85C]",
      not_picked_up: "bg-red-500",
      pending_payment: "bg-purple-500",
      cancelled: "bg-red-500",
    }
    return colorMap[status] || "bg-gray-500"
  }

  const getStatusTitle = (status: string) => {
    const statusMap: Record<string, string> = {
      waiting: "در انتظار",
      preparing: "در حال آماده‌سازی",
      ready_to_pickup: "آماده تحویل",
      picked_up: "تحویل داده شده",
      not_picked_up: "تحویل گرفته نشده",
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

  // Generate a delivery code for an order if it doesn't have one
  const getDeliveryCode = (order: Reservation) => {
    return order.delivery_code.toString()
  }

  return (
    <div className="min-h-screen bg-[#FFF8F2] rtl">
      <Toaster position="top-center" />
      <header className="sticky top-0 z-50 w-full bg-white shadow-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center">
            <div className="relative h-12 w-12 mr-3 transition-transform duration-300 hover:scale-110">
              <Image src="/images/javanfoods_logo.png" alt="جوان" fill className="object-contain drop-shadow-md" />
            </div>
            <span className="text-xl font-bold text-[#F47B20]">رستوران جوان - تحویل</span>
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
            <h1 className="text-4xl font-bold text-[#F47B20] mb-2">داشبورد تحویل‌دهنده</h1>
            <p className="text-xl text-gray-600">مدیریت، آماده‌سازی و تحویل سفارش‌ها</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8" dir="rtl">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">در انتظار</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(waitingOrders.length)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">در حال آماده‌سازی</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(preparingOrders.length)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">آماده تحویل</CardTitle>
                <Package className="h-4 w-4 text-[#F47B20]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(readyToPickupOrders.length)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">تحویل داده شده</CardTitle>
                <CheckCircle className="h-4 w-4 text-[#5CB85C]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(pickedUpOrders.length)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">تحویل گرفته نشده</CardTitle>
                <X className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(notPickedUpOrders.length)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-[#F47B20] flex items-center" dir="rtl">
                  <Package className="w-6 h-6 ml-2" />
                  تایید کد تحویل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col space-y-4">
                  <div className="flex space-x-4">
                    <Input
                      type="text"
                      placeholder="کد تحویل را وارد کنید"
                      value={deliveryCode}
                      onChange={(e) => setDeliveryCode(e.target.value)}
                      className="flex-grow"
                      dir="rtl"
                    />
                    <Button
                      onClick={verifyDeliveryCode}
                      disabled={isVerifying || !deliveryCode}
                      className="bg-[#F47B20] hover:bg-[#E06A10] text-white"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          در حال بررسی...
                        </>
                      ) : (
                        "تایید کد"
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    کد تحویل را از دانشجو دریافت کرده و در اینجا وارد کنید
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-[#F47B20] flex items-center" dir="rtl">
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
                    inputClass="w-full px-3 py-2 rounded-md bg-white shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F47B20] focus:border-transparent"
                    containerClassName="w-full"
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <label htmlFor="meal-type" className="text-sm font-medium text-gray-700">
                    وعده غذایی:
                  </label>
                  <Select value={selectedMeal} onValueChange={(value) => setSelectedMeal(value as "lunch" | "dinner")}>
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

          {/* Add search bar */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Input
                  type="text"
                  placeholder="جستجو بر اساس شماره رزرو..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-grow"
                  dir="rtl"
                />
                {searchTerm && (
                  <Button variant="ghost" size="icon" onClick={() => setSearchTerm("")} className="h-10 w-10">
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button className="bg-[#F47B20] hover:bg-[#E06A10]" dir="rtl">
                  <Search className="h-4 w-4 ml-2" />
                  جستجو
                </Button>
              </div>
            </CardContent>
          </Card>

          {isReservationDialogOpen && currentReservation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-[90vw] sm:max-w-3xl mx-auto shadow-xl rtl relative"
              >
                <button
                  onClick={() => setIsReservationDialogOpen(false)}
                  className="absolute left-2 sm:left-4 top-2 sm:top-4 text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  <X className="h-6 w-6" />
                </button>

                <h2 className="text-2xl sm:text-3xl font-bold text-[#F47B20] mb-4 sm:mb-6" dir="rtl">
                  جزئیات رزرو{" "}
                  {new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(
                    Number(currentReservation.reservation_number),
                  )}
                  #
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-end space-x-2">
                      <span className="text-sm sm:text-base">
                        {currentReservation.student.first_name} {currentReservation.student.last_name}
                      </span>
                      <span className="font-bold text-sm sm:text-base">:نام دانشجو</span>
                      <UserCheck className="w-4 h-4 ml-2" />
                    </div>
                    <div className="flex items-center justify-end space-x-2">
                      <span className="text-sm sm:text-base">{currentReservation.food.name}</span>
                      <span className="font-bold text-sm sm:text-base">:غذا</span>
                      <Utensils className="w-4 h-4 ml-2" />
                    </div>
                    <div className="flex items-center justify-end space-x-2">
                      <span className="text-sm sm:text-base">
                        {currentReservation.time_slot && currentReservation.time_slot.end_time
                          ? currentReservation.time_slot.start_time.slice(0, 5).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])
                          : ''}{" "}
                        {currentReservation.time_slot && currentReservation.time_slot.start_time && currentReservation.time_slot.end_time
                          ? '- ' + currentReservation.time_slot.end_time.slice(0, 5).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])
                          : ''}
                      </span>
                      <span className="font-bold text-sm sm:text-base">:زمان تحویل</span>
                      <Clock className="w-4 h-4 ml-2" />
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-end space-x-2">
                      <span className="text-sm sm:text-base">
                        {new Intl.DateTimeFormat("fa-IR").format(new Date(currentReservation.reserved_date))}
                      </span>
                      <span className="font-bold text-sm sm:text-base">:تاریخ رزرو</span>
                      <Calendar className="w-4 h-4 ml-2" />
                    </div>
                    <div className="flex items-center justify-end space-x-2">
                      <span className="text-sm sm:text-base" dir="rtl">
                        {new Intl.NumberFormat("fa-IR", { useGrouping: true })
                          .format(Number(currentReservation.price))
                          .replace(/٬/g, ",")}
                        <span className="text-xs sm:text-sm mr-1">تومان</span>
                      </span>
                      <span className="font-bold text-sm sm:text-base">:قیمت</span>
                      <DollarSign className="w-4 h-4 ml-2" />
                    </div>
                    <div className="flex items-center justify-end space-x-2">
                      {currentReservation.has_voucher ? (
                        <CheckCircle className="w-4 h-4 ml-2" />
                      ) : (
                        <X className="w-4 h-4 ml-2" />
                      )}
                      <span className="text-sm sm:text-base">{currentReservation.has_voucher ? "بله" : "خیر"}</span>
                      <span className="font-bold text-sm sm:text-base">:ژتون</span>
                      <Ticket className="w-4 h-4 ml-2" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6">
                  <h3 className="text-base sm:text-lg font-bold mb-2 text-right">وضعیت سفارش</h3>
                  <div className="flex justify-between items-center bg-gray-100 p-2 sm:p-4 rounded-lg">
                    {[
                      { title: "در انتظار", icon: Clock, color: "text-yellow-500" },
                      { title: "در حال آماده‌سازی", icon: Utensils, color: "text-blue-500" },
                      { title: "آماده تحویل", icon: Package, color: "text-[#5CB85C]" },
                      { title: "تحویل داده شده", icon: CheckCircle, color: "text-gray-400" },
                    ].map((step, index) => {
                      const currentStatusIndex = ["waiting", "preparing", "ready_to_pickup", "picked_up", "not_picked_up"].indexOf(
                        currentReservation.status,
                      )
                      // For not_picked_up we show the same visual step as picked_up (last step)
                      const displayIndex = currentReservation.status === "not_picked_up" ? 3 : currentStatusIndex;
                      return (
                        <div key={index} className="flex flex-col items-center">
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: index * 0.2 }}>
                            <step.icon
                              className={`w-6 h-6 sm:w-8 sm:h-8 ${index <= displayIndex ? 
                                currentReservation.status === "not_picked_up" && index === 3 ? "text-red-500" : step.color 
                                : "text-gray-300"}`}
                            />
                          </motion.div>
                          <span className="text-xs sm:text-sm mt-1">{step.title}</span>
                          {index < 3 && (
                            <div
                              className={`h-1 w-8 sm:w-16 ${index < displayIndex ? 
                                currentReservation.status === "not_picked_up" ? "bg-red-500" : "bg-[#5CB85C]" 
                                : "bg-gray-300"} mx-1 sm:mx-2`}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-4 sm:mt-6" dir="rtl">
                  {currentReservation.status === "ready_to_pickup" ? (
                    <Button
                      onClick={() => handleDeliverOrder("picked_up")}
                      className="w-full bg-[#5CB85C] hover:bg-[#4CA84C] text-white"
                    >
                      <CheckCircle className="w-4 h-4 ml-2" />
                      تحویل داده شد
                    </Button>
                  ) : (
                    <Button
                      disabled
                      variant="secondary"
                      className="w-full"
                    >
                      <Package className="w-4 h-4 ml-2" />
                      {getStatusTitle(currentReservation.status)}
                    </Button>
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {/* Waiting Orders Tab */}
          <Tabs defaultValue="waiting" className="w-full">
            <TabsList
              className="flex justify-between bg-gradient-to-r from-orange-100 to-orange-200 p-1 rounded-xl mb-4 shadow-md"
              dir="rtl"
            >
              <TabsTrigger
                value="waiting"
                className="flex-1 rounded-lg py-2 text-sm font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg flex items-center justify-center"
              >
                <AlertTriangle className="w-4 h-4 md:ml-2" />
                <span className="hidden md:inline">در انتظار</span>
              </TabsTrigger>
              <TabsTrigger
                value="preparing"
                className="flex-1 rounded-lg py-2 text-sm font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-400 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg flex items-center justify-center"
              >
                <Clock className="w-4 h-4 md:ml-2" />
                <span className="hidden md:inline">در حال آماده‌سازی</span>
              </TabsTrigger>
              <TabsTrigger
                value="ready_to_pickup"
                className="flex-1 rounded-lg py-2 text-sm font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-[#F47B20] data-[state=active]:text-white data-[state=active]:shadow-lg flex items-center justify-center"
                dir="rtl"
              >
                <Package className="w-4 h-4 md:ml-2" />
                <span className="hidden md:inline">آماده تحویل</span>
              </TabsTrigger>
              <TabsTrigger
                value="picked_up"
                className="flex-1 rounded-lg py-2 text-sm font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-[#5CB85C] data-[state=active]:text-white data-[state=active]:shadow-lg flex items-center justify-center"
                dir="rtl"
              >
                <CheckCircle className="w-4 h-4 md:ml-2" />
                <span className="hidden md:inline">تحویل داده شده</span>
              </TabsTrigger>
              <TabsTrigger
                value="not_picked_up"
                className="flex-1 rounded-lg py-2 text-sm font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-400 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg flex items-center justify-center"
                dir="rtl"
              >
                <X className="w-4 h-4 md:ml-2" />
                <span className="hidden md:inline">تحویل گرفته نشده</span>
              </TabsTrigger>
            </TabsList>

            {/* Waiting Orders Tab */}
            <TabsContent value="waiting">
              <Card className="border border-gray-300" dir="rtl">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#F47B20] flex items-center">
                    <AlertTriangle className="w-6 h-6 ml-2" />
                    رزروهای در انتظار
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filterReservationsBySearch(waitingOrders).map((order) => (
                    <motion.div
                      key={order.reservation_number}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-lg shadow-lg p-4 mb-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-xl">
                          رزرو{" "}
                          {new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(
                            Number(order.reservation_number),
                          )}
                          #
                        </h3>
                        <Badge className={`${getStatusColor(order.status)} text-white`}>
                          {getStatusTitle(order.status)}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-2 text-sm sm:text-base text-right">
                        دانشجو: {order.student.first_name} {order.student.last_name}
                      </p>
                      <p className="text-gray-600 mb-2 text-sm sm:text-base text-right">غذا: {order.food.name}</p>
                      <p className="text-gray-600 mb-2 text-sm sm:text-base text-right">
                        تاریخ رزرو: {new Intl.DateTimeFormat("fa-IR").format(new Date(order.reserved_date))}
                      </p>
                      <p className="text-gray-600 mb-2 text-sm sm:text-base text-right">
                        زمان تحویل:{" "}
                        {order.time_slot && order.time_slot.start_time
                          ? order.time_slot.end_time.slice(0, 5).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]) + ' - ' + order.time_slot.start_time.slice(0, 5).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])
                          : ''}
                      </p>
                      {order.food.category_name && (
                        <p className="text-gray-600 mb-2 text-sm sm:text-base text-right">دسته‌بندی: {order.food.category_name}</p>
                      )}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-4">
                        <p className="font-bold text-lg text-right">
                          {new Intl.NumberFormat("fa-IR", { useGrouping: true })
                            .format(Number(order.price))
                            .replace(/٬/g, ",")}
                          <span className="text-xs sm:text-sm mr-1">تومان</span>
                        </p>
                        <div className="flex flex-wrap justify-center sm:justify-end gap-2 w-full sm:w-auto">
                          <Button
                            onClick={() => {
                              handleUpdateStatus(Number(order.id), "preparing")
                              printReservationSlip(order)
                            }}
                            className="bg-blue-500 hover:bg-blue-600 w-full sm:w-auto"
                          >
                            <Utensils className="w-4 h-4 ml-2" />
                            <span className="hidden sm:inline">شروع آماده‌سازی</span>
                            <span className="sm:hidden">آماده‌سازی</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCurrentReservation(order)
                              setIsReservationDialogOpen(true)
                            }}
                            className="border-gray-300 flex-1 sm:flex-none"
                          >
                            <Eye className="w-4 h-4 ml-2" />
                            <span className="hidden sm:inline">جزئیات</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => printReservationSlip(order)}
                            className="flex items-center gap-2 flex-1 sm:flex-none"
                          >
                            <Printer className="w-4 h-4" />
                            <span className="hidden sm:inline">چاپ رسید</span>
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {waitingOrders.length > 0 && filterReservationsBySearch(waitingOrders).length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">هیچ سفارشی با این شماره رزرو یافت نشد</p>
                    </div>
                  )}
                  {waitingOrders.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">هیچ سفارش در انتظاری وجود ندارد</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preparing Orders Tab */}
            <TabsContent value="preparing">
              <Card className="border border-gray-300" dir="rtl">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#F47B20] flex items-center">
                    <Clock className="w-6 h-6 ml-2" />
                    رزروهای در حال آماده‌سازی
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filterReservationsBySearch(preparingOrders).map((order) => (
                    <motion.div
                      key={order.reservation_number}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-lg shadow-lg p-4 mb-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-xl">
                          رزرو{" "}
                          {new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(
                            Number(order.reservation_number),
                          )}
                          #
                        </h3>
                        <Badge className={`${getStatusColor(order.status)} text-white`}>
                          {getStatusTitle(order.status)}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-2 text-sm sm:text-base text-right">
                        دانشجو: {order.student.first_name} {order.student.last_name}
                      </p>
                      <p className="text-gray-600 mb-2 text-sm sm:text-base text-right">غذا: {order.food.name}</p>
                      <p className="text-gray-600 mb-2 text-sm sm:text-base text-right">
                        تاریخ رزرو: {new Intl.DateTimeFormat("fa-IR").format(new Date(order.reserved_date))}
                      </p>
                      <p className="text-gray-600 mb-2 text-sm sm:text-base text-right">
                        زمان تحویل:{" "}
                        {order.time_slot && order.time_slot.start_time
                          ? order.time_slot.start_time.slice(0, 5).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]) + ' - ' + order.time_slot.end_time.slice(0, 5).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])
                          : ''}
                      </p>
                      {order.food.category_name && (
                        <p className="text-gray-600 mb-2 text-sm sm:text-base text-right">دسته‌بندی: {order.food.category_name}</p>
                      )}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-4">
                        <p className="font-bold text-lg text-right">
                          {new Intl.NumberFormat("fa-IR", { useGrouping: true })
                            .format(Number(order.price))
                            .replace(/٬/g, ",")}
                          <span className="text-xs sm:text-sm mr-1">تومان</span>
                        </p>
                        <div className="flex flex-wrap justify-center sm:justify-end gap-2 w-full sm:w-auto">
                          <Button
                            onClick={() => handleUpdateStatus(order.id, "ready_to_pickup")}
                            className="bg-[#5CB85C] hover:bg-[#4CAE4C] w-full sm:w-auto"
                          >
                            <CheckCircle className="w-4 h-4 ml-2" />
                            <span className="hidden sm:inline">آماده تحویل</span>
                            <span className="sm:hidden">آماده تحویل</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCurrentReservation(order)
                              setIsReservationDialogOpen(true)
                            }}
                            className="border-gray-300 flex-1 sm:flex-none"
                          >
                            <Eye className="w-4 h-4 ml-2" />
                            <span className="hidden sm:inline">جزئیات</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => printReservationSlip(order)}
                            className="flex items-center gap-2 flex-1 sm:flex-none"
                          >
                            <Printer className="w-4 h-4" />
                            <span className="hidden sm:inline">چاپ رسید</span>
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {preparingOrders.length > 0 && filterReservationsBySearch(preparingOrders).length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">هیچ سفارشی با این شماره رزرو یافت نشد</p>
                    </div>
                  )}
                  {preparingOrders.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">هیچ سفارش در حال آماده‌سازی وجود ندارد</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Ready to Pickup Orders Tab */}
            <TabsContent value="ready_to_pickup" dir="rtl">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-[#F47B20] flex items-center" dir="rtl">
                    <Package className="w-6 h-6 ml-2" />
                    سفارش‌های آماده تحویل
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filterReservationsBySearch(readyToPickupOrders).map((order) => (
                    <motion.div
                      key={order.reservation_number}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-lg shadow-lg p-4 mb-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
                        <h3 className="font-bold text-lg sm:text-xl text-right">
                          رزرو{" "}
                          {new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(
                            Number(order.reservation_number),
                          )}
                          #
                        </h3>
                        <Badge className="bg-[#F47B20] self-end sm:self-auto">آماده تحویل</Badge>
                      </div>
                      <p className="text-gray-600 mb-2 text-sm sm:text-base text-right">
                        دانشجو: {order.student.first_name} {order.student.last_name}
                      </p>
                      <p className="text-gray-600 mb-2 text-sm sm:text-base text-right">غذا: {order.food.name}</p>
                      <p className="text-gray-600 mb-2 text-sm sm:text-base text-right">
                        زمان تحویل:{" "}
                        {order.time_slot && order.time_slot.start_time
                          ? order.time_slot.end_time.slice(0, 5).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]) + ' - ' + order.time_slot.start_time.slice(0, 5).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])
                          : ''}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-4">
                        <p className="font-bold text-lg text-right">
                          {new Intl.NumberFormat("fa-IR", { useGrouping: true })
                            .format(Number(order.price))
                            .replace(/٬/g, ",")}
                          <span className="text-xs sm:text-sm mr-1">تومان</span>
                        </p>
                        <div className="flex flex-wrap justify-center sm:justify-end gap-2 w-full sm:w-auto">
                          <Button
                            onClick={() => {
                              setCurrentReservation(order)
                              setIsReservationDialogOpen(true)
                            }}
                            className="bg-[#5CB85C] hover:bg-[#4CAE4C] w-full sm:w-auto"
                          >
                            <CheckCircle className="w-4 h-4 ml-2" />
                            <span className="hidden sm:inline">تحویل سفارش</span>
                            <span className="sm:hidden">تحویل</span>
                          </Button>
                          <Button
                            onClick={() => handleDeliverOrder("not_picked_up", order)}
                            className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto"
                          >
                            <X className="w-4 h-4 ml-2" />
                            <span className="hidden sm:inline">تحویل گرفته نشده</span>
                            <span className="sm:hidden">عدم تحویل</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => printReservationSlip(order)}
                            className="flex items-center gap-2 w-full sm:w-auto"
                          >
                            <Printer className="w-4 h-4" />
                            <span className="hidden sm:inline">چاپ رسید</span>
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {readyToPickupOrders.length > 0 && filterReservationsBySearch(readyToPickupOrders).length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">هیچ سفارشی با این شماره رزرو یافت نشد</p>
                    </div>
                  )}
                  {readyToPickupOrders.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">هیچ سفارش آماده تحویلی وجود ندارد</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Picked Up Orders Tab */}
            <TabsContent value="picked_up" dir="rtl">
              <Card dir="rtl">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#F47B20] flex items-center" dir="rtl">
                    <CheckCircle className="w-6 h-6 ml-2" />
                    سفارش‌های تحویل داده شده
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filterReservationsBySearch(pickedUpOrders).map((order) => (
                    <motion.div
                      key={order.reservation_number}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-lg shadow-lg p-4 mb-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
                        <h3 className="font-bold text-lg sm:text-xl text-right">
                          رزرو{" "}
                          {new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(
                            Number(order.reservation_number),
                          )}
                          #
                        </h3>
                        <Badge className="bg-[#5CB85C] self-end sm:self-auto" dir="rtl">تحویل داده شده</Badge>
                      </div>
                      <p className="text-gray-600 mb-2 text-sm sm:text-base text-right">
                        دانشجو: {order.student.first_name} {order.student.last_name}
                      </p>
                      <p className="text-gray-600 mb-2 text-sm sm:text-base text-right">غذا: {order.food.name}</p>
                      <p className="text-gray-600 mb-2 text-sm sm:text-base text-right">
                        زمان تحویل:{" "}
                        {order.time_slot && order.time_slot.start_time
                          ? order.time_slot.end_time.slice(0, 5).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]) + ' - ' + order.time_slot.start_time.slice(0, 5).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])
                          : ''}
                      </p>
                      <p className="font-bold text-lg text-right mt-4">
                        {new Intl.NumberFormat("fa-IR", { useGrouping: true })
                          .format(Number(order.price))
                          .replace(/٬/g, ",")}
                        <span className="text-xs sm:text-sm mr-1">تومان</span>
                      </p>
                    </motion.div>
                  ))}
                  {pickedUpOrders.length > 0 && filterReservationsBySearch(pickedUpOrders).length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">هیچ سفارشی با این شماره رزرو یافت نشد</p>
                    </div>
                  )}
                  {pickedUpOrders.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">هیچ سفارش تحویل داده شده‌ای وجود ندارد</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Not Picked Up Orders Tab */}
            <TabsContent value="not_picked_up">
              <Card className="border border-gray-300" dir="rtl">
                <CardHeader>
                  <CardTitle className="text-2xl text-red-500 flex items-center">
                    <X className="w-6 h-6 ml-2" />
                    رزروهای تحویل گرفته نشده
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filterReservationsBySearch(notPickedUpOrders).map((order) => (
                    <motion.div
                      key={order.reservation_number}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-lg shadow-lg p-3 sm:p-4 mb-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
                        <h3 className="font-bold text-lg sm:text-xl text-right">
                          رزرو{" "}
                          {new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(
                            Number(order.reservation_number),
                          )}
                          #
                        </h3>
                        <Badge className="bg-red-500 text-white self-end sm:self-auto">
                          {getStatusTitle(order.status)}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-2 text-sm sm:text-base text-right">
                        دانشجو: {order.student.first_name} {order.student.last_name}
                      </p>
                      <p className="text-gray-600 mb-2 text-sm sm:text-base text-right">غذا: {order.food.name}</p>
                      <p className="text-gray-600 mb-2 text-sm sm:text-base text-right">
                        تاریخ رزرو: {new Intl.DateTimeFormat("fa-IR").format(new Date(order.reserved_date))}
                      </p>
                      <p className="text-gray-600 mb-2 text-sm sm:text-base text-right">
                        زمان تحویل:{" "}
                        {order.time_slot && order.time_slot.start_time
                          ? order.time_slot.end_time.slice(0, 5).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]) + ' - ' + order.time_slot.start_time.slice(0, 5).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])
                          : ''}
                      </p>
                      {order.food.category_name && (
                        <p className="text-gray-600 mb-2 text-sm sm:text-base text-right">دسته‌بندی: {order.food.category_name}</p>
                      )}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-4">
                        <p className="font-bold text-lg text-right">
                          {new Intl.NumberFormat("fa-IR", { useGrouping: true })
                            .format(Number(order.price))
                            .replace(/٬/g, ",")}
                          <span className="text-xs sm:text-sm mr-1">تومان</span>
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  {notPickedUpOrders.length > 0 && filterReservationsBySearch(notPickedUpOrders).length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">هیچ سفارشی با این شماره رزرو یافت نشد</p>
                    </div>
                  )}
                  {notPickedUpOrders.length === 0 && (
                    <div className="text-center py-16">
                      <X className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">هیچ سفارش تحویل گرفته نشده‌ای وجود ندارد</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Order Details Dialog */}
      <Dialog open={isOrderDetailsDialogOpen} onOpenChange={setIsOrderDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              جزئیات رزرو{" "}
              {new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(
                Number(selectedOrder?.reservation_number ?? 0),
              )}
              #
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">دانشجو:</span>
              <span className="col-span-3">
                {selectedOrder?.student.first_name} {selectedOrder?.student.last_name}
              </span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">وضعیت:</span>
              <span className="col-span-3">{getStatusTitle(selectedOrder?.status ?? "waiting")}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">غذا:</span>
              <span className="col-span-3">{selectedOrder?.food.name}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">تاریخ رزرو:</span>
              <span className="col-span-3">
                {new Intl.DateTimeFormat("fa-IR").format(new Date(selectedOrder?.reserved_date ?? Date.now()))}
              </span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">زمان تحویل:</span>
              <span className="col-span-3">
                {selectedOrder?.time_slot && selectedOrder?.time_slot.start_time
                  ? selectedOrder.time_slot.end_time.slice(0, 5).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]) + ' - ' + selectedOrder.time_slot.start_time.slice(0, 5).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])
                  : ''}
              </span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">قیمت:</span>
              <span className="col-span-3">
                {new Intl.NumberFormat("fa-IR", { useGrouping: true })
                  .format(Number(selectedOrder?.price ?? 0))
                  .replace(/٬/g, ",")}{" "}
                تومان
              </span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">ژتون:</span>
              <div className="col-span-3 flex items-center">
                <span>{selectedOrder?.has_voucher ? "بله" : "خیر"}</span>
                <Ticket className="w-4 h-4 text-gray-500 mr-2" />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">کد تحویل:</span>
              <div className="col-span-3 flex items-center">
                <span className="font-mono text-lg bg-gray-100 px-3 py-1 rounded-md">
                  {selectedOrder ? getDeliveryCode(selectedOrder) : ""}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2"
                  onClick={() => selectedOrder && copyToClipboard(getDeliveryCode(selectedOrder))}
                >
                  {isCopied ? <CheckCheck className="h-4 w-4 text-[#5CB85C]" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
