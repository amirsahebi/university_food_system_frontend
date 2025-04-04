'use client'

import { useState } from 'react'
import { format } from 'date-fns-jalali'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CalendarIcon, Utensils, User, LogOut } from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Food {
  id: string
  name: string
  description: string
  price: number
}

interface MenuItemSpec {
  id: string
  foodId: string
  startTime: string
  endTime: string
  timeSlotCount: number
  timeSlotCapacity: number
  dailyCapacity: number
}

interface DailyMenuItem {
  date: string
  mealType: 'lunch' | 'dinner'
  items: MenuItemSpec[]
}

export default function UserDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedMealType, setSelectedMealType] = useState<'lunch' | 'dinner'>('lunch')
  const [dailyMenu, setDailyMenu] = useState<DailyMenuItem[]>([])
  const [foods, setFoods] = useState<Food[]>([
    { id: '1', name: 'چلو کباب کوبیده', description: 'کباب کوبیده گوشت با برنج ایرانی', price: 120000 },
    { id: '2', name: 'قورمه سبزی', description: 'خورشت سنتی ایرانی با برنج', price: 100000 },
    { id: '3', name: 'جوجه کباب', description: 'جوجه کباب با برنج و گوجه', price: 110000 },
  ])

  const handleReservation = (menuItem: MenuItemSpec) => {
    // Here you would typically make an API call to reserve the meal
    // For now, we'll just show a success message
    toast.success(`رزرو ${foods.find(f => f.id === menuItem.foodId)?.name} با موفقیت انجام شد`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-bl from-orange-100 to-red-100 rtl p-8">
      <Toaster position="top-center" />
      <header className="sticky top-0 z-50 w-full bg-white shadow-md mb-8">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <Utensils className="h-8 w-8 text-orange-500" />
            <span className="text-xl font-bold text-orange-500">سامانه رزرو غذای دانشگاه - پنل دانشجو</span>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-avatar.jpg" alt="دانشجو" />
                  <AvatarFallback>دانشجو</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuItem>
                <User className="ml-2 h-4 w-4" />
                <span>پروفایل</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.success('با موفقیت خارج شدید')}>
                <LogOut className="ml-2 h-4 w-4" />
                <span>خروج</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-orange-500 mb-2">پنل دانشجو</h1>
          <p className="text-xl text-gray-600">رزرو غذا و مشاهده منوی روزانه</p>
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle>منوی روزانه و رزرو غذا</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4 mb-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[280px] justify-start text-right font-normal">
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'yyyy/MM/dd') : <span>انتخاب تاریخ</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Select value={selectedMealType} onValueChange={(value: 'lunch' | 'dinner') => setSelectedMealType(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="انتخاب نوع وعده" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lunch">ناهار</SelectItem>
                  <SelectItem value="dinner">شام</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>غذا</TableHead>
                  <TableHead>توضیحات</TableHead>
                  <TableHead>قیمت</TableHead>
                  <TableHead>زمان سرو</TableHead>
                  <TableHead>عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyMenu
                  .filter(item => item.date === format(selectedDate!, 'yyyy/MM/dd') && item.mealType === selectedMealType)
                  .flatMap(item => item.items)
                  .map((menuItem, index) => {
                    const food = foods.find(f => f.id === menuItem.foodId)
                    return (
                      <TableRow key={index}>
                        <TableCell>{food?.name}</TableCell>
                        <TableCell>{food?.description}</TableCell>
                        <TableCell>{food?.price} تومان</TableCell>
                        <TableCell>{menuItem.startTime} - {menuItem.endTime}</TableCell>
                        <TableCell>
                          <Button onClick={() => handleReservation(menuItem)}>رزرو</Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

