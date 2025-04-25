"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { format as formatGregorian } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import {
  Utensils,
  DollarSign,
  User,
  LogOut,
  Calendar,
  Clipboard,
  BarChart2,
  Plus,
  Edit,
  Trash,
  Menu,
  Home,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast, Toaster } from "react-hot-toast"
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip as ChartTooltip, Legend } from 'chart.js'
import api from "@/lib/axios"
import { API_ROUTES, createApiUrl } from "@/lib/api"
import DatePicker from "react-multi-date-picker"
import persian from "react-date-object/calendars/persian"
import persian_fa from "react-date-object/locales/persian_fa"
import { DateObject } from "react-multi-date-picker"
import { useRouter } from "next/navigation"
import { AxiosError } from "axios"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

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
  student: string
  food: string
  created_at: string
  status: string
}

interface DailyOrderCount {
  date: string
  order_count: number
  picked_up_count: number
}

interface FoodCategory {
  id: number
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

interface CategoryFormData {
  name: string
  description: string | null
}

// Dashboard Stats Card Component
const StatCard = ({
  icon: Icon,
  title,
  value,
  color,
}: { icon: React.ElementType; title: string; value: string; color: string }) => (
  <Card className="backdrop-blur-md bg-white/80 border-0 shadow-md hover:shadow-lg transition-all duration-300 animate-fade-in">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
)

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
)

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogContent, setDialogContent] = useState<React.ReactNode | null>(null)
  const [foods, setFoods] = useState<Food[]>([])
  const [templateMenu, setTemplateMenu] = useState<TemplateMenuItem | null>(null)
  const [dailyMenu, setDailyMenu] = useState<DailyMenuItem | null>(null)
  const [voucherPrice, setVoucherPrice] = useState(0)
  const [reservationLogs, setReservationLogs] = useState<ReservationLog[]>([])
  const [selectedDay, setSelectedDay] = useState<string>("")
  const [selectedMeal_type, setSelectedMeal_type] = useState<"lunch" | "dinner">("lunch")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [dailyOrderCounts, setDailyOrderCounts] = useState<DailyOrderCount[]>([])
  const [categories, setCategories] = useState<FoodCategory[]>([])

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [categoryDeleteDialogOpen, setCategoryDeleteDialogOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<FoodCategory | null>(null)
  const [categoryFormData, setCategoryFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
  })
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false)

  // Dashboard stats
  const [totalFoods, setTotalFoods] = useState(0)
  const [totalCategories, setTotalCategories] = useState(0)
  const [totalReservations, setTotalReservations] = useState(0)
  const [todayReservations, setTodayReservations] = useState(0)

  const getPast7DaysOrderData = () => {
    const now = new Date()
    const dates = []
    const totalOrders = []
    const pickedUpOrders = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      dates.push(date.toLocaleDateString('fa-IR'))
      
      const dailyData = dailyOrderCounts.find((d: DailyOrderCount) => 
        new Date(d.date).toLocaleDateString('fa-IR') === date.toLocaleDateString('fa-IR'))
      
      totalOrders.push(dailyData?.order_count || 0)
      pickedUpOrders.push(dailyData?.picked_up_count || 0)
    }

    return {
      labels: dates,
      datasets: [
        {
          label: 'تعداد سفارشات کل',
          data: totalOrders,
          fill: false,
          borderColor: '#f97316',
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBackgroundColor: '#f97316',
          pointBorderColor: '#f97316',
          pointHoverBackgroundColor: '#f97316',
          pointHoverBorderColor: '#f97316',
        },
        {
          label: 'تعداد سفارشات تحویل شده',
          data: pickedUpOrders,
          fill: false,
          borderColor: '#10B981',
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBackgroundColor: '#10B981',
          pointBorderColor: '#10B981',
          pointHoverBackgroundColor: '#10B981',
          pointHoverBorderColor: '#10B981',
          borderDash: [5, 5], // Dashed line for picked up orders
        },
      ],
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#4B5563',
          boxWidth: 20,
        },
      },
      title: {
        display: true,
        text: 'تعداد سفارشات و تحویل‌ها در 7 روز گذشته',
        color: '#4B5563',
      },
    },
    scales: {
      x: {
        grid: {
          color: '#E5E7EB',
        },
        ticks: {
          color: '#4B5563',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#E5E7EB',
        },
        ticks: {
          color: '#4B5563',
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  }

  const fetchFoods = useCallback(async () => {
    try {
      const response = await api.get(createApiUrl(API_ROUTES.GET_FOODS))
      setFoods(response.data)
      setTotalFoods(response.data.length)
    } catch (error) {
      console.error("Error fetching foods:", error)
      toast.error("خطا در دریافت لیست غذاها")
    }
  }, [selectedDay, selectedMeal_type])

  const fetchTemplateMenu = useCallback(async () => {
    try {
      if (!selectedDay || !selectedMeal_type) {
        return
      }
      const response = await api.get(createApiUrl(API_ROUTES.GET_TEMPLATE_MENU), {
        params: {
          day: selectedDay,
          meal_type: selectedMeal_type,
        },
      })
      setTemplateMenu(response.data)
    } catch (error) {
      console.error("Error fetching template menu:", error)
      setTemplateMenu(null)
    }
  }, [selectedDay, selectedMeal_type, fetchFoods])

  const fetchDailyMenu = useCallback(async () => {
    if (!selectedDate || !selectedMeal_type) {
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
      setTotalReservations(response.data.length)

      // Calculate today's reservations
      const today = new Date().toISOString().split("T")[0]
      const todayCount = response.data.filter((log: ReservationLog) => log.created_at && log.created_at.includes(today)).length
      setTodayReservations(todayCount)
    } catch (error) {
      console.error("Error fetching reservation logs:", error)
      toast.error("خطا در دریافت گزارش رزروها")
    }
  }, [])

  const fetchDailyOrderCounts = useCallback(async () => {
    try {
      const response = await api.get(createApiUrl(API_ROUTES.GET_DAILY_ORDER_COUNTS))
      console.log(response.data)
      setDailyOrderCounts(response.data)
    } catch (error) {
      console.error("Error fetching daily order counts:", error)
      toast.error("خطا در دریافت آمار سفارشات روزانه")
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get(createApiUrl(API_ROUTES.GET_FOOD_CATEGORIES))
      setCategories(response.data)
      setTotalCategories(response.data.length)
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast.error("خطا در دریافت دسته‌بندی‌ها")
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
    fetchFoods,
    fetchTemplateMenu,
    fetchDailyMenu,
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

  const handleAddCategory = useCallback(() => {
    setCurrentCategory(null)
    setCategoryFormData({ name: "", description: "" })
    setCategoryDialogOpen(true)
  }, [])

  const handleEditCategory = useCallback((category: FoodCategory) => {
    setCurrentCategory(category)
    setCategoryFormData({
      name: category.name,
      description: category.description,
    })
    setCategoryDialogOpen(true)
  }, [])

  const handleDeleteCategory = useCallback((category: FoodCategory) => {
    setCurrentCategory(category)
    setCategoryDeleteDialogOpen(true)
  }, [])

  const handleCategoryInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCategoryFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleCategorySubmit = useCallback(async () => {
    if (!categoryFormData.name.trim()) {
      toast.error("لطفاً نام دسته‌بندی را وارد کنید")
      return
    }

    setIsCategorySubmitting(true)

    try {
      if (currentCategory) {
        await api.put(createApiUrl(API_ROUTES.UPDATE_FOOD_CATEGORY(currentCategory.id.toString())), categoryFormData)
        toast.success("دسته‌بندی با موفقیت به‌روزرسانی شد")
      } else {
        await api.post(createApiUrl(API_ROUTES.ADD_FOOD_CATEGORY), categoryFormData)
        toast.success("دسته‌بندی جدید با موفقیت ایجاد شد")
      }

      setCategoryDialogOpen(false)
      await fetchCategories()
    } catch (error) {
      console.error("Error saving category:", error)
      toast.error(currentCategory ? "خطا در به‌روزرسانی دسته‌بندی" : "خطا در ایجاد دسته‌بندی")
    } finally {
      setIsCategorySubmitting(false)
    }
  }, [categoryFormData, currentCategory, fetchCategories])

  const handleCategoryDelete = useCallback(async () => {
    if (!currentCategory) return

    setIsCategorySubmitting(true)

    try {
      await api.delete(createApiUrl(API_ROUTES.DELETE_FOOD_CATEGORY(currentCategory.id.toString())))
      toast.success("دسته‌بندی با موفقیت حذف شد")
      setCategoryDeleteDialogOpen(false)
      await fetchCategories()
    } catch (error: unknown) {
      const isAxiosError = error instanceof AxiosError
      console.error("Error deleting category:", error)
      if (isAxiosError && error.response?.status === 400) {
        toast.error("این دسته‌بندی به یک یا چند غذا اختصاص داده شده است و قابل حذف نیست")
      } else {
        toast.error("خطا در حذف دسته‌بندی")
      }
    } finally {
      setIsCategorySubmitting(false)
    }
  }, [currentCategory, fetchCategories])

  const handleAddFood = useCallback(() => {
    openDialog(
      <div className="space-y-4" dir="rtl">
        <h2 className="text-lg font-bold">افزودن غذای جدید</h2>
        <div className="space-y-2">
          <Label htmlFor="food">نام غذا</Label>
          <Input id="food" placeholder="نام غذا را وارد کنید" className="form-input-focus" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="foodDescription">توضیحات</Label>
          <Input id="foodDescription" placeholder="توضیحات غذا را وارد کنید" className="form-input-focus" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="foodCategory">دسته‌بندی</Label>
          <div className="flex">
            <select
              id="foodCategory"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 form-input-focus"
            >
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
          <Input id="foodPrice" type="number" placeholder="قیمت را وارد کنید" className="form-input-focus" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="foodImage">تصویر غذا</Label>
          <Input id="foodImage" type="file" accept="image/*" className="form-input-focus" />
        </div>
        <Button
          onClick={async () => {
            const name = (document.getElementById("food") as HTMLInputElement).value
            const description = (document.getElementById("foodDescription") as HTMLInputElement).value
            const categorySelect = document.getElementById("foodCategory") as HTMLSelectElement
            const category = categorySelect?.value || ""
            const price = Number.parseInt((document.getElementById("foodPrice") as HTMLInputElement).value)
            const imageFile = (document.getElementById("foodImage") as HTMLInputElement).files?.[0]

            if (!name || !price) {
              toast.error("لطفاً تمام فیلدها را پر کنید")
              return
            }

            const formData = new FormData()
            formData.append("name", name)
            if (description) {
              formData.append("description", description)
            }
            formData.append("price", price.toString())
            if (imageFile) {
              formData.append("image", imageFile)
            }
            if (category) {
              formData.append("category_id", category)
              formData.append("category", category)
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
          className="w-full bg-[#f97316] hover:bg-orange-600 btn-hover-effect"
        >
          <Plus className="w-4 h-4 mr-2" />
          افزودن غذا
        </Button>
      </div>,
    )
  }, [openDialog, closeDialog, fetchFoods, categories])

  const handleEditFood = useCallback(
    (food: Food) => {
      openDialog(
        <div className="space-y-4" dir="rtl">
          <h2 className="text-lg font-bold">ویرایش غذا</h2>
          <Label htmlFor="food">نام غذا</Label>
          <Input id="food" defaultValue={food.name} className="form-input-focus" />
          <Label htmlFor="foodDescription">توضیحات</Label>
          <Input id="foodDescription" defaultValue={food.description} className="form-input-focus" />
          <div className="space-y-2">
            <Label htmlFor="foodCategory">دسته‌بندی</Label>
            <div className="flex">
              <select
                id="foodCategory"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 form-input-focus"
                defaultValue={food.category_id?.toString() || ""}
              >
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
          <Input
            id="foodPrice"
            type="number"
            defaultValue={food.price}
            className="form-input-focus"
          />
          <Label htmlFor="foodImage">تصویر غذا</Label>
          <Input id="foodImage" type="file" accept="image/*" className="form-input-focus" />
          <div className="flex justify-center mb-4">
            <div className="relative h-24 w-24">
              <Image
                src={food.image_url || "/placeholder.svg?height=96&width=96"}
                alt={food.name}
                fill
                className="object-contain rounded-md"
              />
            </div>
          </div>
          <Button
            onClick={async () => {
              const foodElement = document.getElementById("food") as HTMLInputElement
              const descriptionElement = document.getElementById("foodDescription") as HTMLInputElement
              const categoryElement = document.getElementById("foodCategory") as HTMLSelectElement
              const priceElement = document.getElementById("foodPrice") as HTMLInputElement
              const imageElement = document.getElementById("foodImage") as HTMLInputElement

              if (!foodElement || !descriptionElement || !priceElement) {
                toast.error("خطا در دریافت مقادیر فرم")
                return
              }

              const name = foodElement.value
              const description = descriptionElement.value
              const category = categoryElement?.value
              const price = Number.parseInt(priceElement.value)
              const imageFile = imageElement?.files?.[0]

              if (!name || !price) {
                toast.error("لطفاً تمام فیلدها را پر کنید")
                return
              }

              const formData = new FormData()
              formData.append("name", name)
              if (description) {
                formData.append("description", description)
              }
              formData.append("price", price.toString())
              if (category) {
                formData.append("category_id", category)
                formData.append("category", category)
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
            className="w-full bg-[#f97316] hover:bg-orange-600 btn-hover-effect"
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

          <div className="space-y-2">
            <Label htmlFor="food">غذا</Label>
            <div className="relative">
              <div className="flex">
                <Input
                  id="foodSearch"
                  type="text"
                  placeholder="جستجو و انتخاب غذا..."
                  className="form-input-focus w-full"
                  onClick={() => {
                    const foodList = document.getElementById("foodList")
                    if (foodList) {
                      foodList.classList.remove("hidden")
                    }
                  }}
                  onChange={(e) => {
                    const searchValue = e.target.value.toLowerCase()
                    const foodList = document.getElementById("foodList")
                    if (foodList) {
                      foodList.classList.remove("hidden")
                      const items = foodList.getElementsByTagName("div")
                      let hasVisibleItems = false
                      for (let i = 0; i < items.length; i++) {
                        const foodName = items[i].textContent || ""
                        if (foodName.toLowerCase().includes(searchValue)) {
                          items[i].style.display = ""
                          hasVisibleItems = true
                        } else {
                          items[i].style.display = "none"
                        }
                      }
                      // If no items match the search, show a message
                      const noResults = document.getElementById("noFoodResults")
                      if (noResults) {
                        noResults.style.display = hasVisibleItems ? "none" : "block"
                      }
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding to allow for click on options
                    setTimeout(() => {
                      const foodList = document.getElementById("foodList")
                      if (foodList) {
                        foodList.classList.add("hidden")
                      }
                    }, 200)
                  }}
                />
              </div>
              <div
                id="foodList"
                className="hidden absolute z-50 w-full max-h-48 overflow-y-auto mt-1 rounded-md border border-gray-200 bg-white shadow-lg scrollbar-thin scrollbar-thumb-orange-200 scrollbar-track-transparent"
                style={{ scrollbarWidth: "thin", scrollbarColor: "#fed7aa transparent" }}
              >
                {foods.map((food) => (
                  <div
                    key={food.id}
                    className="p-2 cursor-pointer hover:bg-orange-100 transition-colors flex items-center gap-2"
                    onMouseDown={() => {
                      const hiddenInput = document.getElementById("food") as HTMLInputElement
                      const searchInput = document.getElementById("foodSearch") as HTMLInputElement
                      if (hiddenInput && searchInput) {
                        hiddenInput.value = food.name
                        searchInput.value = food.name
                      }
                      const foodList = document.getElementById("foodList")
                      if (foodList) {
                        foodList.classList.add("hidden")
                      }
                    }}
                  >
                    {food.image_url && (
                      <div className="relative h-8 w-8 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={food.image_url || "/placeholder.svg?height=32&width=32"}
                          alt={food.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <span className="truncate">{food.name}</span>
                  </div>
                ))}
                <div id="noFoodResults" className="p-2 text-gray-500 text-center hidden">
                  هیچ غذایی یافت نشد
                </div>
              </div>
              <input type="hidden" id="food" name="food" required />
            </div>
          </div>
          <Label htmlFor="start_time">زمان شروع</Label>
          <Input
            id="start_time"
            name="start_time"
            type="time"
            required
            className="form-input-focus"
          />
          <Label htmlFor="end_time">زمان پایان</Label>
          <Input
            id="end_time"
            name="end_time"
            type="time"
            required
            className="form-input-focus"
          />
          <Label htmlFor="time_slot_count">تعداد بازه‌های زمانی</Label>
          <Input
            id="time_slot_count"
            name="time_slot_count"
            type="number"
            min={1}
            required
            className="form-input-focus"
          />
          <Label htmlFor="time_slot_capacity">ظرفیت هر بازه زمانی</Label>
          <Input
            id="time_slot_capacity"
            name="time_slot_capacity"
            type="number"
            min={1}
            required
            className="form-input-focus"
          />
          <Label htmlFor="daily_capacity">ظرفیت روزانه</Label>
          <Input
            id="daily_capacity"
            name="daily_capacity"
            type="number"
            min={1}
            required
            className="form-input-focus"
          />
          <Button type="submit" className="w-full bg-[#f97316] hover:bg-orange-600 btn-hover-effect">
            افزودن غذا به منو
          </Button>
        </form>,
      )
    },
    [selectedDay, selectedMeal_type, selectedDate, foods, openDialog, closeDialog, fetchTemplateMenu, fetchDailyMenu],
  )

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

          <div className="space-y-2">
            <Label htmlFor="food">غذا</Label>
            <div className="relative">
              <div className="flex">
                <Input
                  id="foodSearch"
                  type="text"
                  placeholder="جستجو و انتخاب غذا..."
                  defaultValue={item.food?.name}
                  className="form-input-focus w-full"
                  onClick={() => {
                    const foodList = document.getElementById("foodList")
                    if (foodList) {
                      foodList.classList.remove("hidden")
                    }
                  }}
                  onChange={(e) => {
                    const searchValue = e.target.value.toLowerCase()
                    const foodList = document.getElementById("foodList")
                    if (foodList) {
                      foodList.classList.remove("hidden")
                      const items = foodList.getElementsByTagName("div")
                      let hasVisibleItems = false
                      for (let i = 0; i <items.length; i++) {
                        const foodName = items[i].textContent || ""
                        if (foodName.toLowerCase().includes(searchValue)) {
                          items[i].style.display = ""
                          hasVisibleItems = true
                        } else {
                          items[i].style.display = "none"
                        }
                      }
                      // If no items match the search, show a message
                      const noResults = document.getElementById("noFoodResults")
                      if (noResults) {
                        noResults.style.display = hasVisibleItems ? "none" : "block"
                      }
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding to allow for click on options
                    setTimeout(() => {
                      const foodList = document.getElementById("foodList")
                      if (foodList) {
                        foodList.classList.add("hidden")
                      }
                    }, 200)
                  }}
                />
              </div>
              <div
                id="foodList"
                className="hidden absolute z-50 w-full max-h-48 overflow-y-auto mt-1 rounded-md border border-gray-200 bg-white shadow-lg scrollbar-thin scrollbar-thumb-orange-200 scrollbar-track-transparent"
                style={{ scrollbarWidth: "thin", scrollbarColor: "#fed7aa transparent" }}
              >
                {foods.map((food) => (
                  <div
                    key={food.id}
                    className="p-2 cursor-pointer hover:bg-orange-100 transition-colors flex items-center gap-2"
                    onMouseDown={() => {
                      const hiddenInput = document.getElementById("food") as HTMLInputElement
                      const searchInput = document.getElementById("foodSearch") as HTMLInputElement
                      if (hiddenInput && searchInput) {
                        hiddenInput.value = food.name
                        searchInput.value = food.name
                      }
                      const foodList = document.getElementById("foodList")
                      if (foodList) {
                        foodList.classList.add("hidden")
                      }
                    }}
                  >
                    {food.image_url && (
                      <div className="relative h-8 w-8 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={food.image_url || "/placeholder.svg?height=32&width=32"}
                          alt={food.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <span className="truncate">{food.name}</span>
                  </div>
                ))}
                <div id="noFoodResults" className="p-2 text-gray-500 text-center hidden">
                  هیچ غذایی یافت نشد
                </div>
              </div>
              <input type="hidden" id="food" name="food" defaultValue={item.food?.name} required />
            </div>
          </div>
          <Label htmlFor="foodCategory">دسته‌بندی</Label>
          <Select name="foodCategory" defaultValue={item.food.category_id?.toString()}>
            <SelectTrigger className="form-input-focus">
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
          <Input
            id="start_time"
            name="start_time"
            type="time"
            defaultValue={item.start_time}
            required
            className="form-input-focus"
          />
          <Label htmlFor="end_time">زمان پایان</Label>
          <Input
            id="end_time"
            name="end_time"
            type="time"
            defaultValue={item.end_time}
            required
            className="form-input-focus"
          />
          <Label htmlFor="time_slot_count">تعداد بازه‌های زمانی</Label>
          <Input
            id="time_slot_count"
            name="time_slot_count"
            type="number"
            defaultValue={item.time_slot_count}
            min={1}
            required
            className="form-input-focus"
          />
          <Label htmlFor="time_slot_capacity">ظرفیت هر بازه زمانی</Label>
          <Input
            id="time_slot_capacity"
            name="time_slot_capacity"
            type="number"
            defaultValue={item.time_slot_capacity}
            min={1}
            required
            className="form-input-focus"
          />
          <Label htmlFor="daily_capacity">ظرفیت روزانه</Label>
          <Input
            id="daily_capacity"
            name="daily_capacity"
            type="number"
            defaultValue={item.daily_capacity}
            min={1}
            required
            className="form-input-focus"
          />
          <Button type="submit" className="w-full bg-[#f97316] hover:bg-orange-600 btn-hover-effect">
            ذخیره تغییرات
          </Button>
        </form>,
      )
    },
    [foods, categories, openDialog, closeDialog, fetchTemplateMenu, fetchDailyMenu],
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
        <Input
          id="voucherPrice"
          type="number"
          defaultValue={voucherPrice}
          className="form-input-focus"
        />
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
          className="w-full bg-[#f97316] hover:bg-orange-600 btn-hover-effect"
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

  const convertToPersianNumbers = (str: string) => {
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
    return str.replace(/[0-9]/g, (match) => {
      return persianNumbers[parseInt(match)]
    })
  }

  const formatPersianDateTime = (isoDate: string) => {
    const date = new Date(isoDate)
    const persianDate = new DateObject(date)
      .setCalendar(persian)
      .setLocale(persian_fa)
    
    // Format date in Persian
    const persianDateStr = persianDate.format('YYYY/MM/DD')
    // Format time in 24-hour format
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    
    // Convert numbers to Persian
    const persianHours = convertToPersianNumbers(hours)
    const persianMinutes = convertToPersianNumbers(minutes)
    
    return `${convertToPersianNumbers(persianDateStr)} - ${persianHours}:${persianMinutes}`
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-pattern bg-pattern-animate rtl">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden">
          <svg
            className="absolute top-0 right-0 h-full w-full"
            viewBox="0 0 900 600"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g>
              <path
                className="blob-animate-1"
                d="M0 486.7C-52.7 454 -105.4 421.3 -166.8 402.8C-228.3 384.3 -298.5 380 -344.2 344.2C-389.8 308.3 -410.9 241 -430.5 178.3C-450.2 115.7 -468.5 57.9 -486.7 0L0 0Z"
                fill="url(#orange-gradient-1)"
                transform="translate(900, 0)"
              ></path>
            </g>
            <g>
              <path
                className="blob-animate-2"
                d="M0 -486.7C59.2 -472.3 118.5 -457.9 181.4 -437.9C244.3 -417.9 311 -392.4 344.2 -344.2C377.4 -295.9 377.2 -224.9 395.4 -163.8C413.6 -102.6 450.2 -51.3 486.7 0L0 0Z"
                fill="url(#orange-gradient-2)"
                transform="translate(0, 600)"
              ></path>
            </g>
            <defs>
              <linearGradient id="orange-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.3"></stop>
                <stop offset="100%" stopColor="#fdba74" stopOpacity="0.2"></stop>
              </linearGradient>
              <linearGradient id="orange-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fb923c" stopOpacity="0.3"></stop>
                <stop offset="100%" stopColor="#fed7aa" stopOpacity="0.2"></stop>
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#FFF",
            color: "#000",
            borderRadius: "0.75rem",
          },
        }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 shadow-md animate-slide-up"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="mr-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[240px] sm:w-[300px]">
                <div className="flex flex-col h-full py-6">
                  <div className="flex items-center mb-6">
                    <div className="relative h-10 w-10 mr-3">
                      <Image src="/images/javanfoods_logo.png" alt="رستوران جوان" fill className="object-contain" />
                    </div>
                    <span className="text-lg font-bold">رستوران جوان</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <Button
                      variant={activeTab === "dashboard" ? "secondary" : "ghost"}
                      className="justify-start"
                      onClick={() => {
                        setActiveTab("dashboard")
                      }}
                    >
                      <Home className="ml-2 h-4 w-4" />
                      داشبورد
                    </Button>
                    <Button
                      variant={activeTab === "food" ? "secondary" : "ghost"}
                      className="justify-start"
                      onClick={() => {
                        setActiveTab("food")
                      }}
                    >
                      <Utensils className="ml-2 h-4 w-4" />
                      مدیریت غذاها
                    </Button>
                    <Button
                      variant={activeTab === "categories" ? "secondary" : "ghost"}
                      className="justify-start"
                      onClick={() => {
                        setActiveTab("categories")
                      }}
                    >
                      <Clipboard className="ml-2 h-4 w-4" />
                      دسته‌بندی‌ها
                    </Button>
                    <Button
                      variant={activeTab === "template-menu" ? "secondary" : "ghost"}
                      className="justify-start"
                      onClick={() => {
                        setActiveTab("template-menu")
                      }}
                    >
                      <Calendar className="ml-2 h-4 w-4" />
                      منوی الگو
                    </Button>
                    <Button
                      variant={activeTab === "daily-menu" ? "secondary" : "ghost"}
                      className="justify-start"
                      onClick={() => {
                        setActiveTab("daily-menu")
                      }}
                    >
                      <Clipboard className="ml-2 h-4 w-4" />
                      منوی روزانه
                    </Button>
                    <Button
                      variant={activeTab === "voucher-price" ? "secondary" : "ghost"}
                      className="justify-start"
                      onClick={() => {
                        setActiveTab("voucher-price")
                      }}
                    >
                      <DollarSign className="ml-2 h-4 w-4" />
                      قیمت ژتون
                    </Button>
                    <Button
                      variant={activeTab === "analytics" ? "secondary" : "ghost"}
                      className="justify-start"
                      onClick={() => {
                        setActiveTab("analytics")
                      }}
                    >
                      <BarChart2 className="ml-2 h-4 w-4" />
                      آمار و گزارشات
                    </Button>
                  </div>
                  <div className="mt-auto">
                    <Button variant="ghost" className="justify-start w-full" onClick={handleLogout}>
                      <LogOut className="ml-2 h-4 w-4" />
                      خروج
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center">
              <div className="relative h-10 w-10 mr-3 transition-transform duration-300 hover:scale-110">
                <Image src="/images/javanfoods_logo.png" alt="رستوران جوان" fill className="object-contain" priority />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-600 hidden md:block">رستوران جوان</span>
                <span className="text-lg md:text-xl font-bold text-[#f97316]">پنل مدیریت</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/placeholder.svg?height=32&width=32" alt="مدیر سیستم" />
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
        </div>
      </header>

      <div className="flex flex-row-reverse min-h-screen">
        {/* Sidebar - Desktop only */}
        <aside className="hidden md:flex flex-col w-64 p-4 animate-slide-left" style={{ animationDelay: "0.2s" }}>
          <Card className="flex-1 backdrop-blur-md bg-white/80 border-0 shadow-md">
            <CardContent className="p-4" dir="rtl">
              <div className="space-y-1 mt-2">
                <Button
                  variant={activeTab === "dashboard" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("dashboard")}
                >
                  <Home className="ml-2 h-4 w-4" />
                  داشبورد
                </Button>
                <Button
                  variant={activeTab === "food" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("food")}
                >
                  <Utensils className="ml-2 h-4 w-4" />
                  مدیریت غذاها
                </Button>
                <Button
                  variant={activeTab === "categories" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("categories")}
                >
                  <Clipboard className="ml-2 h-4 w-4" />
                  دسته‌بندی‌ها
                </Button>
                <Button
                  variant={activeTab === "template-menu" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("template-menu")}
                >
                  <Calendar className="ml-2 h-4 w-4" />
                  منوی الگو
                </Button>
                <Button
                  variant={activeTab === "daily-menu" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("daily-menu")}
                >
                  <Clipboard className="ml-2 h-4 w-4" />
                  منوی روزانه
                </Button>
                <Button
                  variant={activeTab === "voucher-price" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("voucher-price")}
                >
                  <DollarSign className="ml-2 h-4 w-4" />
                  قیمت ژتون
                </Button>
                <Button
                  variant={activeTab === "analytics" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("analytics")}
                >
                  <BarChart2 className="ml-2 h-4 w-4" />
                  آمار و گزارشات
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Dashboard Tab */}
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={Utensils} title="تعداد غذاها" value={totalFoods.toString()} color="bg-[#f97316]" />
                    <StatCard
                      icon={Clipboard}
                      title="تعداد دسته‌بندی‌ها"
                      value={totalCategories.toString()}
                      color="bg-[#f97316]"
                    />
                    <StatCard icon={User} title="کل رزروها" value={totalReservations.toString()} color="bg-[#f97316]" />
                    <StatCard
                      icon={Calendar}
                      title="رزروهای امروز"
                      value={todayReservations.toString()}
                      color="bg-[#f97316]"
                    />
                  </div>

                  <Card className="backdrop-blur-md bg-white/80 border-0 shadow-md">
                    <CardHeader>
                      <CardTitle>آمار سفارشات روزانه</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="w-full h-[300px]">
                        <Line data={getPast7DaysOrderData()} options={chartOptions} />
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="backdrop-blur-md bg-white/80 border-0 shadow-md">
                      <CardHeader>
                        <CardTitle>غذاهای اخیر</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {foods.slice(0, 5).map((food) => (
                            <div
                              key={food.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-orange-50 transition-colors"
                            >
                              <div className="relative h-12 w-12 rounded-md overflow-hidden">
                                <Image
                                  src={food.image_url || "/placeholder.svg?height=48&width=48"}
                                  alt={food.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium">{food.name}</h4>
                                <p className="text-sm text-gray-500">
                                  {food.price.toLocaleString()} تومان
                                </p>
                              </div>
                              <Badge variant="outline">{food.category_name || "بدون دسته‌بندی"}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          variant="ghost"
                          className="w-full text-[#f97316] hover:text-orange-700"
                          onClick={() => setActiveTab("food")}
                        >
                          مشاهده همه غذاها
                        </Button>
                      </CardFooter>
                    </Card>

                    <Card className="backdrop-blur-md bg-white/80 border-0 shadow-md">
                      <CardHeader>
                        <CardTitle>رزروهای اخیر</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {reservationLogs.slice(0, 5).map((log) => (
                            <div
                              key={log.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-orange-50 transition-colors"
                            >
                              <div className="relative h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-[#f97316]" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium">{log.student}</h4>
                                <p className="text-sm text-gray-500">
                                  {log.food} - {formatPersianDateTime(log.created_at)}
                                </p>
                              </div>
                              <Badge
                                variant={log.status === "confirmed" ? "default" : "secondary"}
                                className={log.status === "confirmed" ? "bg-green-500" : ""}
                              >
                                {log.status === "confirmed" ? "تایید شده" : "در انتظار"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          variant="ghost"
                          className="w-full text-[#f97316] hover:text-orange-700"
                          onClick={() => setActiveTab("analytics")}
                        >
                          مشاهده همه رزروها
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </div>
              )}

              {/* Food Management Tab */}
              {activeTab === "food" && (
                <Card className="backdrop-blur-md bg-white/80 border-0 shadow-md">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <CardTitle>مدیریت غذاها</CardTitle>
                      <Button onClick={handleAddFood} className="bg-[#f97316] hover:bg-orange-600 btn-hover-effect">
                        <Plus className="w-4 h-4 ml-2" /> افزودن غذا
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
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
                          {foods.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                هیچ غذایی یافت نشد
                              </TableCell>
                            </TableRow>
                          ) : (
                            foods.map((food) => (
                              <TableRow key={food.id} className="hover:bg-orange-50/50 transition-colors">
                                <TableCell>
                                  <div className="relative h-12 w-12">
                                    <Image
                                      src={food.image_url || "/placeholder.svg?height=48&width=48"}
                                      alt={food.name}
                                      fill
                                      className="object-contain rounded-md"
                                    />
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">{food.name}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-orange-50">
                                    {food.category_name || "بدون دسته‌بندی"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate">{food.description}</TableCell>
                                <TableCell>{food.price.toLocaleString()}</TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditFood(food)}
                                      className="btn-hover-effect"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteFood(food)}
                                      className="btn-hover-effect"
                                    >
                                      <Trash className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Categories Tab */}
              {activeTab === "categories" && (
                <Card className="backdrop-blur-md bg-white/80 border-0 shadow-md">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <CardTitle>مدیریت دسته‌بندی‌های غذا</CardTitle>
                      <Button onClick={handleAddCategory} className="bg-[#f97316] hover:bg-orange-600 btn-hover-effect">
                        <Plus className="w-4 h-4 ml-2" /> افزودن دسته‌بندی
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>نام دسته‌بندی</TableHead>
                            <TableHead>توضیحات</TableHead>
                            <TableHead>تاریخ ایجاد</TableHead>
                            <TableHead>عملیات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categories.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                هیچ دسته‌بندی یافت نشد
                              </TableCell>
                            </TableRow>
                          ) : (
                            categories.map((category) => (
                              <TableRow key={category.id} className="hover:bg-orange-50/50 transition-colors">
                                <TableCell className="font-medium">{category.name}</TableCell>
                                <TableCell>{category.description || "-"}</TableCell>
                                <TableCell>{new Date(category.created_at).toLocaleDateString("fa-IR")}</TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditCategory(category)}
                                      className="btn-hover-effect"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteCategory(category)}
                                      className="btn-hover-effect"
                                    >
                                      <Trash className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Template Menu Tab */}
              {activeTab === "template-menu" && (
                <Card className="backdrop-blur-md bg-white/80 border-0 shadow-md">
                  <CardHeader>
                    <CardTitle>مدیریت منوی الگو</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                      <Select value={selectedDay} onValueChange={setSelectedDay}>
                        <SelectTrigger className="w-full md:w-[180px] form-input-focus">
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
                        <SelectTrigger className="w-full md:w-[180px] form-input-focus">
                          <SelectValue placeholder="انتخاب نوع وعده" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lunch">ناهار</SelectItem>
                          <SelectItem value="dinner">شام</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => handleAddMenuItem(true)}
                        className="bg-[#f97316] hover:bg-orange-600 btn-hover-effect"
                      >
                        افزودن غذا به منو
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>غذاها</TableHead>
                            <TableHead>عملیات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {!templateMenu || templateMenu.items.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center py-8 text-gray-500">
                                هیچ غذایی در منوی الگو برای این روز و وعده یافت نشد
                              </TableCell>
                            </TableRow>
                          ) : (
                            templateMenu.items.map((item: MenuItemSpec, index) => (
                              <TableRow key={index} className="hover:bg-orange-50/50 transition-colors">
                                <TableCell>
                                  <div className="mb-2 p-2 rounded-lg">
                                    <span className="font-medium">{item.food?.name}</span>
                                    <br />
                                    <small className="text-gray-500">
                                      {item.start_time} - {item.end_time}, ظرفیت: {item.daily_capacity}
                                    </small>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2 mb-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditMenuItem(item, true)}
                                      className="btn-hover-effect"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteMenuItem(item.id, true)}
                                      className="btn-hover-effect"
                                    >
                                      <Trash className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Daily Menu Tab */}
              {activeTab === "daily-menu" && (
                <Card className="backdrop-blur-md bg-white/80 border-0 shadow-md">
                  <CardHeader>
                    <CardTitle>مدیریت منوی روزانه</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                      <DatePicker
                        value={selectedDate}
                        onChange={handleDateChange}
                        calendar={persian}
                        locale={persian_fa}
                        calendarPosition="bottom-right"
                        inputClass="w-full md:w-[180px] px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 form-input-focus"
                        containerClassName="w-full md:w-[180px]"
                        placeholder="انتخاب تاریخ"
                      />
                      <Select
                        value={selectedMeal_type}
                        onValueChange={(value: "lunch" | "dinner") => setSelectedMeal_type(value)}
                      >
                        <SelectTrigger className="w-full md:w-[180px] form-input-focus">
                          <SelectValue placeholder="انتخاب نوع وعده" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lunch">ناهار</SelectItem>
                          <SelectItem value="dinner">شام</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={() => handleAddMenuItem(false)}
                          className="bg-[#f97316] hover:bg-orange-600 btn-hover-effect"
                        >
                          افزودن غذا به منو
                        </Button>
                        <Button
                          onClick={handleUseTemplateForDaily}
                          className="bg-[#f97316] hover:bg-orange-600 btn-hover-effect"
                        >
                          استفاده از منوی الگو
                        </Button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>غذاها</TableHead>
                            <TableHead>وضعیت</TableHead>
                            <TableHead>عملیات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {!dailyMenu || dailyMenu.items.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                                هیچ غذایی در منوی روزانه برای این تاریخ و وعده یافت نشد
                              </TableCell>
                            </TableRow>
                          ) : (
                            dailyMenu.items.map((item: MenuItemSpec, index) => (
                              <TableRow key={index} className="hover:bg-orange-50/50 transition-colors">
                                <TableCell>
                                  <div className="mb-2 p-2 rounded-lg">
                                    <span className="font-medium">{item.food?.name}</span>
                                    <br />
                                    <small className="text-gray-500">
                                      {item.start_time} - {item.end_time}, ظرفیت: {item.daily_capacity}
                                    </small>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Switch
                                      checked={item.is_available}
                                      onCheckedChange={(checked) => handleToggleAvailability(item.id, checked)}
                                    />
                                    <span className={item.is_available ? "text-green-600" : "text-red-500"}>
                                      {item.is_available ? "فعال" : "غیرفعال"}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2 mb-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditMenuItem(item, false)}
                                      className="btn-hover-effect"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteMenuItem(item.id, false)}
                                      className="btn-hover-effect"
                                    >
                                      <Trash className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Voucher Price Tab */}
              {activeTab === "voucher-price" && (
                <Card className="backdrop-blur-md bg-white/80 border-0 shadow-md">
                  <CardHeader>
                    <CardTitle>مدیریت قیمت ژتون</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row justify-between items-center p-6 bg-orange-50/50 rounded-xl">
                      <div className="flex items-center mb-4 md:mb-0">
                        <div className="p-4 rounded-full bg-orange-100 mr-4">
                          <DollarSign className="h-8 w-8 text-[#f97316]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-700">قیمت فعلی ژتون</h3>
                          <p className="text-2xl font-bold text-[#f97316]">
                            {voucherPrice.toLocaleString()} تومان
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleUpdateVoucherPrice}
                        className="bg-[#f97316] hover:bg-orange-600 btn-hover-effect"
                      >
                        به‌روزرسانی قیمت
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Analytics Tab */}
              {activeTab === "analytics" && (
                <div className="space-y-6">
                  <Card className="backdrop-blur-md bg-white/80 border-0 shadow-md">
                    <CardHeader>
                      <CardTitle>آمار و گزارشات</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="reservation-logs">
                        <TabsList className="mb-4">
                          <TabsTrigger value="reservation-logs">گزارش رزروها</TabsTrigger>
                          <TabsTrigger value="daily-orders">آمار سفارشات روزانه</TabsTrigger>
                        </TabsList>
                        <TabsContent value="reservation-logs">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>شناسه کاربر</TableHead>
                                  <TableHead>نام غذا</TableHead>
                                  <TableHead>تاریخ و زمان رزرو</TableHead>
                                  <TableHead>وضعیت</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {reservationLogs.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                      هیچ رزروی یافت نشد
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  reservationLogs.map((log) => (
                                    <TableRow key={log.id} className="hover:bg-orange-50/50 transition-colors">
                                      <TableCell>{log.student}</TableCell>
                                      <TableCell>{log.food}</TableCell>
                                      <TableCell>{formatPersianDateTime(log.created_at)}</TableCell>
                                      <TableCell>
                                        <Badge
                                          variant={log.status === "confirmed" ? "default" : "secondary"}
                                          className={log.status === "confirmed" ? "bg-green-500" : ""}
                                        >
                                          {log.status === "confirmed" ? "تایید شده" : "در انتظار"}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                        <TabsContent value="daily-orders">
                          <div className="w-full h-[400px]">
                            <Line data={getPast7DaysOrderData()} options={chartOptions} />
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] backdrop-blur-md bg-white/90 border-0 shadow-xl">
          {dialogContent}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[425px] backdrop-blur-md bg-white/90 border-0 shadow-xl">
          <DialogHeader>
            <DialogTitle>{currentCategory ? "ویرایش دسته‌بندی" : "افزودن دسته‌بندی جدید"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4" dir="rtl">
            <div className="space-y-2">
              <Label htmlFor="name">نام دسته‌بندی</Label>
              <Input
                id="name"
                name="name"
                value={categoryFormData.name}
                onChange={handleCategoryInputChange}
                placeholder="نام دسته‌بندی را وارد کنید"
                className="form-input-focus"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">توضیحات (اختیاری)</Label>
              <Textarea
                id="description"
                name="description"
                value={categoryFormData.description || ""}
                onChange={handleCategoryInputChange}
                placeholder="توضیحات دسته‌بندی را وارد کنید"
                rows={3}
                className="form-input-focus"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)} disabled={isCategorySubmitting}>
              انصراف
            </Button>
            <Button
              onClick={handleCategorySubmit}
              className="bg-[#f97316] hover:bg-orange-600 btn-hover-effect"
              disabled={isCategorySubmitting}
            >
              {isCategorySubmitting ? "در حال ذخیره..." : currentCategory ? "به‌روزرسانی" : "افزودن"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryDeleteDialogOpen} onOpenChange={setCategoryDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] backdrop-blur-md bg-white/90 border-0 shadow-xl">
          <DialogHeader>
            <DialogTitle>حذف دسته‌بندی</DialogTitle>
          </DialogHeader>
          <div className="py-4" dir="rtl">
            <p>آیا از حذف دسته‌بندی &quot;{currentCategory?.name}&quot; اطمینان دارید؟</p>
            <p className="text-sm text-red-500 mt-2">
              توجه: اگر این دسته‌بندی به غذایی اختصاص داده شده باشد، قابل حذف نخواهد بود.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCategoryDeleteDialogOpen(false)}
              disabled={isCategorySubmitting}
            >
              انصراف
            </Button>
            <Button variant="destructive" onClick={handleCategoryDelete} disabled={isCategorySubmitting}>
              {isCategorySubmitting ? "در حال حذف..." : "حذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
