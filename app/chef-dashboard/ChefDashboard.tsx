'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChefHat, Clock, CheckCircle, AlertTriangle, Utensils, User, LogOut, Eye, Printer } from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'
import api from '@/lib/axios'
import { API_ROUTES, createApiUrl } from '@/lib/api'
import DatePicker from "react-multi-date-picker"
import persian from "react-date-object/calendars/persian"
import persian_fa from "react-date-object/locales/persian_fa"
import { DateObject } from "react-multi-date-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

interface Reservation {
  id: number;
  student: {
    id: number;
    first_name: string;
    last_name: string;
    phone_number: string
  }
  food: {
    id: number;
    name: string;
    decsription: string;
    price: string;
  };
  time_slot: {
    id: number;
    start_time: string;
    end_time: string;
    capacity: number;
  };
  reserved_date: string;
  has_voucher: boolean;
  meal_type: 'lunch' | 'dinner';
  price: string;
  status: 'waiting' | 'preparing' | 'ready_to_pickup' | 'picked_up';
  qr_code: string;
  created_at: string;
  updated_at: string | null;
}

interface User {
  name: string
  role: string
}

const getIranCurrentHour = () => {
  const iranTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Tehran' });
  return new Date(iranTime).getHours(); // Get the hour from Iran's local time
};


export default function ChefDashboard() {
  const [user] = useState<User>({ name: 'رضا آشپز', role: 'chef' })
  const router = useRouter()
  const [orders, setOrders] = useState<Reservation[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedOrder, setSelectedOrder] = useState<Reservation | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  
  const currentHour = getIranCurrentHour();
  const defaultMeal = currentHour < 17 ? 'lunch' : 'dinner';

  const [selectedMeal, setSelectedMeal] = useState<'lunch' | 'dinner'>(defaultMeal);

  const fetchReservations = useCallback(async () => {
    try {
      const formattedDate = new DateObject(selectedDate).format("YYYY-MM-DD")
      const response = await api.get(createApiUrl(API_ROUTES.GET_CHEF_ORDERS), {
        params: { reserved_date: formattedDate, meal_type: selectedMeal }
      })
      console.log(response.data)
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error('خطا در دریافت رزروها');
    }
  }, [selectedDate, selectedMeal])

  useEffect(() => {
    fetchReservations()
    console.log("orders",orders)
  }, [fetchReservations, orders])

  const handleUpdateStatus = async (reservationId: number, newStatus: 'waiting' | 'preparing' | 'ready_to_pickup' | 'picked_up') => {
    try {
      const apiStatus = {
        'waiting': 'waiting',
        'preparing': 'preparing',
        'ready_to_pickup': 'ready_to_pickup',
        'picked_up': 'picked_up'
      }[newStatus];
      
      await api.patch(createApiUrl(API_ROUTES.UPDATE_ORDER_STATUS(String(reservationId))), { status: apiStatus });
      setOrders(orders.map(order => 
        order.id === reservationId ? { ...order, status: newStatus } : order
      ))
      toast.success(`وضعیت رزرو ${reservationId} به ${newStatus} تغییر کرد`)
    } catch (error) {
      console.error('Error updating reservation status:', error);
      toast.error('خطا در به‌روزرسانی وضعیت رزرو');
    }
  }

  const handleLogout = async () => {
    try {
      await api.post(createApiUrl(API_ROUTES.SIGNOUT),{
        refresh_token: localStorage.getItem('refresh_token')
      })
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      toast.success('با موفقیت از حساب کاربری خارج شدید')
      router.push('/')
    } catch (error) {
      console.error('Error logging out:', error)
      toast.error('خطا در خروج از حساب کاربری')
    }
  }


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'در انتظار': return 'bg-yellow-500'
      case 'در حال آماده‌سازی': return 'bg-blue-500'
      case 'آماده تحویل': return 'bg-green-500'
      case 'تحویل داده شده': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getOrdersCount = (status: string) => {
    return orders.filter(order => 
      order.status === status && 
      (selectedDate ? new Date(order.reserved_date).toDateString() === selectedDate.toDateString() : true)
    ).length
  }

  const printReservationSlip = useCallback((order: Reservation) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=600,height=800')
    
    if (!printWindow) {
      toast.error('خطا در باز کردن پنجره چاپ')
      return
    }

    // Generate HTML for the reservation slip
    const slipHtml = `
      <html>
        <head>
          <title>رسید رزرو غذا</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              direction: rtl; 
              text-align: right; 
              max-width: 500px; 
              margin: 0 auto; 
              padding: 20px; 
              line-height: 1.6; 
            }
            .slip-header { 
              background-color: #f4f4f4; 
              padding: 10px; 
              text-align: center; 
              border-bottom: 2px solid #333; 
            }
            .slip-details { 
              margin-top: 20px; 
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
          </style>
        </head>
        <body>
          <div class="slip-header">
            <h1>رسید رزرو غذا</h1>
            <p>سیستم رزرواسیون غذای دانشگاه</p>
          </div>
          <div class="slip-details">
            <div><strong>شماره رزرو:</strong> ${order.id}</div>
            <div><strong>نام دانشجو:</strong> ${order.student.first_name} ${order.student.last_name}</div>
            <div><strong>شماره تماس:</strong> ${order.student.phone_number}</div>
            <div><strong>غذا:</strong> ${order.food.name}</div>
            <div><strong>تاریخ رزرو:</strong> ${order.reserved_date}</div>
            <div><strong>زمان سرو:</strong> ${order.time_slot.start_time} - ${order.time_slot.end_time}</div>
            <div><strong>نوع وعده:</strong> ${order.meal_type === 'lunch' ? 'ناهار' : 'شام'}</div>
            <div><strong>وضعیت:</strong> ${
              order.status === 'waiting' ? 'در انتظار' : 
              order.status === 'preparing' ? 'در حال آماده‌سازی' : 
              order.status === 'ready_to_pickup' ? 'آماده تحویل' : 
              'تحویل شده'
            }</div>
            <div><strong>قیمت:</strong> ${order.price.toLocaleString()} تومان</div>
          </div>
          <div class="slip-footer">
            <p>تاریخ چاپ: ${new Date().toLocaleDateString('fa-IR')}</p>
            <p>سیستم مدیریت رزرو غذای دانشگاه</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-bl from-orange-100 to-red-100 rtl">
      <Toaster position="top-center" />
      <Toaster position="top-center" />
      <header className="sticky top-0 z-50 w-full bg-white shadow-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <ChefHat className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary">سامانه رزرو غذای دانشگاه - آشپزخانه</span>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-avatar.jpg" alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuItem onClick={handleLogout} dir="rtl">
                <LogOut className="ml-2 h-4 w-4" />
                <span>خروج</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="container mx-auto mt-8 px-4 pb-8" dir='rtl'>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-primary mb-2">داشبورد آشپز</h1>
            <p className="text-xl text-gray-600">مدیریت و آماده‌سازی سفارش‌ها</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">در انتظار</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(getOrdersCount('waiting'))}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">در حال آماده‌سازی</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(getOrdersCount('preparing'))}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">آماده تحویل</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(getOrdersCount('ready_to_pickup'))}</div>
              </CardContent>
            </Card>
          </div>

        <div className="flex gap-2 h-[42px] mx-auto" dir='ltr'>
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
            <Select
              value={selectedMeal}
              onValueChange={(value: 'lunch' | 'dinner') => setSelectedMeal(value)}
            >
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

          <Tabs defaultValue="در انتظار" className="w-full mt-5" dir='rtl'>
            <TabsList className="flex justify-between bg-gradient-to-r from-orange-100 to-red-100 p-1 rounded-xl mb-4 shadow-md">
              <TabsTrigger 
                value="در انتظار" 
                className="flex-1 rounded-lg py-2 text-sm font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <AlertTriangle className="w-4 h-4 ml-2" />
                در انتظار
              </TabsTrigger>
              <TabsTrigger 
                value="در حال آماده‌سازی" 
                className="flex-1 rounded-lg py-2 text-sm font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-400 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <Clock className="w-4 h-4 ml-2" />
                در حال آماده‌سازی
              </TabsTrigger>
              <TabsTrigger 
                value="آماده تحویل" 
                className="flex-1 rounded-lg py-2 text-sm font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <CheckCircle className="w-4 h-4 ml-2" />
                آماده تحویل
              </TabsTrigger>
            </TabsList>
            {['در انتظار', 'در حال آماده‌سازی', 'آماده تحویل'].map((status) => (
              <TabsContent key={status} value={status}>
                <Card className="border border-gray-300" dir='rtl'>
                  <CardHeader>
                    <CardTitle className="text-2xl text-primary flex items-center">
                      <ChefHat className="w-6 h-6 ml-2" />
                      رزروهای {status === 'در انتظار' ? 'در انتظار' : status === 'در حال آماده‌سازی' ? 'در حال آماده‌سازی' : 'آماده تحویل'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {orders.filter(order => 
                      (order.status === 'waiting' ? 'در انتظار' : order.status === 'preparing' ? 'در حال آماده‌سازی' : order.status === 'ready_to_pickup' ? 'آماده تحویل' : 'تحویل داده شده') === status
                    ).map((order) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-lg shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out hover:shadow-[0_0_15px_rgba(0,0,0,0.2)] p-4 mb-4 border border-gray-100 flex justify-between items-center"
                      >
                        <div className="flex flex-col">
                          <h3 className="font-bold text-xl">رزرو {new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(order.id)}#</h3>
                          <Badge className={`${getStatusColor(order.status)} text-white px-2 py-1`}>
                            {order.status === 'waiting' ? 'در انتظار' : order.status === 'preparing' ? 'در حال آماده‌سازی' : order.status === 'ready_to_pickup' ? 'آماده تحویل' : 'تحویل داده شده'}
                          </Badge>
                        </div>
                        <div className="mb-2 flex justify-between items-start">
                          <div>
                            <p className="text-gray-600 mb-1">دانشجو: {order.student.first_name} {order.student.last_name}</p>
                            <p className="text-gray-600 mb-2">تاریخ رزرو: {new Intl.DateTimeFormat('fa-IR').format(new Date(order.reserved_date))}</p>
                            <p className="text-gray-600 mb-4">زمان تحویل: {order.time_slot.start_time.slice(0, 5).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])} - {order.time_slot.end_time.slice(0, 5).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])}</p>
                          </div>
                          <div className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">
                            {order.food.name}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          {order.status === 'waiting' && (
                            <Button 
                              onClick={() => handleUpdateStatus(order.id, 'preparing')}
                              className="bg-blue-500 hover:bg-blue-600"
                            >
                              <Utensils className="w-4 h-4 ml-2" />
                              شروع آماده‌سازی
                            </Button>
                          )}
                          {order.status === 'preparing' && (
                            <Button 
                              onClick={() => handleUpdateStatus(order.id, 'ready_to_pickup')}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <CheckCircle className="w-4 h-4 ml-2" />
                              علامت‌گذاری به عنوان آماده
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedOrder(order)
                              setIsDialogOpen(true)
                            }}
                            className="border-gray-300"
                          >
                            <Eye className="w-4 h-4 ml-2" />
                            مشاهده جزئیات
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => printReservationSlip(order)}
                            className="flex items-center gap-2"
                          >
                            <Printer className="w-4 h-4" />
                            چاپ رسید
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" dir='rtl'>
          <DialogHeader>
            <DialogTitle>جزئیات رزرو {new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(selectedOrder?.id ?? 0)}#</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">دانشجو:</span>
              <span className="col-span-3">{selectedOrder?.student.first_name} {selectedOrder?.student.last_name}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">وضعیت:</span>
              <span className="col-span-3">{selectedOrder?.status === 'waiting' ? 'در انتظار' : selectedOrder?.status === 'preparing' ? 'در حال آماده‌سازی' : selectedOrder?.status === 'ready_to_pickup' ? 'آماده تحویل' : 'تحویل داده شده'}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">غذا:</span>
              <span className="col-span-3">{selectedOrder?.food.name}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">تاریخ رزرو:</span>
              <span className="col-span-3">{new Intl.DateTimeFormat('fa-IR').format(new Date(selectedOrder?.reserved_date ?? Date.now()))}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">زمان تحویل:</span>
              <span className="col-span-3">{selectedOrder?.time_slot?.start_time?.slice(0, 5)?.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])} - {selectedOrder?.time_slot?.end_time?.slice(0, 5)?.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">قیمت:</span>
              <span className="col-span-3">{new Intl.NumberFormat('fa-IR', { useGrouping: true }).format(Number(selectedOrder?.price)).replace(/٬/g, ',')} تومان</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">کوپن:</span>
              <span className="col-span-3">{selectedOrder?.has_voucher ? 'بله' : 'خیر'}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
