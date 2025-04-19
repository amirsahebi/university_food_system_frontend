"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { format as formatGregorian } from "date-fns"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Utensils, DollarSign, User, LogOut, Calendar, Clipboard, BarChart2, Plus, Edit, Trash } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast, Toaster } from "react-hot-toast"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import api from "@/lib/axios"
import { API_ROUTES, createApiUrl } from "@/lib/api"
import DatePicker from "react-multi-date-picker"
import persian from "react-date-object/calendars/persian"
import persian_fa from "react-date-object/locales/persian_fa"
import { DateObject } from "react-multi-date-picker"
import { useRouter } from "next/navigation"

// Import the CategoryManagement component
import { CategoryManagement } from "@/components/admin/category-management"

// Interfaces
interface Food {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  category_id?: number | null
  category_name?: string | null
  created_at?: string
  updated_at?: string
}

interface MenuItemSpec {
  id: string
  food: {
    id: number
    name: string
    price: number
    image_url: string | null
    category_id?: number | null
    category_name?: string | null
  }
  start_time: string
  end_time: string
  time_slot_count: number
  time_slot_capacity: number
  daily_capacity: number
  is_available: boolean
}

interface TemplateMenuItem {
  day: string
  meal_type: "lunch" | "dinner"
  items: MenuItemSpec[]
}

interface DailyMenuItem {
  date: string
  meal_type: "lunch" | "dinner"
  items: MenuItemSpec[]
}

interface ReservationLog {
  id: string
  user: string
  food: string
  date: string
  status: string
}

interface DailyOrderCount {
  date: string
  count: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("food")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogContent, setDialogContent] = useState<React.ReactNode | null>(null)
  const [foods, setFoods] = useState<Food[]>([])
  const [templateMenu, setTemplateMenu] = useState<TemplateMenuItem[] | null>([])
  const [dailyMenu, setDailyMenu] = useState<DailyMenuItem | null>(null)
  const [voucherPrice, setVoucherPrice] = useState(0)
  const [reservationLogs, setReservationLogs] = useState<ReservationLog[]>([])
  const [selectedDay, setSelectedDay] = useState<string>("")
  const [selectedMeal_type, setSelectedMeal_type] = useState<"lunch" | "dinner">("lunch")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [dailyOrderCounts, setDailyOrderCounts] = useState<DailyOrderCount[]>([])
  // Add state for categories
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])

  const fetchFoods = useCallback(async () => {
    try {
      const response = await api.get(createApiUrl(API_ROUTES.GET_FOODS))
      setFoods(response.data)
    } catch (error) {
      console.error("Error fetching foods:", error)
    }
  }, [])

  const fetchTemplateMenu = useCallback(async () => {
    try {
      const response = await api.get(createApiUrl(API_ROUTES.GET_TEMPLATE_MENU))
      setTemplateMenu(response.data)
    } catch (error) {
      console.error("Error fetching template menu:", error)
      setTemplateMenu(null)
    }
  }, [])

  const fetchDailyMenu = useCallback(async () => {
    if (!selectedDate || !selectedMeal_type) {
      toast.error("لطفاً تاریخ و نوع وعده را انتخاب کنید")
      return
    }
    try {
      const response = await api.get(createApiUrl(API_ROUTES.GET_DAILY_MENU), {
        params: {
          date: formatGregorian(selectedDate, "yyyy-MM-dd"),
          meal_type: selectedMeal_type,
        },
      })
      setDailyMenu(response.data)
    } catch (error) {
      console.error("Error fetching daily menu:", error)
      setDailyMenu(null)
    }
  }, [selectedDate, selectedMeal_type])

  const fetchVoucherPrice = useCallback(async () => {
    try {
      const response = await api.get(createApiUrl(API_ROUTES.GET_VOUCHER_PRICE))
      setVoucherPrice(response.data.price)
    } catch (error) {
      console.error("Error fetching voucher price:", error)
    }
  }, [])

  const fetchReservationLogs = useCallback(async () => {
    try {
      const response = await api.get(createApiUrl(API_ROUTES.GET_RESERVATION_LOGS))
      setReservationLogs(response.data)
    } catch (error) {
      console.error("Error fetching reservation logs:", error)
      toast.error("خطا در دریافت گزارش رزروها")
    }
  }, [])

  const fetchDailyOrderCounts = useCallback(async () => {
    try {
      const response = await api.get(createApiUrl(API_ROUTES.GET_DAILY_ORDER_COUNTS))
      setDailyOrderCounts(response.data)
    } catch (error) {
      console.error("Error fetching daily order counts:", error)
      toast.error("خطا در دریافت آمار سفارشات روزانه")
    }
  }, [])

  // Add fetchCategories function
  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get(createApiUrl(API_ROUTES.GET_FOOD_CATEGORIES))
      setCategories(response.data)
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }, [])

  useEffect(() => {
    fetchFoods()
    fetchTemplateMenu()
    fetchDailyMenu()
    fetchVoucherPrice()
    fetchReservationLogs()
    fetchDailyOrderCounts()
    fetchCategories()
  }, [
    selectedDate,
    selectedMeal_type,
    fetchTemplateMenu,
    fetchDailyMenu,
    fetchFoods,
    fetchVoucherPrice,
    fetchReservationLogs,
    fetchDailyOrderCounts,
    fetchCategories,
  ])

  const openDialog = useCallback((content: React.ReactNode) => {
    setDialogContent(content)
    setIsDialogOpen(true)
  }, [])

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false)
    setDialogContent(null)
  }, [])

  // Modify the handleAddFood function to include category selection
  const handleAddFood = useCallback(() => {
    openDialog(
      <div className="space-y-4" dir="rtl">
        <h2 className="text-lg font-bold">افزودن غذای جدید</h2>
        <div className="space-y-2">
          <Label htmlFor="food">نام غذا</Label>
          <Input id="food" placeholder="نام غذا را وارد کنید" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="foodDescription">توضیحات</Label>
          <Input id="foodDescription" placeholder="توضیحات غذا را وارد کنید" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="foodCategory">دسته‌بندی</Label>
          <div className="flex">
            <select id="foodCategory" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              <option value="">انتخاب دسته‌بندی</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id.toString()}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="foodPrice">قیمت (تومان)</Label>
          <Input id="foodPrice" type="number" placeholder="قیمت را وارد کنید" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="foodImage">تصویر غذا</Label>
          <Input id="foodImage" type="file" accept="image/*" />
        </div>
        <Button
          onClick={async () => {
            const name = (document.getElementById("food") as HTMLInputElement).value
            const description = (document.getElementById("foodDescription") as HTMLInputElement).value
            // Get the category directly from the HTML select element
            const categorySelect = document.getElementById("foodCategory") as HTMLSelectElement
            const category = categorySelect?.value || ''
            const price = Number.parseInt((document.getElementById("foodPrice") as HTMLInputElement).value)
            const imageFile = (document.getElementById("foodImage") as HTMLInputElement).files?.[0]
            
            // Debug log
            console.log('Selected category:', category)

            if (!name || !description || !price || !imageFile || !category) {
              toast.error("لطفاً تمام فیلدها را پر کنید")
              return
            }

            const formData = new FormData()
            formData.append("name", name)
            formData.append("description", description)
            formData.append("price", price.toString())
            formData.append("image", imageFile)
            // Try multiple possible field names to ensure one works
            if (category) {
              formData.append("category_id", category)
              formData.append("category", category)
            }
            
            // Debug log the form data
            console.log('Form data being sent:')
            for (const pair of formData.entries()) {
              console.log(pair[0] + ': ' + pair[1])
            }

            try {
              await api.post(createApiUrl(API_ROUTES.ADD_FOOD), formData, {
                headers: { "Content-Type": "multipart/form-data" },
              })
              await fetchFoods()
              closeDialog()
              toast.success("غذای جدید با موفقیت اضافه شد")
            } catch (error) {
              console.error("Error adding food:", error)
              toast.error("خطا در افزودن غذای جدید")
            }
          }}
          className="w-full bg-[#F47B20] hover:bg-[#E06A10]"
        >
          <Plus className="w-4 h-4 mr-2" />
          افزودن غذا
        </Button>
      </div>,
    )
  }, [openDialog, closeDialog, fetchFoods, categories])

  // Modify the handleEditFood function to include category selection
  const handleEditFood = useCallback(
    (food: Food) => {
      openDialog(
        <div className="space-y-4" dir="rtl">
          <h2 className="text-lg font-bold">ویرایش غذا</h2>
          <Label htmlFor="food">نام غذا</Label>
          <Input id="food" defaultValue={food.name} />
          <Label htmlFor="foodDescription">توضیحات</Label>
          <Input id="foodDescription" defaultValue={food.description} />
          <div className="space-y-2">
            <Label htmlFor="foodCategory">دسته‌بندی</Label>
            <div className="flex">
              <select id="foodCategory" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" defaultValue={food.category_id?.toString() || ""}>
                <option value="">انتخاب دسته‌بندی</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id.toString()}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Label htmlFor="foodPrice">قیمت (تومان)</Label>
          <Input id="foodPrice" type="number" defaultValue={food.price} />
          <Label htmlFor="foodImage">تصویر غذا</Label>
          <Input id="foodImage" type="file" accept="image/*" />
          <div className="flex justify-center mb-4">
            <div className="relative h-24 w-24">
              <Image
                src={food.image_url || "/placeholder.svg"}
                alt={food.name}
                fill
                className="object-contain rounded-md"
              />
            </div>
          </div>
          <Button
            onClick={async () => {
              const foodElement = document.getElementById("food") as HTMLInputElement;
              const descriptionElement = document.getElementById("foodDescription") as HTMLInputElement;
              const categoryElement = document.getElementById("foodCategory") as HTMLSelectElement;
              const priceElement = document.getElementById("foodPrice") as HTMLInputElement;
              const imageElement = document.getElementById("foodImage") as HTMLInputElement;
              
              if (!foodElement || !descriptionElement || !priceElement) {
                toast.error("خطا در دریافت مقادیر فرم");
                return;
              }
              
              const name = foodElement.value;
              const description = descriptionElement.value;
              const category = categoryElement?.value;
              const price = Number.parseInt(priceElement.value);
              const imageFile = imageElement?.files?.[0]
              
              // Debug log
              console.log('Edit Food - Selected category:', category)

              if (!name || !description || !price) {
                toast.error("لطفاً تمام فیلدها را پر کنید")
                return
              }

              const formData = new FormData()
              formData.append("name", name)
              formData.append("description", description)
              formData.append("price", price.toString())
              // Try multiple possible field names to ensure one works
              if (category) {
                formData.append("category_id", category)
                formData.append("category", category)
              }
              
              // Debug log the form data
              console.log('Edit Food - Form data being sent:')
              for (const pair of formData.entries()) {
                console.log(pair[0] + ': ' + pair[1])
              }
              if (imageFile) {
                formData.append("image", imageFile)
              }

              try {
                await api.put(createApiUrl(API_ROUTES.UPDATE_FOOD(food.id)), formData, {
                  headers: { "Content-Type": "multipart/form-data" },
                })
                await fetchFoods()
                closeDialog()
                toast.success("تغییرات با موفقیت ذخیره شد")
              } catch (error) {
                console.error("Error updating food:", error)
                toast.error("خطا در به‌روزرسانی غذا")
              }
            }}
            className="w-full bg-[#F47B20] hover:bg-[#E06A10]"
          >
            ذخیره تغییرات
          </Button>
        </div>,
      )
    },
    [openDialog, closeDialog, fetchFoods, categories],
  )

  const handleDeleteFood = useCallback(
    (food: Food) => {
      openDialog(
        <div className="space-y-4" dir="rtl">
          <h2 className="text-lg font-bold">حذف غذا</h2>
          <p className="text-sm text-gray-600">
            آیا مطمئن هستید که می‌خواهید غذای &quot;{food.name}&quot; را حذف کنید؟ این عمل غیرقابل برگشت است.
          </p>
          <div className="flex justify-between space-x-4">
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  await api.delete(createApiUrl(API_ROUTES.DELETE_FOOD(food.id)))
                  await fetchFoods()
                  closeDialog()
                  toast.success("غذا با موفقیت حذف شد")
                } catch (error) {
                  console.error("Error deleting food:", error)
                  toast.error("خطا در حذف غذا")
                }
              }}
              className="w-full"
            >
              بله، حذف شود
            </Button>
            <Button variant="outline" onClick={closeDialog} className="w-full">
              انصراف
            </Button>
          </div>
        </div>,
      )
    },
    [openDialog, closeDialog, fetchFoods],
  )

  const handleAddMenuItem = useCallback(
    (isTemplate: boolean) => {
      if (isTemplate && (!selectedDay || !selectedMeal_type)) {
        toast.error("لطفاً روز و نوع وعده را انتخاب کنید")
        return
      }
      if (!isTemplate && (!selectedDate || !selectedMeal_type)) {
        toast.error("لطفاً تاریخ و نوع وعده را انتخاب کنید")
        return
      }

      openDialog(
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const foodItem = foods.find((food) => food.name === formData.get("food"))
            const food = foodItem?.id as string
            const start_time = formData.get("start_time") as string
            const end_time = formData.get("end_time") as string
            const time_slot_count = formData.get("time_slot_count") as string
            const time_slot_capacity = formData.get("time_slot_capacity") as string
            const daily_capacity = formData.get("daily_capacity") as string

            if (!food || !start_time || !end_time || !time_slot_count || !time_slot_capacity || !daily_capacity) {
              toast.error("لطفاً تمام فیلدها را پر کنید")
              return
            }

            const newItem = {
              food,
              start_time,
              end_time,
              time_slot_count: Number.parseInt(time_slot_count),
              time_slot_capacity: Number.parseInt(time_slot_capacity),
              daily_capacity: Number.parseInt(daily_capacity),
            }

            try {
              if (isTemplate) {
                await api.post(createApiUrl(API_ROUTES.ADD_TEMPLATE_MENU_ITEM), {
                  day: selectedDay,
                  meal_type: selectedMeal_type,
                  items: [newItem],
                })
                await fetchTemplateMenu()
                toast.success("غذا با موفقیت به منوی الگو اضافه شد")
              } else {
                await api.post(createApiUrl(API_ROUTES.ADD_DAILY_MENU_ITEM), {
                  date: formatGregorian(selectedDate!, "yyyy-MM-dd"),
                  meal_type: selectedMeal_type,
                  items: [newItem],
                })
                await fetchDailyMenu()
                toast.success("غذا با موفقیت به منوی روزانه اضافه شد")
              }
              closeDialog()
            } catch (error) {
              console.error("Error adding menu item:", error)
              toast.error("خطا در افزودن غذا به منو")
            }
          }}
          className="space-y-4"
          dir="rtl"
        >
          <h2 className="text-lg font-bold">افزودن غذا به منو</h2>
          <Label htmlFor="food">غذا</Label>
          <Select name="food" required>
            <SelectTrigger id="food">
              <SelectValue placeholder="انتخاب غذا" />
            </SelectTrigger>
            <SelectContent>
              {foods.map((food) => (
                <SelectItem key={food.id} value={food.name}>
                  {food.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label htmlFor="start_time">زمان شروع</Label>
          <Input id="start_time" name="start_time" type="time" required />
          <Label htmlFor="end_time">زمان پایان</Label>
          <Input id="end_time" name="end_time" type="time" required />
          <Label htmlFor="time_slot_count">تعداد بازه‌های زمانی</Label>
          <Input id="time_slot_count" name="time_slot_count" type="number" required min="1" />
          <Label htmlFor="time_slot_capacity">ظرفیت هر بازه زمانی</Label>
          <Input id="time_slot_capacity" name="time_slot_capacity" type="number" required min="1" />
          <Label htmlFor="daily_capacity">ظرفیت روزانه</Label>
          <Input id="daily_capacity" name="daily_capacity" type="number" required min="1" />
          <Button type="submit" className="w-full bg-[#F47B20] hover:bg-[#E06A10]">
            افزودن غذا به منو
          </Button>
        </form>,
      )
    },
    [selectedDay, selectedMeal_type, selectedDate, foods, openDialog, closeDialog, fetchTemplateMenu, fetchDailyMenu],
  )

  const handleUseTemplateForDaily = useCallback(async () => {
    if (!selectedDate || !selectedMeal_type) {
      toast.error("لطفاً تاریخ و نوع وعده را انتخاب کنید")
      return
    }

    const dayOfWeek = new DateObject(selectedDate).format("dddd")

    try {
      await api.post(createApiUrl(API_ROUTES.USE_TEMPLATE_FOR_DAILY), {
        date: new DateObject(selectedDate).format("YYYY-MM-DD"),
        meal_type: selectedMeal_type,
        day: dayOfWeek,
      })
      await fetchDailyMenu()
      toast.success("منوی الگو با موفقیت به منوی روزانه اضافه شد")
    } catch (error) {
      console.error("Error using template for daily menu:", error)
      toast.error("خطا در استفاده از منوی الگو برای منوی روزانه")
    }
  }, [selectedDate, selectedMeal_type, fetchDailyMenu])

  const handleEditMenuItem = useCallback(
    (item: MenuItemSpec, isTemplate: boolean) => {
      openDialog(
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const foodItem = foods.find((food) => food.name === formData.get("food"))
            const food = foodItem?.id as string
            const start_time = formData.get("start_time") as string
            const end_time = formData.get("end_time") as string
            const time_slot_count = formData.get("time_slot_count") as string
            const time_slot_capacity = formData.get("time_slot_capacity") as string
            const daily_capacity = formData.get("daily_capacity") as string
            const foodCategory = formData.get("foodCategory")?.toString()

            if (!food || !start_time || !end_time || !time_slot_count || !time_slot_capacity || !daily_capacity) {
              toast.error("لطفاً تمام فیلدها را پر کنید")
              return
            }

            const updatedItem = {
              ...item,
              food,
              start_time,
              end_time,
              time_slot_count: Number.parseInt(time_slot_count),
              time_slot_capacity: Number.parseInt(time_slot_capacity),
              daily_capacity: Number.parseInt(daily_capacity),
              food_category_id: foodCategory ? Number(foodCategory) : null,
            }

            try {
              if (isTemplate) {
                await api.put(createApiUrl(API_ROUTES.UPDATE_TEMPLATE_MENU_ITEM(item.id)), updatedItem)
                await fetchTemplateMenu()
                toast.success("غذای منوی الگو با موفقیت ویرایش شد")
              } else {
                await api.put(createApiUrl(API_ROUTES.UPDATE_DAILY_MENU_ITEM(item.id)), updatedItem)
                await fetchDailyMenu()
                toast.success("غذای منوی روزانه با موفقیت ویرایش شد")
              }
              closeDialog()
            } catch (error) {
              console.error("Error updating menu item:", error)
              toast.error("خطا در به‌روزرسانی غذای منو")
            }
          }}
          className="space-y-4"
          dir="rtl"
        >
          <h2 className="text-lg font-bold">ویرایش غذای منو</h2>
          <Label htmlFor="food">غذا</Label>
          <Select name="food" defaultValue={item.food?.name} required>
            <SelectTrigger id="food">
              <SelectValue placeholder="انتخاب غذا" />
            </SelectTrigger>
            <SelectContent>
              {foods.map((food) => (
                <SelectItem key={food.id} value={food.name}>
                  {food.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label htmlFor="foodCategory">دسته‌بندی</Label>
          <Select name="foodCategory" defaultValue={item.food.category_id?.toString()}>
            <SelectTrigger>
              <SelectValue placeholder="انتخاب دسته‌بندی" />
            </SelectTrigger>
            <SelectContent dir="rtl">
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label htmlFor="start_time">زمان شروع</Label>
          <Input id="start_time" name="start_time" type="time" defaultValue={item.start_time} required />
          <Label htmlFor="end_time">زمان پایان</Label>
          <Input id="end_time" name="end_time" type="time" defaultValue={item.end_time} required />
          <Label htmlFor="time_slot_count">تعداد بازه‌های زمانی</Label>
          <Input
            id="time_slot_count"
            name="time_slot_count"
            type="number"
            defaultValue={item.time_slot_count}
            required
            min="1"
          />
          <Label htmlFor="time_slot_capacity">ظرفیت هر بازه زمانی</Label>
          <Input
            id="time_slot_capacity"
            name="time_slot_capacity"
            type="number"
            defaultValue={item.time_slot_capacity}
            required
            min="1"
          />
          <Label htmlFor="daily_capacity">ظرفیت روزانه</Label>
          <Input
            id="daily_capacity"
            name="daily_capacity"
            type="number"
            defaultValue={item.daily_capacity}
            required
            min="1"
          />
          <Button type="submit" className="w-full bg-[#F47B20] hover:bg-[#E06A10]">
            ذخیره تغییرات
          </Button>
        </form>,
      )
    },
    [foods, categories, openDialog, closeDialog, fetchTemplateMenu, fetchDailyMenu]
  )

  const handleDeleteMenuItem = useCallback(
    async (itemId: string, isTemplate: boolean) => {
      try {
        if (isTemplate) {
          await api.delete(createApiUrl(API_ROUTES.DELETE_TEMPLATE_MENU_ITEM(itemId)))
          await fetchTemplateMenu()
          toast.success("غذا از منوی الگو حذف شد")
        } else {
          await api.delete(createApiUrl(API_ROUTES.DELETE_DAILY_MENU_ITEM(itemId)))
          await fetchDailyMenu()
          toast.success("غذا از منوی روزانه حذف شد")
        }
      } catch (error) {
        console.error("Error deleting menu item:", error)
        toast.error("خطا در حذف غذا از منو")
      }
    },
    [fetchTemplateMenu, fetchDailyMenu],
  )

  const handleUpdateVoucherPrice = useCallback(() => {
    openDialog(
      <div className="space-y-4" dir="rtl">
        <h2 className="text-lg font-bold">به‌روزرسانی قیمت ژتون</h2>
        <Label htmlFor="voucherPrice">قیمت جدید ژتون (تومان)</Label>
        <Input id="voucherPrice" type="number" defaultValue={voucherPrice} />
        <Button
          onClick={async () => {
            const newPrice = Number.parseInt((document.getElementById("voucherPrice") as HTMLInputElement).value)
            if (isNaN(newPrice) || newPrice <= 0) {
              toast.error("لطفاً یک قیمت معتبر وارد کنید")
              return
            }
            try {
              await api.put(createApiUrl(API_ROUTES.UPDATE_VOUCHER_PRICE), { price: newPrice })
              setVoucherPrice(newPrice)
              closeDialog()
              toast.success("قیمت ژتون با موفقیت به‌روزرسانی شد")
            } catch (error) {
              console.error("Error updating voucher price:", error)
              toast.error("خطا در به‌روزرسانی قیمت ژتون")
            }
          }}
          className="w-full bg-[#F47B20] hover:bg-[#E06A10]"
        >
          به‌روزرسانی قیمت
        </Button>
      </div>,
    )
  }, [voucherPrice, openDialog, closeDialog])

  const handleToggleAvailability = useCallback(
    async (itemId: string, is_available: boolean) => {
      try {
        await api.put(createApiUrl(API_ROUTES.TOGGLE_DAILY_MENU_ITEM_AVAILABILITY(itemId)), { is_available })
        await fetchDailyMenu()
        toast.success(`غذا ${is_available ? "فعال" : "غیرفعال"} شد`)
      } catch (error) {
        console.error("Error toggling menu item availability:", error)
        toast.error("خطا در تغییر وضعیت دسترسی غذا")
      }
    },
    [fetchDailyMenu],
  )

  const handleDateChange = useCallback((date: DateObject | DateObject[] | null) => {
    if (date instanceof DateObject) {
      const gregorianDate = date.convert(persian, persian_fa).toDate()
      setSelectedDate(gregorianDate)
    } else {
      setSelectedDate(undefined)
    }
  }, [])

  const handleLogout = useCallback(async () => {
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
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-bl from-orange-100 to-red-100 rtl p-8">
      <Toaster position="top-center" />
      <header className="sticky top-0 z-50 w-full bg-white shadow-md mb-8">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center">
            <div className="relative h-12 w-12 mr-3 transition-transform duration-300 hover:scale-110">
              <Image
                src="/images/javanfoods_logo.png"
                alt="رستوران جوان"
                fill
                className="object-contain drop-shadow-md"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-600">رستوران جوان</span>
              <span className="text-xl font-bold text-[#F47B20]">سامانه رزرو غذای دانشگاه - پنل مدیریت</span>
            </div>
          </Link>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder-avatar.jpg" alt="مدیر سیستم" />
                        <AvatarFallback>مدیر</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">مدیر سیستم</p>
                        <p className="text-xs leading-none text-muted-foreground">admin@example.com</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
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
              </TooltipTrigger>
              <TooltipContent>
                <p>پروفایل کاربری</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-[#F47B20] mb-2">پنل مدیریت</h1>
          <p className="text-xl text-gray-600">مدیریت غذاها، منوها، ژتون‌ها و گزارش‌ها</p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Add a new tab for categories in the TabsList */}
          <TabsList className="grid w-full grid-cols-6 gap-4 mb-8">
            <TabsTrigger value="food" className="flex items-center justify-center space-x-2">
              <Utensils className="w-5 h-5" />
              <span>مدیریت غذاها</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center justify-center space-x-2">
              <Utensils className="w-5 h-5" />
              <span>دسته‌بندی‌ها</span>
            </TabsTrigger>
            <TabsTrigger value="template-menu" className="flex items-center justify-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>منوی الگو</span>
            </TabsTrigger>
            <TabsTrigger value="daily-menu" className="flex items-center justify-center space-x-2">
              <Clipboard className="w-5 h-5" />
              <span>منوی روزانه</span>
            </TabsTrigger>
            <TabsTrigger value="voucher-price" className="flex items-center justify-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>قیمت ژتون</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center justify-center space-x-2">
              <BarChart2 className="w-5 h-5" />
              <span>آمار و گزارشات</span>
            </TabsTrigger>
          </TabsList>

          {/* Add a new TabsContent for categories */}
          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>مدیریت دسته‌بندی‌های غذا</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="food">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>مدیریت غذاها</span>
                  <Button onClick={handleAddFood} className="bg-[#F47B20] hover:bg-[#E06A10]">
                    <Plus className="w-4 h-4 mr-2" /> افزودن غذا
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  {/* Modify the food table to include category */}
                  <TableHeader>
                    <TableRow>
                      <TableHead>تصویر</TableHead>
                      <TableHead>نام غذا</TableHead>
                      <TableHead>دسته‌بندی</TableHead>
                      <TableHead>توضیحات</TableHead>
                      <TableHead>قیمت (تومان)</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {foods.map((food) => (
                      <TableRow key={food.id}>
                        <TableCell>
                          <div className="relative h-12 w-12">
                            <Image
                              src={food.image_url || "/placeholder.svg"}
                              alt={food.name}
                              fill
                              className="object-contain rounded-md"
                            />
                          </div>
                        </TableCell>
                        <TableCell>{food.name}</TableCell>
                        <TableCell>{food.category_name || "-"}</TableCell>
                        <TableCell>{food.description}</TableCell>
                        <TableCell>{food.price.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditFood(food)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteFood(food)}>
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="template-menu">
            <Card>
              <CardHeader>
                <CardTitle dir="rtl">مدیریت منوی الگو</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4 mb-4">
                  <Select value={selectedDay} onValueChange={setSelectedDay}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="انتخاب روز هفته" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        { en: "Saturday", fa: "شنبه" },
                        { en: "Sunday", fa: "یکشنبه" },
                        { en: "Monday", fa: "دوشنبه" },
                        { en: "Tuesday", fa: "سه‌شنبه" },
                        { en: "Wednesday", fa: "چهارشنبه" },
                        { en: "Thursday", fa: "پنج‌شنبه" },
                        { en: "Friday", fa: "جمعه" },
                      ].map((day) => (
                        <SelectItem key={day.en} value={day.en}>
                          {day.fa}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedMeal_type}
                    onValueChange={(value: "lunch" | "dinner") => setSelectedMeal_type(value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="انتخاب نوع وعده" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lunch">ناهار</SelectItem>
                      <SelectItem value="dinner">شام</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => handleAddMenuItem(true)} className="bg-[#F47B20] hover:bg-[#E06A10]">
                    افزودن غذا به منو
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>غذاها</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templateMenu
                      ?.filter((item) => item.day === selectedDay && item.meal_type === selectedMeal_type)
                      .map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {item.items.map((menuItem, itemIndex) => (
                              <div key={itemIndex} className="mb-2">
                                <span>{menuItem.food?.name}</span>
                                <br />
                                <small>
                                  {menuItem.start_time} - {menuItem.end_time}, ظرفیت: {menuItem.daily_capacity}
                                </small>
                              </div>
                            ))}
                          </TableCell>
                          <TableCell>
                            {item.items.map((menuItem, itemIndex) => (
                              <div key={itemIndex} className="flex space-x-2 mb-2">
                                <Button variant="outline" size="sm" onClick={() => handleEditMenuItem(menuItem, true)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteMenuItem(menuItem.id, true)}
                                >
                                  <Trash className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="daily-menu">
            <Card>
              <CardHeader>
                <CardTitle dir="rtl">مدیریت منوی روزانه</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4 mb-4">
                  <DatePicker
                    value={selectedDate}
                    onChange={handleDateChange}
                    calendar={persian}
                    locale={persian_fa}
                    calendarPosition="bottom-right"
                    inputClass="w-[180px] px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    containerClassName="w-[180px]"
                    placeholder="انتخاب تاریخ"
                  />
                  <Select
                    value={selectedMeal_type}
                    onValueChange={(value: "lunch" | "dinner") => setSelectedMeal_type(value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="انتخاب نوع وعده" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lunch">ناهار</SelectItem>
                      <SelectItem value="dinner">شام</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => handleAddMenuItem(false)} className="bg-[#F47B20] hover:bg-[#E06A10]">
                    افزودن غذا به منو
                  </Button>
                  <Button onClick={handleUseTemplateForDaily} className="bg-[#F47B20] hover:bg-[#E06A10]">
                    استفاده از منوی الگو
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>غذاها</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyMenu?.items.map((item: MenuItemSpec, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div key={index} className="mb-2">
                            <span>{item.food?.name}</span>
                            <br />
                            <small>
                              {item.start_time} - {item.end_time}, ظرفیت: {item.daily_capacity}
                            </small>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div key={index} className="flex items-center space-x-2 mb-2">
                            <Switch
                              checked={item.is_available}
                              onCheckedChange={(checked) => handleToggleAvailability(item.id, checked)}
                            />
                            <span>{item.is_available ? "فعال" : "غیرفعال"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div key={index} className="flex space-x-2 mb-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditMenuItem(item, false)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteMenuItem(item.id, false)}
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="voucher-price">
            <Card>
              <CardHeader>
                <CardTitle dir="rtl">مدیریت قیمت ژتون</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span>قیمت فعلی ژتون: {voucherPrice.toLocaleString()} تومان</span>
                  <Button onClick={handleUpdateVoucherPrice} className="bg-[#F47B20] hover:bg-[#E06A10]">
                    به‌روزرسانی قیمت
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle dir="rtl">آمار و گزارشات</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="reservation-logs">
                  <TabsList>
                    <TabsTrigger value="reservation-logs">گزارش رزروها</TabsTrigger>
                    <TabsTrigger value="daily-orders">آمار سفارشات روزانه</TabsTrigger>
                  </TabsList>
                  <TabsContent value="reservation-logs">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>شناسه کاربر</TableHead>
                          <TableHead>نام غذا</TableHead>
                          <TableHead>تاریخ</TableHead>
                          <TableHead>وضعیت</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reservationLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>{log.user}</TableCell>
                            <TableCell>{log.food}</TableCell>
                            <TableCell>{log.date}</TableCell>
                            <TableCell>{log.status}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  <TabsContent value="daily-orders">
                    <div className="w-full h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyOrderCounts}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Bar dataKey="count" fill="#F47B20" name="تعداد سفارشات" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          {dialogContent}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
