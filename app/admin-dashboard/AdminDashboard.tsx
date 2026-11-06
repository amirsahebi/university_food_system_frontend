"use client"

import type React from "react"

import { useState, useCallback, useEffect, useMemo } from "react"
import { format as formatGregorian } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { FoodImage } from "@/components/ui/food-image"
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
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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
  Trash2,
  Menu,
  Home,
  Search,
  Ticket,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Clock,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Activity,
  AlertTriangle,
  Check,
  Coins,
  Info,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast, Toaster } from "react-hot-toast"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js"
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
import {
  toPersianDigits,
  toEnglishDigits,
  parsePersianInt,
  formatPersianPrice,
  normalizeForSearch,
} from "@/lib/formatters"

// Interfaces
interface VoucherType {
  id: number
  code: string
  name: string
  discount_amount: number | string
  is_active: boolean
  description?: string
}

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
  allowed_vouchers?: VoucherType[]
  supports_extra_voucher?: boolean
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
    allowed_vouchers?: VoucherType[]
    supports_extra_voucher?: boolean // Add this property to the food object
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
  reserved_date: string
  status: string
}

interface DailyOrderCount {
  reserved_date: string
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

interface TrustScoreRecoveryFormData {
  user_id: number
  points: number
  reason: string
}

// Payment Interfaces
interface PaymentUser {
  id: number;
  phone_number: string;
  email: string;
  full_name: string;
}

interface Payment {
  id: string;
  user: PaymentUser;
  amount: number;
  authority: string;
  ref_id: string | null;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  created_at: string;
  updated_at: string;
  error_message?: string;
}

interface PaymentResponse {
  count: number;
  results: Payment[];
  // The backend might return next/previous in the future, so we'll keep them optional
  next?: string | null;
  previous?: string | null;
}

type PaymentFilterStatus = 'all' | 'pending' | 'paid' | 'failed' | 'refunded'

interface Student {
  id: number
  name: string
  student_id: string
  email: string
  phone: string
  department: string
  trust_score: number
  status: "active" | "inactive"
  created_at: string
}

interface StatCardProps {
  icon: React.ElementType
  title: string
  value: string | number
  color?: string
  gradient?: string
  subtitle?: string
  trend?: string
  onClick?: () => void
}

// Elevated Dashboard Stats Card Component
const StatCard = ({
  icon: Icon,
  title,
  value,
  color,
  gradient = "from-[#F47B20] to-[#FB923C]",
  subtitle,
  trend,
  onClick,
}: StatCardProps) => {
  const effectiveGradient = color && color.includes("from-") ? color : gradient
  const displayValue =
    typeof value === "number"
      ? toPersianDigits(value.toLocaleString("en-US"))
      : toPersianDigits(value)

  return (
    <Card
      onClick={onClick}
      className={`group relative overflow-hidden backdrop-blur-xl bg-white/90 border border-orange-100/70 shadow-xs hover:shadow-md hover:border-orange-200 transition-all duration-300 rounded-2xl ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className={`h-1.5 w-full bg-gradient-to-r ${effectiveGradient}`} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 tracking-wide">{title}</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {displayValue}
            </h3>
            {subtitle && (
              <p className="text-[11px] text-gray-400 font-normal pt-0.5">{toPersianDigits(subtitle)}</p>
            )}
          </div>
          <div
            className={`p-3.5 rounded-2xl bg-gradient-to-br ${effectiveGradient} text-white shadow-md shadow-orange-500/15 group-hover:scale-105 transition-transform duration-300`}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
        {trend && (
          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
            <span className="text-gray-400">وضعیت</span>
            <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-150">
              {toPersianDigits(trend)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend)

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("dashboard")
  
  // Payment states
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentLoading, setPaymentLoading] = useState(false)
  interface PaginationState {
    page: number;
    pageSize: number;
    total: number;
    search: string;
    status: PaymentFilterStatus;
    hasNext: boolean;
    hasPrevious: boolean;
  }

  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0,
    search: '',
    status: 'all',
    hasNext: false,
    hasPrevious: false
  })
  const [dialogContent, setDialogContent] = useState<React.ReactNode | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [inquiryResult, setInquiryResult] = useState<{
    status: string;
    message: string;
    payment: Payment | null;
    reversed: boolean;
  } | null>(null)
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false)
  const [foods, setFoods] = useState<Food[]>([])
  const [templateMenu, setTemplateMenu] = useState<TemplateMenuItem | null>(null)
  const [dailyMenu, setDailyMenu] = useState<DailyMenuItem | null>(null)
  const [voucherTypes, setVoucherTypes] = useState<VoucherType[]>([])
  // Voucher Management state
  const [voucherDialogOpen, setVoucherDialogOpen] = useState(false)
  const [voucherDeleteDialogOpen, setVoucherDeleteDialogOpen] = useState(false)
  const [currentVoucher, setCurrentVoucher] = useState<VoucherType | null>(null)
  const [isVoucherSubmitting, setIsVoucherSubmitting] = useState(false)
  const [voucherFormData, setVoucherFormData] = useState({
    code: "",
    name: "",
    discount_amount: 50000,
    description: "",
    is_active: true,
  })
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

  // Trust Score Recovery state
  const [trustScoreDialogOpen, setTrustScoreDialogOpen] = useState(false)
  const [isTrustScoreSubmitting, setIsTrustScoreSubmitting] = useState(false)
  const [trustScoreFormData, setTrustScoreFormData] = useState<TrustScoreRecoveryFormData>({
    user_id: 0,
    points: 1,
    reason: "",
  })
  const [recoverConfirmOpen, setRecoverConfirmOpen] = useState(false)
  const [recoverTarget, setRecoverTarget] = useState<Student | null>(null)

  // Student Management state
  const [students, setStudents] = useState<Student[]>([])
  const [studentDialogOpen, setStudentDialogOpen] = useState(false)
  const [studentDeleteDialogOpen, setStudentDeleteDialogOpen] = useState(false)
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null)
  const [isStudentSubmitting, setIsStudentSubmitting] = useState(false)
  const [studentSearch, setStudentSearch] = useState("")
  const [studentFormData, setStudentFormData] = useState({
    name: "",
    student_id: "",
    email: "",
    phone: "",
    department: "",
    status: "active" as "active" | "inactive",
  })

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students
    const q = normalizeForSearch(studentSearch)
    return students.filter((s) => {
      const name = normalizeForSearch(s.name)
      const sid = normalizeForSearch(s.student_id)
      const phone = normalizeForSearch(s.phone)
      const dept = normalizeForSearch(s.department)
      return name.includes(q) || sid.includes(q) || phone.includes(q) || dept.includes(q)
    })
  }, [students, studentSearch])

  // Dashboard stats
  const [totalFoods, setTotalFoods] = useState(0)
  const [totalCategories, setTotalCategories] = useState(0)
  const [totalReservations, setTotalReservations] = useState(0)
  const [todayReservations, setTodayReservations] = useState(0)

  // Filter & Search states
  const [foodSearch, setFoodSearch] = useState("")
  const [foodCategoryFilter, setFoodCategoryFilter] = useState("all")
  const [categorySearch, setCategorySearch] = useState("")

  const todayPersianDate = useMemo(() => {
    try {
      const raw = new DateObject({ calendar: persian, locale: persian_fa }).format("dddd DD MMMM YYYY")
      return toPersianDigits(raw)
    } catch {
      return ""
    }
  }, [])

  const filteredFoods = useMemo(() => {
    const q = normalizeForSearch(foodSearch)
    return foods.filter((f) => {
      const matchesSearch =
        !q ||
        normalizeForSearch(f.name).includes(q) ||
        normalizeForSearch(f.description).includes(q)
      const matchesCategory =
        foodCategoryFilter === "all" ||
        (foodCategoryFilter === "uncategorized" && !f.category_id) ||
        (f.category_id && f.category_id.toString() === foodCategoryFilter)
      return matchesSearch && matchesCategory
    })
  }, [foods, foodSearch, foodCategoryFilter])

  const filteredCategories = useMemo(() => {
    const q = normalizeForSearch(categorySearch)
    return categories.filter(
      (c) =>
        !q ||
        normalizeForSearch(c.name).includes(q) ||
        normalizeForSearch(c.description).includes(q),
    )
  }, [categories, categorySearch])

  const navigationSections = useMemo(
    () => [
      {
        title: "مرکز فرماندهی",
        items: [
          { id: "dashboard", label: "داشبورد و وضعیت", icon: Home },
        ],
      },
      {
        title: "منو و غذا",
        items: [
          { id: "food", label: "مدیریت غذاها", icon: Utensils, badge: totalFoods },
          { id: "categories", label: "دسته‌بندی‌ها", icon: Clipboard, badge: totalCategories },
          { id: "template-menu", label: "منوی الگو", icon: Calendar },
          { id: "daily-menu", label: "منوی روزانه", icon: Sparkles },
        ],
      },
      {
        title: "ژتون و امور مالی",
        items: [
          {
            id: "vouchers",
            label: "مدیریت ژتون‌ها",
            icon: Ticket,
            badge: voucherTypes.filter((v) => v.is_active).length,
          },
          { id: "payments", label: "تراکنش‌ها و پرداخت", icon: DollarSign },
        ],
      },
      {
        title: "کاربران و سامانه",
        items: [
          { id: "students", label: "مدیریت دانشجویان", icon: User, badge: students.length },
          { id: "analytics", label: "آمار و گزارشات", icon: BarChart2 },
        ],
      },
    ],
    [totalFoods, totalCategories, voucherTypes, students.length],
  )

  // Payment inquiry function
  const inquirePayment = async (authority: string) => {
    try {
      setPaymentLoading(true)
      const response = await api.get(
        createApiUrl(API_ROUTES.INQUIRE_PAYMENT(authority)),
        {
          params: {
            check_reversal: true
          }
        }
      )
      
      const { status, message, payment, reversed } = response.data
      setInquiryResult({ status, message, payment: payment as Payment | null, reversed })
      setIsInquiryModalOpen(true)
      
      // Refresh the payments list
      await fetchPayments(pagination.page, pagination.search, pagination.status)
    } catch (error: unknown) {
      console.error('Error inquiring payment:', error)
      let errorMessage = 'خطا در استعلام وضعیت پرداخت'
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as AxiosError<{ message?: string }>
        errorMessage = err.response?.data?.message || errorMessage
      }
      toast.error(errorMessage)
    } finally {
      setPaymentLoading(false)
    }
  }

  // Format status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case 'PAID': return 'پرداخت شده';
      case 'VERIFIED': return 'تایید شده';
      case 'IN_BANK': return 'در حال پرداخت';
      case 'FAILED': return 'ناموفق';
      case 'REVERSED': return 'برگشت خورده';
      default: return status;
    }
  }

  // Payment functions
  const fetchPayments = useCallback(async (page = 1, search = '', status: PaymentFilterStatus = 'all') => {
    try {
      setPaymentLoading(true);
      const limit = pagination.pageSize;
      const offset = (page - 1) * limit;
      const normalizedSearch = toEnglishDigits(search).trim()
      
      const response = await api.get<PaymentResponse>(
        createApiUrl(API_ROUTES.GET_ALL_PAYMENTS),
        {
          params: {
            limit,
            offset,
            search: normalizedSearch,
            status: status === 'all' ? undefined : status.toLowerCase()
          }
        }
      );
      
      setPayments(response.data.results);
      setPagination(prev => ({
        ...prev,
        page,
        pageSize: limit,
        total: response.data.count,
        search,
        status,
        hasNext: !!response.data.next,
        hasPrevious: !!response.data.previous
      }));
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('خطا در دریافت لیست پرداخت‌ها')
    } finally {
      setPaymentLoading(false)
    }
  }, [pagination.pageSize])



  // Load payments when tab changes
  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPayments(1, pagination.search, pagination.status)
    }
  }, [activeTab, fetchPayments, pagination.search, pagination.status])

  const getPast7DaysOrderData = () => {
    const now = new Date()
    const dates = []
    const totalOrders = []
    const pickedUpOrders = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      dates.push(date.toLocaleDateString("fa-IR"))

      const dailyData = dailyOrderCounts.find(
        (d: DailyOrderCount) =>
          new Date(d.reserved_date).toLocaleDateString("fa-IR") === date.toLocaleDateString("fa-IR"),
      )

      totalOrders.push(dailyData?.order_count || 0)
      pickedUpOrders.push(dailyData?.picked_up_count || 0)
    }

    return {
      labels: dates,
      datasets: [
        {
          label: "تعداد سفارشات کل",
          data: totalOrders,
          fill: false,
          borderColor: "#f97316",
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBackgroundColor: "#f97316",
          pointBorderColor: "#f97316",
          pointHoverBackgroundColor: "#f97316",
          pointHoverBorderColor: "#f97316",
        },
        {
          label: "تعداد سفارشات تحویل شده",
          data: pickedUpOrders,
          fill: false,
          borderColor: "#10B981",
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBackgroundColor: "#10B981",
          pointBorderColor: "#10B981",
          pointHoverBackgroundColor: "#10B981",
          pointHoverBorderColor: "#10B981",
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
        position: "top" as const,
        labels: {
          color: "#4B5563",
          boxWidth: 20,
        },
      },
      title: {
        display: true,
        text: "تعداد سفارشات و تحویل‌ها در 7 روز گذشته",
        color: "#4B5563",
      },
    },
    scales: {
      x: {
        grid: {
          color: "#E5E7EB",
        },
        ticks: {
          color: "#4B5563",
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "#E5E7EB",
        },
        ticks: {
          color: "#4B5563",
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index" as const,
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
  }, [])

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
  }, [selectedDay, selectedMeal_type])

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

  const fetchVoucherTypes = useCallback(async () => {
    try {
      const response = await api.get(createApiUrl(API_ROUTES.GET_VOUCHER_TYPES))
      setVoucherTypes(response.data)
    } catch (error) {
      console.error("Error fetching voucher types:", error)
    }
  }, [])

  const handleOpenAddVoucher = () => {
    setCurrentVoucher(null)
    setVoucherFormData({
      code: `TYPE_${voucherTypes.length + 1}`,
      name: "",
      discount_amount: 50000,
      description: "",
      is_active: true,
    })
    setVoucherDialogOpen(true)
  }

  const handleOpenEditVoucher = (voucher: VoucherType) => {
    setCurrentVoucher(voucher)
    setVoucherFormData({
      code: voucher.code,
      name: voucher.name,
      discount_amount: Number(voucher.discount_amount),
      description: voucher.description || "",
      is_active: voucher.is_active,
    })
    setVoucherDialogOpen(true)
  }

  const handleToggleVoucherActive = async (voucher: VoucherType) => {
    try {
      await api.patch(createApiUrl(API_ROUTES.UPDATE_VOUCHER_TYPE(voucher.id)), {
        is_active: !voucher.is_active,
      })
      toast.success(`وضعیت ${voucher.name} به ${!voucher.is_active ? "فعال" : "غیرفعال"} تغییر یافت`)
      await fetchVoucherTypes()
    } catch (error) {
      console.error("Error toggling voucher active:", error)
      toast.error("خطا در تغییر وضعیت ژتون")
    }
  }

  const handleSaveVoucher = async () => {
    if (!voucherFormData.name.trim() || !voucherFormData.code.trim()) {
      toast.error("لطفاً کد و نام ژتون را وارد کنید")
      return
    }
    if (voucherFormData.discount_amount < 0) {
      toast.error("مبلغ تخفیف نمی‌تواند منفی باشد")
      return
    }

    setIsVoucherSubmitting(true)
    try {
      if (currentVoucher) {
        await api.put(createApiUrl(API_ROUTES.UPDATE_VOUCHER_TYPE(currentVoucher.id)), {
          code: voucherFormData.code,
          name: voucherFormData.name,
          discount_amount: voucherFormData.discount_amount,
          description: voucherFormData.description,
          is_active: voucherFormData.is_active,
        })
        toast.success("ژتون با موفقیت ویرایش شد")
      } else {
        await api.post(createApiUrl(API_ROUTES.ADD_VOUCHER_TYPE), {
          code: voucherFormData.code,
          name: voucherFormData.name,
          discount_amount: voucherFormData.discount_amount,
          description: voucherFormData.description,
          is_active: voucherFormData.is_active,
        })
        toast.success("ژتون جدید با موفقیت ایجاد شد")
      }
      setVoucherDialogOpen(false)
      await fetchVoucherTypes()
      await fetchFoods()
    } catch (error: unknown) {
      console.error("Error saving voucher:", error)
      let errMsg = "خطا در ذخیره‌سازی ژتون"
      if (typeof error === "object" && error !== null && "response" in error) {
        const respData = (error as { response?: { data?: Record<string, unknown> } }).response?.data
        if (respData) {
          if (Array.isArray(respData.code) && respData.code[0]) {
            errMsg = String(respData.code[0])
          } else if (typeof respData.error === "string") {
            errMsg = respData.error
          }
        }
      }
      toast.error(errMsg)
    } finally {
      setIsVoucherSubmitting(false)
    }
  }

  const handleOpenDeleteVoucher = (voucher: VoucherType) => {
    setCurrentVoucher(voucher)
    setVoucherDeleteDialogOpen(true)
  }

  const handleConfirmDeleteVoucher = async () => {
    if (!currentVoucher) return
    setIsVoucherSubmitting(true)
    try {
      await api.delete(createApiUrl(API_ROUTES.DELETE_VOUCHER_TYPE(currentVoucher.id)))
      toast.success("ژتون با موفقیت حذف شد")
      setVoucherDeleteDialogOpen(false)
      await fetchVoucherTypes()
      await fetchFoods()
    } catch (error) {
      console.error("Error deleting voucher:", error)
      toast.error("خطا در حذف ژتون")
    } finally {
      setIsVoucherSubmitting(false)
    }
  }

  const fetchReservationLogs = useCallback(async () => {
    try {
      const response = await api.get(createApiUrl(API_ROUTES.GET_RESERVATION_LOGS))
      setReservationLogs(response.data)
      setTotalReservations(response.data.length)

      // Calculate today's reservations
      const today = new Date().toISOString().split("T")[0]
      const todayCount = response.data.filter(
        (log: ReservationLog) => log.reserved_date && log.reserved_date.includes(today),
      ).length
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

  const fetchStudents = useCallback(async () => {
    try {
      const response = await api.get(createApiUrl(API_ROUTES.GET_STUDENTS))
      setStudents(response.data)
    } catch (error) {
      console.error("Error fetching students:", error)
      toast.error("خطا در دریافت لیست دانشجویان")
    }
  }, [])

  useEffect(() => {
    fetchFoods()
    fetchTemplateMenu()
    fetchDailyMenu()
    fetchVoucherTypes()
    fetchReservationLogs()
    fetchDailyOrderCounts()
    fetchCategories()
    fetchStudents()
  }, [
    fetchFoods,
    fetchTemplateMenu,
    fetchDailyMenu,
    fetchVoucherTypes,
    fetchReservationLogs,
    fetchDailyOrderCounts,
    fetchCategories,
    fetchStudents,
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

  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCategoryFormData({ ...categoryFormData, [name]: value })
  }

  const handleTrustScoreInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setTrustScoreFormData({
      ...trustScoreFormData,
      [name]: name === "points" || name === "user_id" ? parsePersianInt(value) : value,
    })
  }

  const handleTrustScoreSubmit = useCallback(async () => {
    if (!trustScoreFormData.user_id || trustScoreFormData.user_id <= 0) {
      toast.error("لطفاً شناسه کاربر را به درستی وارد کنید")
      return
    }

    if (trustScoreFormData.points <= 0) {
      toast.error("تعداد امتیاز باید بیشتر از صفر باشد")
      return
    }

    setIsTrustScoreSubmitting(true)

    try {
      await api.post(createApiUrl(API_ROUTES.RECOVER_TRUST_SCORE), trustScoreFormData)
      toast.success(`امتیاز اعتبار کاربر با موفقیت ${toPersianDigits(trustScoreFormData.points)} واحد افزایش یافت`)
      setTrustScoreDialogOpen(false)
      setTrustScoreFormData({
        user_id: 0,
        points: 1,
        reason: "",
      })
      // Refresh students list to show updated trust score
      await fetchStudents()
    } catch (error) {
      console.error("Error recovering trust score:", error)
      const axiosError = error as AxiosError
      let errorMessage = "خطا در بازیابی امتیاز اعتبار"

      if (axiosError.response?.status === 404) {
        errorMessage = "کاربر با این شناسه یافت نشد"
      }

      toast.error(errorMessage)
    } finally {
      setIsTrustScoreSubmitting(false)
    }
  }, [trustScoreFormData, fetchStudents])

  const handleRecoverTrustScore = useCallback((student: Student) => {
    if (!student?.id) return
    if (student.trust_score >= 0) return
    setRecoverTarget(student)
    setRecoverConfirmOpen(true)
  }, [])

  const confirmRecoverTrustScore = useCallback(async () => {
    if (!recoverTarget?.id) return
    setIsTrustScoreSubmitting(true)
    try {
      await api.post(createApiUrl(API_ROUTES.RECOVER_TRUST_SCORE), { student_id: recoverTarget.id })
      toast.success("امتیاز اعتبار دانشجو با موفقیت بازیابی شد")
      setRecoverConfirmOpen(false)
      setRecoverTarget(null)
      await fetchStudents()
    } catch (error) {
      console.error("Error recovering trust score:", error)
      toast.error("خطا در بازیابی امتیاز اعتبار")
    } finally {
      setIsTrustScoreSubmitting(false)
    }
  }, [recoverTarget, fetchStudents])


  const handleAddStudent = useCallback(() => {
    setCurrentStudent(null)
    setStudentFormData({
      name: "",
      student_id: "",
      email: "",
      phone: "",
      department: "",
      status: "active",
    })
    setStudentDialogOpen(true)
  }, [])

  const handleEditStudent = useCallback((student: Student) => {
    setCurrentStudent(student)
    setStudentFormData({
      name: student.name,
      student_id: student.student_id,
      email: student.email,
      phone: student.phone || "",
      department: student.department || "",
      status: student.status,
    })
    setStudentDialogOpen(true)
  }, [])

  const handleDeleteStudent = useCallback((student: Student) => {
    setCurrentStudent(student)
    setStudentDeleteDialogOpen(true)
  }, [])

  const handleStudentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setStudentFormData({ ...studentFormData, [name]: value })
  }

  const handleStudentSubmit = useCallback(async () => {
    if (!studentFormData.name || !studentFormData.student_id) {
      toast.error("لطفاً نام و شماره دانشجویی را وارد کنید")
      return
    }

    setIsStudentSubmitting(true)

    const payload = {
      ...studentFormData,
      student_id: toEnglishDigits(studentFormData.student_id).trim(),
      phone: toEnglishDigits(studentFormData.phone).trim(),
    }

    try {
      if (currentStudent) {
        await api.put(createApiUrl(API_ROUTES.UPDATE_STUDENT(currentStudent.id.toString())), payload)
        toast.success("اطلاعات دانشجو با موفقیت به‌روزرسانی شد")
      } else {
        await api.post(createApiUrl(API_ROUTES.ADD_STUDENT), payload)
        toast.success("دانشجوی جدید با موفقیت اضافه شد")
      }

      setStudentDialogOpen(false)
      await fetchStudents()
    } catch (error) {
      console.error("Error saving student:", error)
      toast.error(currentStudent ? "خطا در به‌روزرسانی اطلاعات دانشجو" : "خطا در افزودن دانشجوی جدید")
    } finally {
      setIsStudentSubmitting(false)
    }
  }, [studentFormData, currentStudent, fetchStudents])

  const handleStudentDelete = useCallback(async () => {
    if (!currentStudent) return

    setIsStudentSubmitting(true)

    try {
      await api.delete(createApiUrl(API_ROUTES.DELETE_STUDENT(currentStudent.id.toString())))
      toast.success("دانشجو با موفقیت حذف شد")
      setStudentDeleteDialogOpen(false)
      await fetchStudents()
    } catch (error) {
      console.error("Error deleting student:", error)
      toast.error("خطا در حذف دانشجو")
    } finally {
      setIsStudentSubmitting(false)
    }
  }, [currentStudent, fetchStudents])

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
      <div className="flex flex-col h-full" dir="rtl">
        {/* Sticky Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-orange-100/80 bg-white flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500/10 to-amber-500/20 text-[#F47B20] border border-orange-200/50 flex items-center justify-center shrink-0 shadow-xs">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <DialogTitle className="text-base sm:text-lg font-black text-gray-900 tracking-tight">افزودن غذای جدید</DialogTitle>
            <DialogDescription className="text-xs text-gray-500 mt-0.5">مشخصات غذا، نرخ پایه و ژتون‌های مجاز را تعیین کنید</DialogDescription>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 pt-4 space-y-4 max-h-[calc(85vh-150px)] overflow-y-auto scrollbar-thin scrollbar-thumb-orange-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="food" className="text-xs font-bold text-gray-700">نام غذا <span className="text-rose-500">*</span></Label>
              <Input id="food" placeholder="مثال: زرشک پلو با مرغ" className="form-input-focus rounded-xl h-11 text-sm bg-gray-50/50 hover:bg-white focus:bg-white transition-colors" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="foodCategory" className="text-xs font-bold text-gray-700">دسته‌بندی غذا <span className="text-rose-500">*</span></Label>
              <select
                id="foodCategory"
                className="flex h-11 w-full rounded-xl border border-input bg-gray-50/50 hover:bg-white focus:bg-white px-3.5 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F47B20] focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 form-input-focus transition-colors"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="foodPrice" className="text-xs font-bold text-gray-700">قیمت آزاد غذا <span className="text-rose-500">*</span></Label>
              <div className="relative">
                <Input id="foodPrice" type="text" inputMode="numeric" placeholder="مثال: ۷۵۰۰۰" className="form-input-focus rounded-xl h-11 font-mono text-sm pl-14 bg-gray-50/50 hover:bg-white focus:bg-white transition-colors" />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 pointer-events-none">تومان</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="foodImage" className="text-xs font-bold text-gray-700">تصویر غذا</Label>
              <Input id="foodImage" type="file" accept="image/*" className="form-input-focus rounded-xl h-11 text-xs cursor-pointer bg-gray-50/50 hover:bg-white focus:bg-white file:cursor-pointer file:rounded-lg file:border-0 file:bg-orange-100/70 file:text-[#F47B20] file:font-bold file:text-xs file:py-1 file:px-2.5 hover:file:bg-orange-100 transition-colors" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="foodDescription" className="text-xs font-bold text-gray-700">توضیحات و ترکیبات غذا (اختیاری)</Label>
            <Input id="foodDescription" placeholder="مثال: برنج ایرانی اعلا به همراه ران مرغ سرخ‌شده و دورچین..." className="form-input-focus rounded-xl h-11 text-sm bg-gray-50/50 hover:bg-white focus:bg-white transition-colors" />
          </div>

          {/* Toggle for Extra Voucher */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-orange-200/60 bg-gradient-to-r from-orange-50/60 to-amber-50/30">
            <div className="space-y-0.5">
              <Label htmlFor="supports_extra_voucher" className="text-xs font-bold text-gray-900 cursor-pointer flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-[#F47B20]" />
                پشتیبانی از ژتون اضافی / آزاد
              </Label>
              <p className="text-[11px] text-gray-500">
                امکان رزرو پرس دوم یا سهمیه مازاد دانشجویان با نرخ ژتون آزاد
              </p>
            </div>
            <Switch
              id="supports_extra_voucher"
              name="supports_extra_voucher"
              defaultChecked={false}
            />
          </div>

          {/* Allowed Vouchers Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-[#F47B20]" />
                ژتون‌های مجاز برای خرید این غذا:
              </Label>
              <span className="text-[11px] text-gray-500 font-medium">({toPersianDigits(voucherTypes.length)} نوع ژتون فعال)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-0.5">
              {voucherTypes.map((vt) => (
                <label
                  key={vt.id}
                  className="relative flex items-center justify-between p-2.5 rounded-xl border border-gray-200/90 hover:border-orange-300 hover:bg-orange-50/40 cursor-pointer text-xs transition-all bg-white has-[:checked]:border-[#F47B20] has-[:checked]:bg-orange-50/60 has-[:checked]:shadow-2xs group"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="add_allowed_vouchers"
                      value={vt.id}
                      defaultChecked={true}
                      className="rounded text-[#F47B20] focus:ring-[#F47B20] h-4 w-4 border-gray-300"
                    />
                    <span className="font-bold text-gray-800">{vt.name}</span>
                  </div>
                  <span className="text-emerald-700 font-extrabold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60">
                    {formatPersianPrice(vt.discount_amount)} ت
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-2.5 mt-auto">
          <Button
            type="button"
            variant="outline"
            onClick={closeDialog}
            className="rounded-xl border-gray-200 h-11 px-5 text-gray-700 hover:bg-gray-100 font-semibold text-xs"
          >
            انصراف
          </Button>
          <Button
            onClick={async () => {
              const name = (document.getElementById("food") as HTMLInputElement).value
              const description = (document.getElementById("foodDescription") as HTMLInputElement).value
              const categorySelect = document.getElementById("foodCategory") as HTMLSelectElement
              const category = categorySelect?.value || ""
              const price = parsePersianInt((document.getElementById("foodPrice") as HTMLInputElement).value)
              const imageFile = (document.getElementById("foodImage") as HTMLInputElement).files?.[0]
              const switchElement = document.querySelector('button[role="switch"][id="supports_extra_voucher"]')
              const supportsExtraVoucher = switchElement?.getAttribute('data-state') === 'checked'

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
              const selectedVouchers = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="add_allowed_vouchers"]:checked')).map(el => el.value)
              selectedVouchers.forEach(id => formData.append("allowed_vouchers", id))
              formData.append("supports_extra_voucher", supportsExtraVoucher.toString())

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
            className="bg-gradient-to-r from-[#F47B20] to-[#E06A10] hover:from-[#E06A10] hover:to-[#D05A00] text-white rounded-xl font-bold h-11 px-6 shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center gap-2 text-xs"
          >
            <Plus className="w-4 h-4 ml-0.5" />
            افزودن غذای جدید
          </Button>
        </div>
      </div>,
    )
  }, [openDialog, closeDialog, fetchFoods, categories, voucherTypes])

  const handleEditFood = useCallback(
    (food: Food) => {
      openDialog(
        <div className="flex flex-col h-full" dir="rtl">
          {/* Sticky Header */}
          <div className="p-5 sm:p-6 pb-4 border-b border-orange-100/80 bg-white flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500/10 to-amber-500/20 text-[#F47B20] border border-orange-200/50 flex items-center justify-center shrink-0 shadow-xs">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-gray-900 tracking-tight">ویرایش غذا</DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">ویرایش اطلاعات، نرخ آزاد و ژتون‌های مجاز برای «{food.name}»</DialogDescription>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="p-5 sm:p-6 pt-4 space-y-4 max-h-[calc(85vh-150px)] overflow-y-auto scrollbar-thin scrollbar-thumb-orange-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="food" className="text-xs font-bold text-gray-700">نام غذا <span className="text-rose-500">*</span></Label>
                <Input id="food" defaultValue={food.name} className="form-input-focus rounded-xl h-11 text-sm bg-gray-50/50 hover:bg-white focus:bg-white transition-colors" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="foodCategory" className="text-xs font-bold text-gray-700">دسته‌بندی غذا <span className="text-rose-500">*</span></Label>
                <select
                  id="foodCategory"
                  className="flex h-11 w-full rounded-xl border border-input bg-gray-50/50 hover:bg-white focus:bg-white px-3.5 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F47B20] focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 form-input-focus transition-colors"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="foodPrice" className="text-xs font-bold text-gray-700">قیمت آزاد غذا <span className="text-rose-500">*</span></Label>
                <div className="relative">
                  <Input id="foodPrice" type="text" inputMode="numeric" defaultValue={toPersianDigits(food.price)} className="form-input-focus rounded-xl h-11 font-mono text-sm pl-14 bg-gray-50/50 hover:bg-white focus:bg-white transition-colors" />
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 pointer-events-none">تومان</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="foodImage" className="text-xs font-bold text-gray-700">تصویر غذا</Label>
                <div className="flex items-center gap-2.5">
                  <Input id="foodImage" type="file" accept="image/*" className="form-input-focus rounded-xl h-11 text-xs cursor-pointer bg-gray-50/50 hover:bg-white focus:bg-white file:cursor-pointer file:rounded-lg file:border-0 file:bg-orange-100/70 file:text-[#F47B20] file:font-bold file:text-xs file:py-1 file:px-2.5 hover:file:bg-orange-100 transition-colors" />
                  {food.image_url && (
                    <div className="relative h-11 w-11 shrink-0 rounded-xl overflow-hidden border border-orange-200 shadow-2xs">
                      <FoodImage
                        src={food.image_url}
                        alt={food.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="foodDescription" className="text-xs font-bold text-gray-700">توضیحات و ترکیبات غذا (اختیاری)</Label>
              <Input id="foodDescription" defaultValue={food.description} className="form-input-focus rounded-xl h-11 text-sm bg-gray-50/50 hover:bg-white focus:bg-white transition-colors" />
            </div>

            {/* Toggle for Extra Voucher */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-orange-200/60 bg-gradient-to-r from-orange-50/60 to-amber-50/30">
              <div className="space-y-0.5">
                <Label htmlFor="supports_extra_voucher" className="text-xs font-bold text-gray-900 cursor-pointer flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-[#F47B20]" />
                  پشتیبانی از ژتون اضافی / آزاد
                </Label>
                <p className="text-[11px] text-gray-500">
                  امکان رزرو پرس دوم یا سهمیه مازاد دانشجویان با نرخ ژتون آزاد
                </p>
              </div>
              <Switch
                id="supports_extra_voucher"
                name="supports_extra_voucher"
                defaultChecked={food.supports_extra_voucher || false}
              />
            </div>

            {/* Multi-tier voucher selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5 text-[#F47B20]" />
                  ژتون‌های مجاز برای خرید این غذا:
                </Label>
                <span className="text-[11px] text-gray-500 font-medium">({toPersianDigits(voucherTypes.length)} نوع ژتون فعال)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-0.5">
                {voucherTypes.map((vt) => {
                  const isChecked = food.allowed_vouchers?.some(v => v.id === vt.id) ?? true
                  return (
                    <label
                      key={vt.id}
                      className="relative flex items-center justify-between p-2.5 rounded-xl border border-gray-200/90 hover:border-orange-300 hover:bg-orange-50/40 cursor-pointer text-xs transition-all bg-white has-[:checked]:border-[#F47B20] has-[:checked]:bg-orange-50/60 has-[:checked]:shadow-2xs group"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="edit_allowed_vouchers"
                          value={vt.id}
                          defaultChecked={isChecked}
                          className="rounded text-[#F47B20] focus:ring-[#F47B20] h-4 w-4 border-gray-300"
                        />
                        <span className="font-bold text-gray-800">{vt.name}</span>
                      </div>
                      <span className="text-emerald-700 font-extrabold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60">
                        {formatPersianPrice(vt.discount_amount)} ت
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-2.5 mt-auto">
            <Button
              type="button"
              variant="outline"
              onClick={closeDialog}
              className="rounded-xl border-gray-200 h-11 px-5 text-gray-700 hover:bg-gray-100 font-semibold text-xs"
            >
              انصراف
            </Button>
            <Button
              onClick={async () => {
                const foodElement = document.getElementById("food") as HTMLInputElement
                const descriptionElement = document.getElementById("foodDescription") as HTMLInputElement
                const categoryElement = document.getElementById("foodCategory") as HTMLSelectElement
                const priceElement = document.getElementById("foodPrice") as HTMLInputElement
                const imageElement = document.getElementById("foodImage") as HTMLInputElement
                const switchElement = document.querySelector('button[role="switch"][id="supports_extra_voucher"]')

                if (!foodElement || !descriptionElement || !priceElement) {
                  toast.error("خطا در دریافت مقادیر فرم")
                  return
                }
                
                const name = foodElement.value
                const description = descriptionElement.value
                const category = categoryElement?.value
                const price = parsePersianInt(priceElement.value)
                const imageFile = imageElement?.files?.[0]
                const supportsExtraVoucher = switchElement?.getAttribute('data-state') === 'checked'

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
                const selectedVouchers = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="edit_allowed_vouchers"]:checked')).map(el => el.value)
                selectedVouchers.forEach(id => formData.append("allowed_vouchers", id))
                formData.append("supports_extra_voucher", supportsExtraVoucher.toString())

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
              className="bg-gradient-to-r from-[#F47B20] to-[#E06A10] hover:from-[#E06A10] hover:to-[#D05A00] text-white rounded-xl font-bold h-11 px-6 shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center gap-2 text-xs"
            >
              <Check className="w-4 h-4 ml-0.5" />
              ذخیره تغییرات غذا
            </Button>
          </div>
        </div>,
      )
    },
    [openDialog, closeDialog, fetchFoods, categories, voucherTypes],
  )

  const handleDeleteFood = useCallback(
    (food: Food) => {
      openDialog(
        <div className="flex flex-col h-full" dir="rtl">
          {/* Header */}
          <div className="p-5 sm:p-6 pb-4 border-b border-rose-100 bg-white flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200/70 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-gray-900 tracking-tight">حذف غذا</DialogTitle>
              <DialogDescription className="text-xs text-rose-600 font-medium mt-0.5">هشدار عملیات حساس و غیرقابل بازگشت</DialogDescription>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200/80 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900 space-y-1">
                <p className="font-bold">آیا از حذف این غذا از سیستم اطمینان دارید؟</p>
                <p className="text-rose-700/90 leading-relaxed">
                  با حذف غذای <strong className="text-rose-950 font-black">«{food.name}»</strong>، این غذا از تمام منوهای روزانه و الگو خارج شده و سوابق آن دیگر برای رزرو جدید در دسترس نخواهد بود.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-gray-200/70 bg-gray-50/60">
              <div className="relative h-11 w-11 shrink-0 rounded-xl overflow-hidden border border-gray-200 shadow-2xs">
                <FoodImage src={food.image_url} alt={food.name} fill className="object-cover" />
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-900">{food.name}</p>
                <p className="text-[11px] text-gray-500 font-mono mt-0.5">{formatPersianPrice(food.price)} تومان</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-2.5 mt-auto">
            <Button
              variant="outline"
              onClick={closeDialog}
              className="rounded-xl border-gray-200 h-11 px-5 text-gray-700 hover:bg-gray-100 font-semibold text-xs"
            >
              انصراف
            </Button>
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
              className="rounded-xl font-bold bg-rose-600 hover:bg-rose-700 h-11 px-6 shadow-md shadow-rose-600/20 text-xs flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              حذف قطعی غذا
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
              time_slot_count: parsePersianInt(time_slot_count),
              time_slot_capacity: parsePersianInt(time_slot_capacity),
              daily_capacity: parsePersianInt(daily_capacity),
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
          className="flex flex-col h-full"
          dir="rtl"
        >
          {/* Sticky Header */}
          <div className="p-5 sm:p-6 pb-4 border-b border-orange-100/80 bg-white flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500/10 to-amber-500/20 text-[#F47B20] border border-orange-200/50 flex items-center justify-center shrink-0 shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                {isTemplate ? "افزودن غذا به منوی الگو" : "افزودن غذا به منوی روزانه"}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">انتخاب غذا، زمان‌بندی توزیع و سقف ظرفیت رزرو</DialogDescription>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="p-5 sm:p-6 pt-4 space-y-4 max-h-[calc(85vh-150px)] overflow-y-auto scrollbar-thin scrollbar-thumb-orange-200">
            <div className="space-y-1.5">
              <Label htmlFor="foodSearch" className="text-xs font-bold text-gray-700">انتخاب غذا از فهرست <span className="text-rose-500">*</span></Label>
              <div className="relative">
                <div className="flex">
                  <Input
                    id="foodSearch"
                    type="text"
                    placeholder="جستجو و انتخاب غذا..."
                    className="form-input-focus rounded-xl h-11 text-sm w-full bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
                    onClick={() => {
                      const foodList = document.getElementById("foodList")
                      if (foodList) {
                        foodList.classList.remove("hidden")
                      }
                    }}
                    onChange={(e) => {
                      const searchValue = normalizeForSearch(e.target.value)
                      const foodList = document.getElementById("foodList")
                      if (foodList) {
                        foodList.classList.remove("hidden")
                        const items = foodList.getElementsByTagName("div")
                        let hasVisibleItems = false
                        for (let i = 0; i < items.length; i++) {
                          const foodName = items[i].textContent || ""
                          if (normalizeForSearch(foodName).includes(searchValue)) {
                            items[i].style.display = ""
                            hasVisibleItems = true
                          } else {
                            items[i].style.display = "none"
                          }
                        }
                        const noResults = document.getElementById("noFoodResults")
                        if (noResults) {
                          noResults.style.display = hasVisibleItems ? "none" : "block"
                        }
                      }
                    }}
                    onBlur={() => {
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
                  className="hidden absolute z-50 w-full max-h-48 overflow-y-auto mt-1 rounded-2xl border border-orange-100 bg-white/95 backdrop-blur-md shadow-xl scrollbar-thin scrollbar-thumb-orange-200 scrollbar-track-transparent p-1.5"
                  style={{ scrollbarWidth: "thin", scrollbarColor: "#fed7aa transparent" }}
                >
                  {foods.map((food) => (
                    <div
                      key={food.id}
                      className="p-2.5 cursor-pointer hover:bg-orange-50/80 rounded-xl transition-colors flex items-center gap-2.5"
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
                      <div className="relative h-8 w-8 rounded-lg overflow-hidden flex-shrink-0 border border-orange-100 shadow-2xs">
                        <FoodImage
                          src={food.image_url}
                          alt={food.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="truncate text-xs font-bold text-gray-800">{food.name}</span>
                      {food.supports_extra_voucher && (
                        <Badge variant="outline" className="mr-auto bg-blue-50 text-blue-700 text-[10px] border-blue-200">
                          ژتون اضافی
                        </Badge>
                      )}
                    </div>
                  ))}
                  <div id="noFoodResults" className="p-3 text-gray-400 text-center text-xs hidden">
                    هیچ غذایی یافت نشد
                  </div>
                </div>
                <input type="hidden" id="food" name="food" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="start_time" className="text-xs font-bold text-gray-700">زمان شروع سرو <span className="text-rose-500">*</span></Label>
                <div className="relative">
                  <Input id="start_time" name="start_time" type="time" required className="form-input-focus rounded-xl h-11 font-mono text-sm pl-9 bg-gray-50/50 hover:bg-white focus:bg-white transition-colors" />
                  <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end_time" className="text-xs font-bold text-gray-700">زمان پایان سرو <span className="text-rose-500">*</span></Label>
                <div className="relative">
                  <Input id="end_time" name="end_time" type="time" required className="form-input-focus rounded-xl h-11 font-mono text-sm pl-9 bg-gray-50/50 hover:bg-white focus:bg-white transition-colors" />
                  <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="time_slot_count" className="text-xs font-bold text-gray-700">تعداد بازه‌ها</Label>
                <Input
                  id="time_slot_count"
                  name="time_slot_count"
                  type="number"
                  min={1}
                  required
                  placeholder="مثال: ۴"
                  className="form-input-focus rounded-xl h-11 font-mono text-sm bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="time_slot_capacity" className="text-xs font-bold text-gray-700">ظرفیت هر بازه</Label>
                <Input
                  id="time_slot_capacity"
                  name="time_slot_capacity"
                  type="number"
                  min={1}
                  required
                  placeholder="مثال: ۵۰"
                  className="form-input-focus rounded-xl h-11 font-mono text-sm bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="daily_capacity" className="text-xs font-bold text-gray-700">ظرفیت کل روزانه</Label>
                <Input
                  id="daily_capacity"
                  name="daily_capacity"
                  type="number"
                  min={1}
                  required
                  placeholder="مثال: ۲۰۰"
                  className="form-input-focus rounded-xl h-11 font-mono text-sm bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-2.5 mt-auto">
            <Button
              type="button"
              variant="outline"
              onClick={closeDialog}
              className="rounded-xl border-gray-200 h-11 px-5 text-gray-700 hover:bg-gray-100 font-semibold text-xs"
            >
              انصراف
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-[#F47B20] to-[#E06A10] hover:from-[#E06A10] hover:to-[#D05A00] text-white rounded-xl font-bold h-11 px-6 shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center gap-2 text-xs"
            >
              <Plus className="w-4 h-4 ml-0.5" />
              افزودن به منو
            </Button>
          </div>
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
              time_slot_count: parsePersianInt(time_slot_count),
              time_slot_capacity: parsePersianInt(time_slot_capacity),
              daily_capacity: parsePersianInt(daily_capacity),
              food_category_id: foodCategory ? parsePersianInt(foodCategory) : null,
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
          className="flex flex-col h-full"
          dir="rtl"
        >
          {/* Sticky Header */}
          <div className="p-5 sm:p-6 pb-4 border-b border-orange-100/80 bg-white flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500/10 to-amber-500/20 text-[#F47B20] border border-orange-200/50 flex items-center justify-center shrink-0 shadow-xs">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-gray-900 tracking-tight">ویرایش غذای منو</DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">ویرایش ساعت توزیع و سقف ظرفیت‌های رزرو</DialogDescription>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="p-5 sm:p-6 pt-4 space-y-4 max-h-[calc(85vh-150px)] overflow-y-auto scrollbar-thin scrollbar-thumb-orange-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="foodSearch" className="text-xs font-bold text-gray-700">غذا <span className="text-rose-500">*</span></Label>
                <div className="relative">
                  <div className="flex">
                    <Input
                      id="foodSearch"
                      type="text"
                      placeholder="جستجو و انتخاب غذا..."
                      defaultValue={item.food?.name}
                      className="form-input-focus rounded-xl h-11 text-sm w-full bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
                      onClick={() => {
                        const foodList = document.getElementById("foodList")
                        if (foodList) {
                          foodList.classList.remove("hidden")
                        }
                      }}
                      onChange={(e) => {
                        const searchValue = normalizeForSearch(e.target.value)
                        const foodList = document.getElementById("foodList")
                        if (foodList) {
                          foodList.classList.remove("hidden")
                          const items = foodList.getElementsByTagName("div")
                          let hasVisibleItems = false
                          for (let i = 0; i < items.length; i++) {
                            const foodName = items[i].textContent || ""
                            if (normalizeForSearch(foodName).includes(searchValue)) {
                              items[i].style.display = ""
                              hasVisibleItems = true
                            } else {
                              items[i].style.display = "none"
                            }
                          }
                          const noResults = document.getElementById("noFoodResults")
                          if (noResults) {
                            noResults.style.display = hasVisibleItems ? "none" : "block"
                          }
                        }
                      }}
                      onBlur={() => {
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
                    className="hidden absolute z-50 w-full max-h-48 overflow-y-auto mt-1 rounded-2xl border border-orange-100 bg-white/95 backdrop-blur-md shadow-xl scrollbar-thin scrollbar-thumb-orange-200 scrollbar-track-transparent p-1.5"
                    style={{ scrollbarWidth: "thin", scrollbarColor: "#fed7aa transparent" }}
                  >
                    {foods.map((food) => (
                      <div
                        key={food.id}
                        className="p-2.5 cursor-pointer hover:bg-orange-50/80 rounded-xl transition-colors flex items-center gap-2.5"
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
                        <div className="relative h-8 w-8 rounded-lg overflow-hidden flex-shrink-0 border border-orange-100 shadow-2xs">
                          <FoodImage
                            src={food.image_url}
                            alt={food.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="truncate text-xs font-bold text-gray-800">{food.name}</span>
                        {food.supports_extra_voucher && (
                          <Badge variant="outline" className="mr-auto bg-blue-50 text-blue-700 text-[10px] border-blue-200">
                            ژتون اضافی
                          </Badge>
                        )}
                      </div>
                    ))}
                    <div id="noFoodResults" className="p-3 text-gray-400 text-center text-xs hidden">
                      هیچ غذایی یافت نشد
                    </div>
                  </div>
                  <input type="hidden" id="food" name="food" defaultValue={item.food?.name} required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="foodCategory" className="text-xs font-bold text-gray-700">دسته‌بندی غذا</Label>
                <Select name="foodCategory" defaultValue={item.food.category_id?.toString()}>
                  <SelectTrigger className="form-input-focus rounded-xl h-11 text-sm bg-gray-50/50 hover:bg-white focus:bg-white transition-colors">
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
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="start_time" className="text-xs font-bold text-gray-700">زمان شروع سرو <span className="text-rose-500">*</span></Label>
                <div className="relative">
                  <Input
                    id="start_time"
                    name="start_time"
                    type="time"
                    defaultValue={item.start_time}
                    required
                    className="form-input-focus rounded-xl h-11 font-mono text-sm pl-9 bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
                  />
                  <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end_time" className="text-xs font-bold text-gray-700">زمان پایان سرو <span className="text-rose-500">*</span></Label>
                <div className="relative">
                  <Input
                    id="end_time"
                    name="end_time"
                    type="time"
                    defaultValue={item.end_time}
                    required
                    className="form-input-focus rounded-xl h-11 font-mono text-sm pl-9 bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
                  />
                  <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="time_slot_count" className="text-xs font-bold text-gray-700">تعداد بازه‌ها</Label>
                <Input
                  id="time_slot_count"
                  name="time_slot_count"
                  type="number"
                  defaultValue={item.time_slot_count}
                  min={1}
                  required
                  className="form-input-focus rounded-xl h-11 font-mono text-sm bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="time_slot_capacity" className="text-xs font-bold text-gray-700">ظرفیت هر بازه</Label>
                <Input
                  id="time_slot_capacity"
                  name="time_slot_capacity"
                  type="number"
                  defaultValue={item.time_slot_capacity}
                  min={1}
                  required
                  className="form-input-focus rounded-xl h-11 font-mono text-sm bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="daily_capacity" className="text-xs font-bold text-gray-700">ظرفیت کل روزانه</Label>
                <Input
                  id="daily_capacity"
                  name="daily_capacity"
                  type="number"
                  defaultValue={item.daily_capacity}
                  min={1}
                  required
                  className="form-input-focus rounded-xl h-11 font-mono text-sm bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-2.5 mt-auto">
            <Button
              type="button"
              variant="outline"
              onClick={closeDialog}
              className="rounded-xl border-gray-200 h-11 px-5 text-gray-700 hover:bg-gray-100 font-semibold text-xs"
            >
              انصراف
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-[#F47B20] to-[#E06A10] hover:from-[#E06A10] hover:to-[#D05A00] text-white rounded-xl font-bold h-11 px-6 shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center gap-2 text-xs"
            >
              <Check className="w-4 h-4 ml-0.5" />
              ذخیره تغییرات منو
            </Button>
          </div>
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

  const formatPersianDateTime = (isoDate: string) => {
    const date = new Date(isoDate)
    const persianDate = new DateObject(date).setCalendar(persian).setLocale(persian_fa)

    // Format date in Persian
    const persianDateStr = persianDate.format("YYYY/MM/DD")
    // Format time in 24-hour format
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")

    return `${toPersianDigits(persianDateStr)} - ${toPersianDigits(hours)}:${toPersianDigits(minutes)}`
  }

  const getStatusText = (status: string) => {
    const statusTexts = {
      waiting: "در انتظار",
      preparing: "در حال آماده‌سازی",
      ready_to_pickup: "آماده تحویل",
      picked_up: "تحویل داده شده",
      not_picked_up: "تحویل گرفته نشده",
    }
    return statusTexts[status as keyof typeof statusTexts] || "وضعیت ناشناخته"
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "waiting":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "preparing":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "ready_to_pickup":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "picked_up":
        return "bg-green-50 text-green-700 border-green-200"
      case "not_picked_up":
        return "bg-rose-50 text-rose-700 border-rose-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#FAF7F2] text-gray-900" dir="rtl">
      {/* Ambient Brand Atmosphere (preserving signature orange glow & warm background) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-[-10%] w-[650px] h-[650px] rounded-full bg-gradient-to-br from-orange-400/15 via-amber-300/10 to-transparent blur-3xl blob-animate-1" />
        <div className="absolute -bottom-40 left-[-10%] w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-orange-500/15 via-rose-300/10 to-transparent blur-3xl blob-animate-2" />
      </div>

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#FFF",
            color: "#1F2937",
            borderRadius: "0.85rem",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            border: "1px solid rgba(244, 123, 32, 0.15)",
          },
        }}
      />

      {/* Elevated Top Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/85 border-b border-orange-100 shadow-xs">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile Sheet Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="hover:bg-orange-50">
                  <Menu className="h-5 w-5 text-gray-700" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] p-0" dir="rtl">
                <div className="flex flex-col h-full bg-gradient-to-b from-orange-50/40 to-white">
                  {/* Brand in Drawer */}
                  <div className="p-5 border-b border-orange-100 flex items-center gap-3">
                    <div className="relative h-10 w-10 rounded-xl bg-orange-100/60 p-1.5 flex items-center justify-center">
                      <Image src="/images/javanfoods_logo.png" alt="رستوران جوان" fill sizes="40px" className="object-contain p-1" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">رستوران جوان</h3>
                      <p className="text-[11px] text-orange-600 font-medium">پنل مدیریت سامانه</p>
                    </div>
                  </div>

                  {/* Nav in Drawer */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {navigationSections.map((sec) => (
                      <div key={sec.title} className="space-y-1">
                        <p className="text-[11px] font-semibold text-gray-400 px-3 uppercase tracking-wider">
                          {sec.title}
                        </p>
                        {sec.items.map((item) => {
                          const IconComp = item.icon
                          const isActive = activeTab === item.id || (item.id === "vouchers" && activeTab === "voucher-price")
                          return (
                            <button
                              key={item.id}
                              onClick={() => setActiveTab(item.id)}
                              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                                isActive
                                  ? "bg-gradient-to-r from-[#F47B20] to-[#E06A10] text-white font-semibold shadow-md shadow-orange-500/20"
                                  : "text-gray-600 hover:text-[#F47B20] hover:bg-orange-50 font-medium"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <IconComp className={`h-4 w-4 ${isActive ? "text-white" : "text-gray-500"}`} />
                                <span>{item.label}</span>
                              </div>
                              {item.badge !== undefined && (
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    isActive ? "bg-white/20 text-white" : "bg-orange-100/80 text-orange-700"
                                  }`}
                                >
                                  {toPersianDigits(item.badge)}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Bottom Logout */}
                  <div className="p-4 border-t border-orange-100">
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                    >
                      <LogOut className="ml-2 h-4 w-4" />
                      خروج از حساب کاربری
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Brand Logo & Name */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-11 w-11 rounded-xl bg-orange-50 border border-orange-200/60 p-1 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
                <Image src="/images/javanfoods_logo.png" alt="رستوران جوان" fill sizes="44px" className="object-contain p-1" priority />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-gray-900 tracking-tight">رستوران جوان</span>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-[#F47B20] text-[10px] font-bold">
                    پنل مدیریت
                  </span>
                </div>
                <span className="text-xs text-gray-500 hidden sm:block">سامانه جامع تغذیه دانشگاهی</span>
              </div>
            </Link>

            {/* System Status Indicator */}
            <div className="hidden lg:flex items-center gap-2 mr-4 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>سامانه متصل و فعال</span>
            </div>
          </div>

          {/* Left Side Header Controls */}
          <div className="flex items-center gap-3">
            {todayPersianDate && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50/70 border border-orange-100 text-xs text-orange-950 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#F47B20]" />
                <span>{todayPersianDate}</span>
              </div>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      fetchFoods()
                      fetchCategories()
                      fetchVoucherTypes()
                      fetchStudents()
                      toast.success("اطلاعات بروزرسانی شد")
                    }}
                    className="h-9 w-9 rounded-xl text-gray-500 hover:text-[#F47B20] hover:bg-orange-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>بروزرسانی داده‌ها</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Admin Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-orange-50/80">
                  <div className="hidden sm:flex flex-col items-start text-right">
                    <span className="text-xs font-bold text-gray-900 leading-tight">مدیر سیستم</span>
                    <span className="text-[10px] text-orange-600 font-medium leading-tight mt-0.5">ادمین ارشد سلف</span>
                  </div>
                  <Avatar className="h-8 w-8 ring-2 ring-[#F47B20]/20">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt="مدیر سیستم" />
                    <AvatarFallback className="bg-gradient-to-br from-[#F47B20] to-amber-500 text-white text-xs font-bold">
                      مدیر
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none text-gray-900">مدیر سیستم جوان</p>
                    <p className="text-xs leading-none text-muted-foreground">admin@javanfoods.ir</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActiveTab("dashboard")}>
                  <Home className="ml-2 h-4 w-4 text-gray-500" />
                  <span>داشبورد اصلی</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/")}>
                  <Utensils className="ml-2 h-4 w-4 text-gray-500" />
                  <span>مشاهده صفحه دانشجویی</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("open-whats-new"))
                  }}
                  className="cursor-pointer text-amber-600 focus:text-amber-700 focus:bg-amber-50"
                >
                  <Sparkles className="ml-2 h-4 w-4 text-amber-500" />
                  <span>امکانات و تغییرات جدید</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("open-pwa-install"))
                  }}
                  className="cursor-pointer text-orange-600 focus:text-orange-700 focus:bg-orange-50"
                >
                  <Smartphone className="ml-2 h-4 w-4 text-orange-500" />
                  <span>نصب نسخه اپلیکیشن (PWA)</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                  <LogOut className="ml-2 h-4 w-4" />
                  <span>خروج از حساب</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="container mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-6 min-h-[calc(100vh-4rem)]">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0">
          <Card className="sticky top-24 flex-1 backdrop-blur-xl bg-white/90 border border-orange-100 shadow-sm rounded-2xl flex flex-col justify-between overflow-hidden">
            <CardContent className="p-3.5 space-y-4">
              {navigationSections.map((sec) => (
                <div key={sec.title} className="space-y-1">
                  <p className="text-[11px] font-semibold text-gray-400 px-3 uppercase tracking-wider">
                    {sec.title}
                  </p>
                  <div className="space-y-0.5">
                    {sec.items.map((item) => {
                      const IconComp = item.icon
                      const isActive = activeTab === item.id || (item.id === "vouchers" && activeTab === "voucher-price")
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs lg:text-sm transition-all duration-150 ${
                            isActive
                              ? "bg-gradient-to-r from-[#F47B20] to-[#E06A10] text-white font-bold shadow-md shadow-orange-500/20"
                              : "text-gray-600 hover:text-[#F47B20] hover:bg-orange-50/80 font-medium"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <IconComp className={`h-4 w-4 ${isActive ? "text-white" : "text-gray-500"}`} />
                            <span>{item.label}</span>
                          </div>
                          {item.badge !== undefined && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                isActive ? "bg-white/20 text-white" : "bg-orange-100/80 text-orange-700"
                              }`}
                            >
                              {toPersianDigits(item.badge)}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </CardContent>

            {/* Sidebar Bottom Card */}
            <div className="p-3.5 border-t border-orange-100/80 bg-orange-50/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-orange-100 text-[#F47B20] flex items-center justify-center font-bold text-xs">
                    جوان
                  </div>
                  <div className="text-[11px]">
                    <p className="font-bold text-gray-900 leading-tight">رستوران جوان</p>
                    <p className="text-gray-400">نسخه ۲.۴.۰</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="خروج"
                  className="h-8 w-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              {/* Dashboard Tab */}
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  {/* Hero Welcome Card */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-orange-500/10 via-amber-500/5 to-white/60 border border-orange-200/60 p-6 backdrop-blur-md shadow-xs">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#F47B20]/15 text-[#F47B20]">
                            مرکز فرماندهی سامانه
                          </span>
                          <span className="text-xs text-gray-300">|</span>
                          <span className="text-xs text-gray-500">{todayPersianDate}</span>
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 mt-2">
                          خوش آمدید، مدیر سیستم 👋
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          گزارش برخط وضعیت سفارشات، ظرفیت سلف‌ها و رزروهای رستوران جوان در یک نگاه
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Button
                          onClick={handleAddFood}
                          className="bg-[#F47B20] hover:bg-[#E06A10] text-white shadow-sm flex items-center gap-1.5 rounded-xl text-xs font-semibold px-4 py-2"
                        >
                          <Plus className="w-4 h-4" />
                          افزودن غذای جدید
                        </Button>
                        <Button
                          onClick={() => setActiveTab("daily-menu")}
                          variant="outline"
                          className="bg-white/80 hover:bg-orange-50 border-orange-200 text-gray-800 rounded-xl text-xs font-semibold"
                        >
                          <Calendar className="w-4 h-4 ml-1.5 text-[#F47B20]" />
                          تنظیم منوی روز
                        </Button>
                        <Button
                          onClick={() => setActiveTab("vouchers")}
                          variant="outline"
                          className="bg-white/80 hover:bg-orange-50 border-orange-200 text-gray-800 rounded-xl text-xs font-semibold"
                        >
                          <Ticket className="w-4 h-4 ml-1.5 text-[#F47B20]" />
                          مدیریت ژتون‌ها
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* 4 StatCards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      icon={Utensils}
                      title="غذاهای منو"
                      value={totalFoods}
                      gradient="from-[#F47B20] to-amber-500"
                      subtitle="غذاهای تعریف‌شده در سیستم"
                      trend="فعال در سلف"
                      onClick={() => setActiveTab("food")}
                    />
                    <StatCard
                      icon={Clipboard}
                      title="دسته‌بندی‌های فعال"
                      value={totalCategories}
                      gradient="from-amber-500 to-orange-400"
                      subtitle="گروه‌بندی اقلام غذایی"
                      trend="گروه فعال"
                      onClick={() => setActiveTab("categories")}
                    />
                    <StatCard
                      icon={Calendar}
                      title="رزروهای امروز"
                      value={todayReservations}
                      gradient="from-emerald-500 to-teal-500"
                      subtitle="سفارشات تحویل امروز"
                      trend="آماده‌سازی سلف"
                      onClick={() => setActiveTab("analytics")}
                    />
                    <StatCard
                      icon={User}
                      title="کل سفارشات ثبت‌شده"
                      value={totalReservations}
                      gradient="from-blue-500 to-indigo-500"
                      subtitle="تاریخچه کلی رزروها"
                      trend="کل تراکنش‌ها"
                      onClick={() => setActiveTab("analytics")}
                    />
                  </div>

                  {/* Order Chart */}
                  <Card className="backdrop-blur-xl bg-white/90 border border-orange-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-orange-100/60 pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-[#F47B20]" />
                            آمار سفارشات و تحویل‌های روزانه (۷ روز اخیر)
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            روند تغییرات سفارشات دریافت شده در مقایسه با غذاهای تحویل داده شده به دانشجویان
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-orange-50 text-[#F47B20] border-orange-200 text-xs">
                          بروزرسانی زنده
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <div className="w-full h-[320px]">
                        <Line data={getPast7DaysOrderData()} options={chartOptions} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* 2 Columns: Recent Foods + Recent Reservations */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Foods */}
                    <Card className="backdrop-blur-xl bg-white/90 border border-orange-100 shadow-sm rounded-2xl overflow-hidden">
                      <CardHeader className="border-b border-orange-100/60 pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <Utensils className="h-4 w-4 text-[#F47B20]" />
                            جدیدترین غذاهای افزوده شده
                          </CardTitle>
                          <Badge variant="outline" className="text-xs font-normal">
                            {toPersianDigits(foods.length)} غذا
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        {foods.slice(0, 5).map((food) => (
                          <div
                            key={food.id}
                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-orange-50/70 border border-transparent hover:border-orange-100 transition-all duration-150"
                          >
                            <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-orange-50 shrink-0 border border-orange-100 shadow-2xs">
                              <FoodImage
                                src={food.image_url}
                                alt={food.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm text-gray-900 truncate">{food.name}</h4>
                              <p className="text-xs font-medium text-emerald-600 mt-0.5">
                                {formatPersianPrice(food.price)} تومان
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <Badge variant="outline" className="bg-orange-50/80 text-orange-800 text-[10px] border-orange-200">
                                {food.category_name || "بدون گروه"}
                              </Badge>
                              {food.supports_extra_voucher && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 text-[10px] border-blue-200">
                                  ژتون اضافی
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                      <CardFooter className="border-t border-orange-100/60 pt-3">
                        <Button
                          variant="ghost"
                          className="w-full text-[#F47B20] hover:text-[#E06A10] hover:bg-orange-50 font-bold text-xs"
                          onClick={() => setActiveTab("food")}
                        >
                          مشاهده و ویرایش همه غذاها ←
                        </Button>
                      </CardFooter>
                    </Card>

                    {/* Recent Reservations */}
                    <Card className="backdrop-blur-xl bg-white/90 border border-orange-100 shadow-sm rounded-2xl overflow-hidden">
                      <CardHeader className="border-b border-orange-100/60 pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[#F47B20]" />
                            آخرین رزروهای ثبت‌شده
                          </CardTitle>
                          <Badge variant="outline" className="text-xs font-normal">
                            {toPersianDigits(reservationLogs.length)} ثبت شده
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        {reservationLogs.length === 0 ? (
                          <div className="text-center py-8 text-gray-400 text-xs">
                            هنوز هیچ رزروی ثبت نشده است
                          </div>
                        ) : (
                          reservationLogs.slice(0, 5).map((log) => (
                            <div
                              key={log.id}
                              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-orange-50/70 border border-transparent hover:border-orange-100 transition-all duration-150"
                            >
                              <div className="relative h-10 w-10 rounded-xl bg-orange-100 text-[#F47B20] flex items-center justify-center shrink-0">
                                <User className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm text-gray-900 truncate">{log.student}</h4>
                                <p className="text-xs text-gray-500 mt-0.5 truncate">
                                  {log.food} • {formatPersianDateTime(log.created_at)}
                                </p>
                              </div>
                              <Badge variant="outline" className={`text-[10px] shrink-0 ${getStatusBadgeClass(log.status)}`}>
                                {getStatusText(log.status)}
                              </Badge>
                            </div>
                          ))
                        )}
                      </CardContent>
                      <CardFooter className="border-t border-orange-100/60 pt-3">
                        <Button
                          variant="ghost"
                          className="w-full text-[#F47B20] hover:text-[#E06A10] hover:bg-orange-50 font-bold text-xs"
                          onClick={() => setActiveTab("analytics")}
                        >
                          مشاهده گزارش کامل رزروها ←
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </div>
              )}

              {/* Food Management Tab */}
              {activeTab === "food" && (
                <div className="space-y-6">
                  <Card className="backdrop-blur-xl bg-white/90 border border-orange-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-orange-100/60 pb-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Utensils className="h-5 w-5 text-[#F47B20]" />
                            مدیریت و فهرست غذاهای سلف
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            تعریف غذاهای جدید، تخصیص دسته‌بندی، قیمت‌گذاری و تعیین ژتون‌های مجاز برای هر غذا
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          {/* Search Input */}
                          <div className="relative w-full sm:w-64">
                            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                              value={foodSearch}
                              onChange={(e) => setFoodSearch(e.target.value)}
                              placeholder="جستجوی نام یا توضیحات..."
                              className="pr-9 rounded-xl form-input-focus text-xs h-9 bg-white"
                            />
                          </div>

                          {/* Category Filter */}
                          <Select value={foodCategoryFilter} onValueChange={setFoodCategoryFilter}>
                            <SelectTrigger className="w-full sm:w-40 rounded-xl text-xs h-9 bg-white">
                              <SelectValue placeholder="فیلتر دسته‌بندی" />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                              <SelectItem value="all">همه دسته‌ها</SelectItem>
                              <SelectItem value="uncategorized">بدون دسته‌بندی</SelectItem>
                              {categories.map((c) => (
                                <SelectItem key={c.id} value={c.id.toString()}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {/* Add Food Button */}
                          <Button
                            onClick={handleAddFood}
                            className="bg-[#F47B20] hover:bg-[#E06A10] text-white shadow-sm flex items-center gap-1.5 rounded-xl text-xs font-semibold h-9 px-4"
                          >
                            <Plus className="w-4 h-4" /> افزودن غذای جدید
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-orange-50/50 hover:bg-orange-50/50">
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">تصویر</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">نام غذا</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">دسته‌بندی</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">توضیحات</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">قیمت (تومان)</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">ژتون‌های مجاز</TableHead>
                              <TableHead className="text-center font-bold text-gray-700 text-xs py-3.5 px-4">عملیات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredFoods.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                                  <Utensils className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                                  <p className="text-sm">هیچ غذایی با این مشخصات یافت نشد</p>
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredFoods.map((food) => (
                                <TableRow key={food.id} className="hover:bg-orange-50/40 transition-colors">
                                  <TableCell className="py-3 px-4">
                                    <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-orange-50 border border-orange-100 shadow-xs">
                                      <FoodImage
                                        src={food.image_url}
                                        alt={food.name}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-bold text-gray-900 py-3 px-4">
                                    <div>{food.name}</div>
                                    {food.supports_extra_voucher && (
                                      <span className="inline-block mt-0.5 text-[10px] text-blue-600 bg-blue-50 px-2 py-0.2 rounded-full border border-blue-150">
                                        پشتیبانی از ژتون اضافی
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="py-3 px-4">
                                    <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-200 text-xs">
                                      {food.category_name || "بدون دسته‌بندی"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="max-w-[200px] truncate text-xs text-gray-600 py-3 px-4">
                                    {food.description || "-"}
                                  </TableCell>
                                  <TableCell className="font-bold text-gray-900 text-sm py-3 px-4">
                                    {formatPersianPrice(food.price)}
                                  </TableCell>
                                  <TableCell className="py-3 px-4">
                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                      {food.allowed_vouchers && food.allowed_vouchers.length > 0 ? (
                                        food.allowed_vouchers.map((v) => (
                                          <Badge
                                            key={v.id}
                                            variant="outline"
                                            className="bg-orange-50 text-[#F47B20] border-orange-200 text-[10px] font-mono"
                                          >
                                            {v.code}
                                          </Badge>
                                        ))
                                      ) : (
                                        <span className="text-[11px] text-gray-400">همه ژتون‌ها</span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-3 px-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleEditFood(food)}
                                        title="ویرایش غذا"
                                        className="h-8 w-8 rounded-lg text-blue-600 bg-blue-50/60 hover:bg-blue-100 hover:text-blue-700 border-blue-200/60"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => handleDeleteFood(food)}
                                        title="حذف غذا"
                                        className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 border border-rose-200/60"
                                      >
                                        <Trash className="w-3.5 h-3.5" />
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
                </div>
              )}

              {/* Categories Tab */}
              {activeTab === "categories" && (
                <div className="space-y-6">
                  <Card className="backdrop-blur-xl bg-white/90 border border-orange-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-orange-100/60 pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Clipboard className="h-5 w-5 text-[#F47B20]" />
                            مدیریت دسته‌بندی‌های منوی غذا
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            تعریف دسته‌بندی‌های غذایی (مانند خورش‌ها، کباب‌ها، خوراک و دسر) برای نظم‌بخشی به منوی سلف
                          </p>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="relative w-full sm:w-60">
                            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                              value={categorySearch}
                              onChange={(e) => setCategorySearch(e.target.value)}
                              placeholder="جستجوی دسته‌بندی..."
                              className="pr-9 rounded-xl form-input-focus text-xs h-9 bg-white"
                            />
                          </div>
                          <Button
                            onClick={handleAddCategory}
                            className="bg-[#F47B20] hover:bg-[#E06A10] text-white shadow-sm flex items-center gap-1.5 rounded-xl text-xs font-semibold h-9 px-4 shrink-0"
                          >
                            <Plus className="w-4 h-4" /> افزودن دسته‌بندی
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-orange-50/50 hover:bg-orange-50/50">
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">نام دسته‌بندی</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">توضیحات</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">تاریخ تعریف</TableHead>
                              <TableHead className="text-center font-bold text-gray-700 text-xs py-3.5 px-4">عملیات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCategories.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-12 text-gray-400">
                                  هیچ دسته‌بندی یافت نشد
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredCategories.map((category) => (
                                <TableRow key={category.id} className="hover:bg-orange-50/40 transition-colors">
                                  <TableCell className="font-bold text-gray-900 py-3.5 px-4 flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-lg bg-orange-100 text-[#F47B20] flex items-center justify-center font-bold text-xs">
                                      {category.name[0]}
                                    </div>
                                    <span>{category.name}</span>
                                  </TableCell>
                                  <TableCell className="text-xs text-gray-600 py-3.5 px-4">{category.description || "-"}</TableCell>
                                  <TableCell className="text-xs text-gray-500 py-3.5 px-4">
                                    {toPersianDigits(new Date(category.created_at).toLocaleDateString("fa-IR"))}
                                  </TableCell>
                                  <TableCell className="py-3.5 px-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleEditCategory(category)}
                                        title="ویرایش دسته‌بندی"
                                        className="h-8 w-8 rounded-lg text-blue-600 bg-blue-50/60 hover:bg-blue-100 border-blue-200/60"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => handleDeleteCategory(category)}
                                        title="حذف دسته‌بندی"
                                        className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/60"
                                      >
                                        <Trash className="w-3.5 h-3.5" />
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
                </div>
              )}

              {/* Template Menu Tab */}
              {activeTab === "template-menu" && (
                <div className="space-y-6">
                  <Card className="backdrop-blur-xl bg-white/90 border border-orange-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-orange-100/60 pb-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-[#F47B20]" />
                            مدیریت منوی هفتگی الگو (پیش‌فرض)
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            تعریف برنامه غذایی ثابت هفتگی برای استفاده مکرر در روزهای سال بدون نیاز به تعریف مجدد
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <Select value={selectedDay} onValueChange={setSelectedDay}>
                            <SelectTrigger className="w-full sm:w-36 rounded-xl text-xs h-9 bg-white">
                              <SelectValue placeholder="انتخاب روز هفته" />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
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
                            <SelectTrigger className="w-full sm:w-32 rounded-xl text-xs h-9 bg-white">
                              <SelectValue placeholder="وعده غذایی" />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                              <SelectItem value="lunch">ناهار</SelectItem>
                              <SelectItem value="dinner">شام</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            onClick={() => handleAddMenuItem(true)}
                            className="bg-[#F47B20] hover:bg-[#E06A10] text-white shadow-sm flex items-center gap-1.5 rounded-xl text-xs font-semibold h-9 px-4 shrink-0"
                          >
                            <Plus className="w-4 h-4" /> افزودن غذا به منوی الگو
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-orange-50/50 hover:bg-orange-50/50">
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">عنوان غذا و جزئیات</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">بازه زمانی سرو</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">ظرفیت روزانه</TableHead>
                              <TableHead className="text-center font-bold text-gray-700 text-xs py-3.5 px-4">عملیات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {!templateMenu || templateMenu.items.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-12 text-gray-400">
                                  هیچ غذایی در منوی الگو برای این روز و وعده تنظیم نشده است
                                </TableCell>
                              </TableRow>
                            ) : (
                              templateMenu.items.map((item: MenuItemSpec, index) => (
                                <TableRow key={index} className="hover:bg-orange-50/40 transition-colors">
                                  <TableCell className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-gray-900 text-sm">{item.food?.name}</span>
                                      {item.food?.supports_extra_voucher && (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 text-[10px] border-blue-200">
                                          ژتون اضافی
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-emerald-600 font-medium mt-0.5">
                                      {formatPersianPrice(item.food?.price)} تومان
                                    </p>
                                  </TableCell>
                                  <TableCell className="text-xs text-gray-600 py-3 px-4 font-mono dir-ltr text-right">
                                    {toPersianDigits(item.start_time)} - {toPersianDigits(item.end_time)}
                                  </TableCell>
                                  <TableCell className="py-3 px-4">
                                    <Badge variant="outline" className="bg-orange-50 text-[#F47B20] border-orange-200 font-bold text-xs">
                                      {toPersianDigits(item.daily_capacity)} پرس
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-3 px-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleEditMenuItem(item, true)}
                                        title="ویرایش آیتم"
                                        className="h-8 w-8 rounded-lg text-blue-600 bg-blue-50/60 hover:bg-blue-100 border-blue-200/60"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => handleDeleteMenuItem(item.id, true)}
                                        title="حذف آیتم"
                                        className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/60"
                                      >
                                        <Trash className="w-3.5 h-3.5" />
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
                </div>
              )}

              {/* Daily Menu Tab */}
              {activeTab === "daily-menu" && (
                <div className="space-y-6">
                  <Card className="backdrop-blur-xl bg-white/90 border border-orange-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-orange-100/60 pb-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-[#F47B20]" />
                            مدیریت منوی روزانه سلف
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            تنظیم غذاهای فعال برای هر روز تقویمی، مدیریت ظرفیت و فعال‌سازی سریع با منوی الگو
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <DatePicker
                            value={selectedDate}
                            onChange={handleDateChange}
                            calendar={persian}
                            locale={persian_fa}
                            calendarPosition="bottom-right"
                            inputClass="w-full sm:w-40 px-3 py-2 rounded-xl border border-input bg-white text-xs h-9 form-input-focus"
                            containerClassName="w-full sm:w-40"
                            placeholder="انتخاب تاریخ"
                          />

                          <Select
                            value={selectedMeal_type}
                            onValueChange={(value: "lunch" | "dinner") => setSelectedMeal_type(value)}
                          >
                            <SelectTrigger className="w-full sm:w-32 rounded-xl text-xs h-9 bg-white">
                              <SelectValue placeholder="وعده غذایی" />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                              <SelectItem value="lunch">ناهار</SelectItem>
                              <SelectItem value="dinner">شام</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            onClick={() => handleAddMenuItem(false)}
                            className="bg-[#F47B20] hover:bg-[#E06A10] text-white shadow-sm flex items-center gap-1.5 rounded-xl text-xs font-semibold h-9 px-4 shrink-0"
                          >
                            <Plus className="w-4 h-4" /> افزودن غذا
                          </Button>

                          <Button
                            onClick={handleUseTemplateForDaily}
                            variant="outline"
                            className="bg-white hover:bg-orange-50 border-orange-200 text-gray-800 rounded-xl text-xs font-semibold h-9 px-3.5 shrink-0"
                          >
                            <Calendar className="w-4 h-4 ml-1.5 text-[#F47B20]" />
                            استفاده از منوی الگو
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-orange-50/50 hover:bg-orange-50/50">
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">عنوان غذا و جزئیات</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">بازه زمانی</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">ظرفیت کل</TableHead>
                              <TableHead className="text-center font-bold text-gray-700 text-xs py-3.5 px-4">وضعیت فعال بودن</TableHead>
                              <TableHead className="text-center font-bold text-gray-700 text-xs py-3.5 px-4">عملیات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {!dailyMenu || dailyMenu.items.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                                  هیچ غذایی در منوی روزانه برای این تاریخ و وعده تنظیم نشده است. با دکمه «استفاده از منوی الگو» به سرعت منو را پر کنید.
                                </TableCell>
                              </TableRow>
                            ) : (
                              dailyMenu.items.map((item: MenuItemSpec, index) => (
                                <TableRow key={index} className="hover:bg-orange-50/40 transition-colors">
                                  <TableCell className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-gray-900 text-sm">{item.food?.name}</span>
                                      {item.food?.supports_extra_voucher && (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 text-[10px] border-blue-200">
                                          ژتون اضافی
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-emerald-600 font-medium mt-0.5">
                                      {formatPersianPrice(item.food?.price)} تومان
                                    </p>
                                  </TableCell>
                                  <TableCell className="text-xs text-gray-600 py-3 px-4 font-mono dir-ltr text-right">
                                    {toPersianDigits(item.start_time)} - {toPersianDigits(item.end_time)}
                                  </TableCell>
                                  <TableCell className="py-3 px-4">
                                    <Badge variant="outline" className="bg-orange-50 text-[#F47B20] border-orange-200 font-bold text-xs">
                                      {toPersianDigits(item.daily_capacity)} پرس
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-3 px-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <Switch
                                        checked={item.is_available}
                                        onCheckedChange={(checked) => handleToggleAvailability(item.id, checked)}
                                      />
                                      <span className={`text-xs font-bold ${item.is_available ? "text-emerald-600" : "text-rose-500"}`}>
                                        {item.is_available ? "فعال در سلف" : "غیرفعال"}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-3 px-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleEditMenuItem(item, false)}
                                        title="ویرایش آیتم"
                                        className="h-8 w-8 rounded-lg text-blue-600 bg-blue-50/60 hover:bg-blue-100 border-blue-200/60"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => handleDeleteMenuItem(item.id, false)}
                                        title="حذف آیتم"
                                        className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/60"
                                      >
                                        <Trash className="w-3.5 h-3.5" />
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
                </div>
              )}

              {/* Vouchers Management Tab */}
              {(activeTab === "vouchers" || activeTab === "voucher-price") && (
                <div className="space-y-6">
                  {/* Top Stats Overview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="backdrop-blur-xl bg-white/90 border border-orange-100/70 shadow-xs hover:shadow-md transition-shadow rounded-2xl">
                      <CardContent className="p-5 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold">انواع ژتون تعریف‌شده</p>
                          <h3 className="text-2xl font-black text-gray-900 mt-1">
                            {toPersianDigits(voucherTypes.length)} <span className="text-xs font-normal text-gray-500">نوع</span>
                          </h3>
                        </div>
                        <div className="p-3 bg-gradient-to-br from-orange-400 to-[#F47B20] text-white rounded-2xl shadow-sm shadow-orange-500/20">
                          <Ticket className="h-6 w-6" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="backdrop-blur-xl bg-white/90 border border-emerald-150 shadow-xs hover:shadow-md transition-shadow rounded-2xl">
                      <CardContent className="p-5 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold">ژتون‌های فعال در سامانه</p>
                          <h3 className="text-2xl font-black text-emerald-600 mt-1">
                            {toPersianDigits(voucherTypes.filter((v) => v.is_active).length)} <span className="text-xs font-normal text-gray-500">مورد</span>
                          </h3>
                        </div>
                        <div className="p-3 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-2xl shadow-sm shadow-emerald-500/20">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="backdrop-blur-xl bg-white/90 border border-blue-150 shadow-xs hover:shadow-md transition-shadow rounded-2xl">
                      <CardContent className="p-5 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold">بیشترین سقف یارانه</p>
                          <h3 className="text-2xl font-black text-blue-600 mt-1">
                            {voucherTypes.length > 0
                              ? formatPersianPrice(Math.max(...voucherTypes.map((v) => Number(v.discount_amount))))
                              : "۰"}{" "}
                            <span className="text-xs font-normal text-gray-500">تومان</span>
                          </h3>
                        </div>
                        <div className="p-3 bg-gradient-to-br from-blue-400 to-indigo-500 text-white rounded-2xl shadow-sm shadow-blue-500/20">
                          <Sparkles className="h-6 w-6" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="backdrop-blur-xl bg-white/90 border border-purple-150 shadow-xs hover:shadow-md transition-shadow rounded-2xl">
                      <CardContent className="p-5 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold">میانگین تخفیف ژتون</p>
                          <h3 className="text-2xl font-black text-purple-600 mt-1">
                            {voucherTypes.length > 0
                              ? formatPersianPrice(
                                  Math.round(
                                    voucherTypes.reduce((acc, curr) => acc + Number(curr.discount_amount), 0) /
                                      voucherTypes.length,
                                  ),
                                )
                              : "۰"}{" "}
                            <span className="text-xs font-normal text-gray-500">تومان</span>
                          </h3>
                        </div>
                        <div className="p-3 bg-gradient-to-br from-purple-400 to-violet-500 text-white rounded-2xl shadow-sm shadow-purple-500/20">
                          <DollarSign className="h-6 w-6" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Main Vouchers Table Card */}
                  <Card className="backdrop-blur-xl bg-white/90 border border-orange-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-orange-100/60 pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Ticket className="h-5 w-5 text-[#F47B20]" />
                            مدیریت انواع ژتون و تخفیف‌ها
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            تعریف ژتون‌های چندسطحی سامانه، مبالغ یارانه تخصیصی و فعال/غیرفعال کردن آنی برای سلف‌ها
                          </p>
                        </div>
                        <Button
                          onClick={handleOpenAddVoucher}
                          className="bg-[#F47B20] hover:bg-[#E06A10] text-white shadow-sm flex items-center gap-1.5 rounded-xl text-xs font-semibold h-9 px-4"
                        >
                          <Plus className="h-4 w-4" />
                          افزودن ژتون جدید
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-orange-50/50 hover:bg-orange-50/50">
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">کد شناسه</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">عنوان نمایشی</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">مبلغ یارانه / تخفیف</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">توضیحات و کاربرد</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">غذاهای مجاز</TableHead>
                              <TableHead className="text-center font-bold text-gray-700 text-xs py-3.5 px-4">وضعیت فعال</TableHead>
                              <TableHead className="text-center font-bold text-gray-700 text-xs py-3.5 px-4">عملیات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {voucherTypes.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                                  هیچ ژتونی تعریف نشده است. با دکمه «افزودن ژتون جدید» اولین ژتون را ایجاد کنید.
                                </TableCell>
                              </TableRow>
                            ) : (
                              voucherTypes.map((vt) => {
                                const eligibleFoodsCount = foods.filter((f) =>
                                  f.allowed_vouchers?.some((v) => v.id === vt.id),
                                ).length

                                return (
                                  <TableRow key={vt.id} className="hover:bg-orange-50/40 transition-colors">
                                    <TableCell className="py-3 px-4">
                                      <Badge variant="outline" className="font-mono bg-orange-50 text-[#F47B20] border-orange-200 text-xs">
                                        {toPersianDigits(vt.code)}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="font-bold text-gray-900 text-sm py-3 px-4">
                                      {vt.name}
                                    </TableCell>
                                    <TableCell className="py-3 px-4">
                                      <span className="font-extrabold text-emerald-600 text-sm">
                                        {formatPersianPrice(vt.discount_amount)} تومان
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-xs text-gray-600 max-w-[200px] truncate py-3 px-4">
                                      {vt.description || "-"}
                                    </TableCell>
                                    <TableCell className="py-3 px-4">
                                      <Badge variant="outline" className="bg-gray-50 text-gray-700 text-xs border-gray-200">
                                        {toPersianDigits(eligibleFoodsCount)} غذای مجاز
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <Switch
                                          checked={vt.is_active}
                                          onCheckedChange={() => handleToggleVoucherActive(vt)}
                                        />
                                        <span className={`text-xs font-bold ${vt.is_active ? "text-emerald-600" : "text-gray-400"}`}>
                                          {vt.is_active ? "فعال" : "غیرفعال"}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-center">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={() => handleOpenEditVoucher(vt)}
                                          title="ویرایش ژتون"
                                          className="h-8 w-8 rounded-lg text-blue-600 bg-blue-50/60 hover:bg-blue-100 border-blue-200/60"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          size="icon"
                                          onClick={() => handleOpenDeleteVoucher(vt)}
                                          title="حذف ژتون"
                                          className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/60"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Students Management Tab */}
              {activeTab === "students" && (
                <div className="space-y-6">
                  <Card className="backdrop-blur-xl bg-white/90 border border-orange-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-orange-100/60 pb-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <User className="h-5 w-5 text-[#F47B20]" />
                            مدیریت و پرونده دانشجویان
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            مشاهده اطلاعات هویتی، امتیاز اعتبار، دانشکده و مدیریت سقف رزرو کاربران
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                          <div className="relative w-full sm:w-72">
                            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                              value={studentSearch}
                              onChange={(e) => setStudentSearch(e.target.value)}
                              placeholder="جستجو (نام، شماره دانشجویی، تلفن)..."
                              className="pr-9 rounded-xl form-input-focus text-xs h-9 bg-white"
                              dir="rtl"
                            />
                          </div>
                          <Button
                            onClick={handleAddStudent}
                            className="bg-[#F47B20] hover:bg-[#E06A10] text-white shadow-sm flex items-center gap-1.5 rounded-xl text-xs font-semibold h-9 px-4 shrink-0"
                          >
                            <Plus className="w-4 h-4 ml-1" /> افزودن دانشجو
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-orange-50/50 hover:bg-orange-50/50">
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">دانشجو</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">شماره دانشجویی</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">دانشکده</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">اطلاعات تماس</TableHead>
                              <TableHead className="text-center font-bold text-gray-700 text-xs py-3.5 px-4">امتیاز اعتبار</TableHead>
                              <TableHead className="text-center font-bold text-gray-700 text-xs py-3.5 px-4">وضعیت</TableHead>
                              <TableHead className="text-center font-bold text-gray-700 text-xs py-3.5 px-4">عملیات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredStudents.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                                  هیچ دانشجویی یافت نشد
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredStudents.map((student) => (
                                <TableRow key={student.id} className="hover:bg-orange-50/40 transition-colors">
                                  <TableCell className="font-bold text-gray-900 py-3.5 px-4">
                                    <div className="flex items-center gap-2.5">
                                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 text-[#F47B20] flex items-center justify-center font-bold text-xs shrink-0">
                                        {student.name[0]}
                                      </div>
                                      <span>{student.name}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-mono text-xs text-gray-600 py-3.5 px-4">{toPersianDigits(student.student_id)}</TableCell>
                                  <TableCell className="text-xs text-gray-600 py-3.5 px-4">{student.department}</TableCell>
                                  <TableCell className="text-xs text-gray-500 py-3.5 px-4">
                                    <div>{toPersianDigits(student.phone)}</div>
                                    <div className="text-[10px] text-gray-400">{student.email}</div>
                                  </TableCell>
                                  <TableCell className="py-3.5 px-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <Badge
                                        variant="outline"
                                        className={`font-bold text-xs ${
                                          student.trust_score >= 80
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : student.trust_score >= 50
                                            ? "bg-amber-50 text-amber-700 border-amber-200"
                                            : "bg-rose-50 text-rose-700 border-rose-200"
                                        }`}
                                      >
                                        {toPersianDigits(student.trust_score)}
                                      </Badge>
                                      {student.trust_score < 100 && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRecoverTrustScore(student)}
                                          className="text-xs h-7 px-2 text-[#F47B20] hover:text-[#E06A10] hover:bg-orange-50"
                                        >
                                          بازیابی
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-3.5 px-4 text-center">
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] ${
                                        student.status === "active"
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : "bg-gray-50 text-gray-500 border-gray-200"
                                      }`}
                                    >
                                      {student.status === "active" ? "فعال" : "غیرفعال"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-3.5 px-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleEditStudent(student)}
                                        title="ویرایش دانشجو"
                                        className="h-8 w-8 rounded-lg text-blue-600 bg-blue-50/60 hover:bg-blue-100 border-blue-200/60"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => handleDeleteStudent(student)}
                                        title="حذف دانشجو"
                                        className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/60"
                                      >
                                        <Trash className="w-3.5 h-3.5" />
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
                </div>
              )}

              {/* Payments Tab */}
              {activeTab === "payments" && (
                <div className="space-y-6">
                  <Card className="backdrop-blur-xl bg-white/90 border border-orange-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-orange-100/60 pb-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-[#F47B20]" />
                            مدیریت تراکنش‌ها و پرداخت‌های بانکی
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            پیگیری وضعیت تراکنش‌ها، شماره پیگیری شاپرک و استعلام آنی درگاه
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <div className="relative w-full sm:w-64">
                            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                              type="text"
                              placeholder="شناسه پرداخت یا شماره کاربر..."
                              className="pr-9 rounded-xl form-input-focus text-xs h-9 bg-white"
                              value={pagination.search}
                              onChange={(e) => {
                                setPagination((prev) => ({
                                  ...prev,
                                  search: e.target.value,
                                }))
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  fetchPayments(1, pagination.search, pagination.status)
                                }
                              }}
                            />
                          </div>
                          <Select
                            value={pagination.status}
                            onValueChange={(value: PaymentFilterStatus) => {
                              setPagination((prev) => ({
                                ...prev,
                                status: value,
                              }))
                              fetchPayments(1, pagination.search, value)
                            }}
                          >
                            <SelectTrigger className="w-full sm:w-40 rounded-xl text-xs h-9 bg-white">
                              <SelectValue placeholder="وضعیت تراکنش" />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                              <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                              <SelectItem value="pending">در انتظار پرداخت</SelectItem>
                              <SelectItem value="paid">پرداخت شده</SelectItem>
                              <SelectItem value="failed">ناموفق</SelectItem>
                              <SelectItem value="refunded">مسترد شده</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            onClick={() => fetchPayments(1, pagination.search, pagination.status)}
                            disabled={paymentLoading}
                            className="bg-[#F47B20] hover:bg-[#E06A10] text-white shadow-sm flex items-center gap-1.5 rounded-xl text-xs font-semibold h-9 px-4 shrink-0"
                          >
                            <Search className="h-4 w-4 ml-1" />
                            {paymentLoading ? "در حال جستجو..." : "جستجو"}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-orange-50/50 hover:bg-orange-50/50">
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">شناسه پرداخت</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">دانشجو / کاربر</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">مبلغ (تومان)</TableHead>
                              <TableHead className="text-center font-bold text-gray-700 text-xs py-3.5 px-4">وضعیت</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">تاریخ پرداخت</TableHead>
                              <TableHead className="text-center font-bold text-gray-700 text-xs py-3.5 px-4">عملیات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paymentLoading ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                                  در حال بارگذاری اطلاعات پرداخت‌ها...
                                </TableCell>
                              </TableRow>
                            ) : payments.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                                  هیچ تراکنشی یافت نشد
                                </TableCell>
                              </TableRow>
                            ) : (
                              payments.map((payment) => (
                                <TableRow key={payment.id} className="hover:bg-orange-50/40 transition-colors">
                                  <TableCell className="font-mono text-xs text-gray-700 py-3.5 px-4">{toPersianDigits(payment.id)}</TableCell>
                                  <TableCell className="py-3.5 px-4">
                                    <div className="font-bold text-gray-900 text-sm">{payment.user.full_name}</div>
                                    <div className="text-xs text-gray-400">{toPersianDigits(payment.user.phone_number)}</div>
                                  </TableCell>
                                  <TableCell className="font-bold text-gray-900 text-sm py-3.5 px-4">
                                    {formatPersianPrice(payment.amount)} تومان
                                  </TableCell>
                                  <TableCell className="py-3.5 px-4 text-center">
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${
                                        payment.status === "paid"
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : payment.status === "pending"
                                          ? "bg-amber-50 text-amber-700 border-amber-200"
                                          : payment.status === "refunded"
                                          ? "bg-blue-50 text-blue-700 border-blue-200"
                                          : "bg-rose-50 text-rose-700 border-rose-200"
                                      }`}
                                    >
                                      {payment.status === "paid"
                                        ? "پرداخت شده"
                                        : payment.status === "pending"
                                        ? "در انتظار پرداخت"
                                        : payment.status === "refunded"
                                        ? "مسترد شده"
                                        : "ناموفق"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs text-gray-600 py-3.5 px-4">
                                    {toPersianDigits(new Date(payment.created_at).toLocaleString("fa-IR"))}
                                  </TableCell>
                                  <TableCell className="py-3.5 px-4 text-center">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => inquirePayment(payment.authority)}
                                      disabled={paymentLoading}
                                      className="rounded-lg text-xs h-8 border-orange-200 hover:bg-orange-50 text-[#F47B20]"
                                    >
                                      استعلام وضعیت
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      {/* Pagination Bar */}
                      <div className="flex items-center justify-between p-4 border-t border-orange-100/60 bg-orange-50/20">
                        <div className="text-xs text-muted-foreground">
                          نمایش {toPersianDigits((pagination.page - 1) * pagination.pageSize + 1)} تا{" "}
                          {toPersianDigits(Math.min(pagination.page * pagination.pageSize, pagination.total))} از {toPersianDigits(pagination.total)} تراکنش
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchPayments(pagination.page - 1, pagination.search, pagination.status)}
                            disabled={!pagination.hasPrevious || paymentLoading}
                            className="rounded-lg text-xs h-8 px-3"
                          >
                            <ChevronRight className="w-4 h-4 ml-1" />
                            قبلی
                          </Button>
                          <span className="text-xs font-bold text-gray-700 px-2">صفحه {toPersianDigits(pagination.page)}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchPayments(pagination.page + 1, pagination.search, pagination.status)}
                            disabled={!pagination.hasNext || paymentLoading}
                            className="rounded-lg text-xs h-8 px-3"
                          >
                            بعدی
                            <ChevronLeft className="w-4 h-4 mr-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === "analytics" && (
                <div className="space-y-6">
                  <Card className="backdrop-blur-xl bg-white/90 border border-orange-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-orange-100/60 pb-4">
                      <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <BarChart2 className="h-5 w-5 text-[#F47B20]" />
                        آمار، گزارشات و تحلیل مصرف غذای دانشگاه
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        تحلیل نموداری سفارشات روزانه و فهرست کامل گزارش رزروهای دانشجویان
                      </p>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <Tabs defaultValue="reservation-logs" className="w-full">
                        <TabsList className="mb-4 bg-orange-50/60 p-1 rounded-xl">
                          <TabsTrigger value="reservation-logs" className="rounded-lg text-xs">گزارش کلی رزروها</TabsTrigger>
                          <TabsTrigger value="daily-orders" className="rounded-lg text-xs">نمودار سفارشات روزانه</TabsTrigger>
                        </TabsList>
                        <TabsContent value="reservation-logs">
                          <div className="overflow-x-auto rounded-xl border border-orange-100">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-orange-50/50 hover:bg-orange-50/50">
                                  <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">شناسه / دانشجو</TableHead>
                                  <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">نام غذا</TableHead>
                                  <TableHead className="text-right font-bold text-gray-700 text-xs py-3.5 px-4">تاریخ و زمان رزرو</TableHead>
                                  <TableHead className="text-center font-bold text-gray-700 text-xs py-3.5 px-4">وضعیت سفارش</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {reservationLogs.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12 text-gray-400">
                                      هیچ رزروی یافت نشد
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  reservationLogs.map((log) => (
                                    <TableRow key={log.id} className="hover:bg-orange-50/40 transition-colors">
                                      <TableCell className="font-bold text-gray-900 py-3.5 px-4">{log.student}</TableCell>
                                      <TableCell className="text-sm text-gray-800 py-3.5 px-4">{log.food}</TableCell>
                                      <TableCell className="text-xs text-gray-600 py-3.5 px-4">
                                        {formatPersianDateTime(log.created_at)}
                                      </TableCell>
                                      <TableCell className="py-3.5 px-4 text-center">
                                        <Badge variant="outline" className={`text-xs ${getStatusBadgeClass(log.status)}`}>
                                          {getStatusText(log.status)}
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
                          <div className="w-full h-[400px] p-2">
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
        <DialogContent className="sm:max-w-[580px] p-0 overflow-hidden backdrop-blur-xl bg-white border border-orange-100/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] rounded-3xl" dir="rtl">
          {dialogContent}
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden backdrop-blur-xl bg-white border border-orange-100/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] rounded-3xl" dir="rtl">
          <div className="p-5 sm:p-6 pb-4 border-b border-orange-100/80 bg-white flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500/10 to-amber-500/20 text-[#F47B20] border border-orange-200/50 flex items-center justify-center shrink-0 shadow-xs">
              <Clipboard className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                {currentCategory ? "ویرایش دسته‌بندی" : "افزودن دسته‌بندی جدید"}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">دسته‌بندی‌ها برای طبقه‌بندی غذاهای سلف به کار می‌روند</DialogDescription>
            </div>
          </div>
          <div className="p-5 sm:p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold text-gray-700">نام دسته‌بندی <span className="text-rose-500">*</span></Label>
              <Input
                id="name"
                name="name"
                value={categoryFormData.name}
                onChange={handleCategoryInputChange}
                placeholder="مثال: غذاهای سنتی و خورشت‌ها"
                className="form-input-focus rounded-xl h-11 text-sm bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-bold text-gray-700">توضیحات (اختیاری)</Label>
              <Textarea
                id="description"
                name="description"
                value={categoryFormData.description || ""}
                onChange={handleCategoryInputChange}
                placeholder="توضیح کوتاه درباره این گروه غذایی..."
                rows={3}
                className="form-input-focus rounded-xl text-sm bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
              />
            </div>
          </div>
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              onClick={() => setCategoryDialogOpen(false)}
              disabled={isCategorySubmitting}
              className="rounded-xl border-gray-200 h-11 px-5 text-gray-700 hover:bg-gray-100 font-semibold text-xs"
            >
              انصراف
            </Button>
            <Button
              onClick={handleCategorySubmit}
              className="bg-gradient-to-r from-[#F47B20] to-[#E06A10] hover:from-[#E06A10] hover:to-[#D05A00] text-white rounded-xl font-bold h-11 px-6 shadow-md shadow-orange-500/20 text-xs flex items-center gap-1.5"
              disabled={isCategorySubmitting}
            >
              <Check className="w-4 h-4 ml-0.5" />
              {isCategorySubmitting ? "در حال ذخیره..." : currentCategory ? "به‌روزرسانی دسته‌بندی" : "افزودن دسته‌بندی"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Delete Dialog */}
      <Dialog open={categoryDeleteDialogOpen} onOpenChange={setCategoryDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden backdrop-blur-xl bg-white border border-rose-100 shadow-[0_25px_60px_-15px_rgba(225,29,72,0.2)] rounded-3xl" dir="rtl">
          <div className="p-5 sm:p-6 pb-4 border-b border-rose-100 bg-white flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200/70 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-rose-600 tracking-tight">
                حذف دسته‌بندی
              </DialogTitle>
              <DialogDescription className="text-xs text-rose-600/80 font-medium mt-0.5">هشدار عملیات حذف گروه غذایی</DialogDescription>
            </div>
          </div>
          <div className="p-5 sm:p-6 space-y-3.5">
            <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200/80 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900 space-y-1">
                <p className="font-bold">آیا از حذف دسته‌بندی اطمینان دارید؟</p>
                <p className="text-rose-700/90 leading-relaxed">
                  آیا از حذف دسته‌بندی <strong className="text-rose-950 font-black">«{currentCategory?.name}»</strong> اطمینان دارید؟ اگر این دسته‌بندی به یک یا چند غذا اختصاص داشته باشد، سیستم اجازه حذف آن را نخواهد داد.
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              onClick={() => setCategoryDeleteDialogOpen(false)}
              disabled={isCategorySubmitting}
              className="rounded-xl border-gray-200 h-11 px-5 text-gray-700 hover:bg-gray-100 font-semibold text-xs"
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={handleCategoryDelete}
              disabled={isCategorySubmitting}
              className="rounded-xl font-bold bg-rose-600 hover:bg-rose-700 h-11 px-6 shadow-md shadow-rose-600/20 text-xs flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4 ml-0.5" />
              {isCategorySubmitting ? "در حال حذف..." : "حذف دسته‌بندی"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recover Trust Score Confirm Dialog */}
      <Dialog open={recoverConfirmOpen} onOpenChange={setRecoverConfirmOpen}>
        <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden backdrop-blur-xl bg-white border border-orange-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] rounded-3xl" dir="rtl">
          <div className="p-5 sm:p-6 pb-4 border-b border-orange-100/80 bg-white flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500/10 to-amber-500/20 text-[#F47B20] border border-orange-200/50 flex items-center justify-center shrink-0 shadow-xs">
              <User className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                تایید بازیابی امتیاز اعتبار
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">افزایش و بازیابی نمره انضباطی دانشجو</DialogDescription>
            </div>
          </div>
          <div className="p-5 sm:p-6 space-y-3.5">
            <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200/60 flex items-start gap-3">
              <Info className="w-5 h-5 text-[#F47B20] shrink-0 mt-0.5" />
              <div className="text-xs text-gray-800 space-y-1.5">
                <p className="leading-relaxed">
                  آیا از بازیابی امتیاز اعتبار برای دانشجو{" "}
                  <strong className="text-gray-950 font-black">{recoverTarget?.name}</strong>{" "}
                  با شماره دانشجویی{" "}
                  <span className="font-mono bg-white px-2 py-0.5 rounded-lg text-orange-700 font-bold border border-orange-200 shadow-2xs">
                    {toPersianDigits(recoverTarget?.student_id)}
                  </span>{" "}
                  مطمئن هستید؟
                </p>
                {recoverTarget && (
                  <p className="text-gray-500 pt-1 border-t border-orange-100">
                    امتیاز فعلی دانشجو: <strong className="text-gray-900 font-bold">{toPersianDigits(recoverTarget.trust_score)}</strong>
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              onClick={() => setRecoverConfirmOpen(false)}
              disabled={isTrustScoreSubmitting}
              className="rounded-xl border-gray-200 h-11 px-5 text-gray-700 hover:bg-gray-100 font-semibold text-xs"
            >
              انصراف
            </Button>
            <Button
              onClick={confirmRecoverTrustScore}
              className="bg-gradient-to-r from-[#F47B20] to-[#E06A10] hover:from-[#E06A10] hover:to-[#D05A00] text-white rounded-xl font-bold h-11 px-6 shadow-md shadow-orange-500/20 text-xs flex items-center gap-1.5"
              disabled={isTrustScoreSubmitting}
            >
              <Check className="w-4 h-4 ml-0.5" />
              {isTrustScoreSubmitting ? "در حال انجام..." : "تایید بازیابی"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trust Score Recovery Dialog */}
      <Dialog open={trustScoreDialogOpen} onOpenChange={setTrustScoreDialogOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden backdrop-blur-xl bg-white border border-orange-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] rounded-3xl" dir="rtl">
          <div className="p-5 sm:p-6 pb-4 border-b border-orange-100/80 bg-white flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500/10 to-amber-500/20 text-[#F47B20] border border-orange-200/50 flex items-center justify-center shrink-0 shadow-xs">
              <User className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                بازیابی امتیاز اعتبار دانشجو
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">افزایش دستی امتیاز اعتماد و حذف محدودیت رزرو</DialogDescription>
            </div>
          </div>
          <div className="p-5 sm:p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="user_id" className="text-xs font-bold text-gray-700">شناسه کاربری دانشجو</Label>
              <Input
                id="user_id"
                name="user_id"
                type="number"
                value={trustScoreFormData.user_id || ""}
                onChange={handleTrustScoreInputChange}
                placeholder="شناسه دانشجو"
                className="form-input-focus rounded-xl h-11 font-mono text-sm bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
                readOnly={trustScoreFormData.user_id > 0}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="points" className="text-xs font-bold text-gray-700">تعداد امتیاز برای بازیابی <span className="text-rose-500">*</span></Label>
              <Input
                id="points"
                name="points"
                type="number"
                min="1"
                value={trustScoreFormData.points}
                onChange={handleTrustScoreInputChange}
                placeholder="تعداد امتیاز"
                className="form-input-focus rounded-xl h-11 font-mono text-sm bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reason" className="text-xs font-bold text-gray-700">علت بازیابی امتیاز (اختیاری)</Label>
              <Textarea
                id="reason"
                name="reason"
                value={trustScoreFormData.reason || ""}
                onChange={handleTrustScoreInputChange}
                placeholder="علت افزایش یا بازیابی نمره اعتبار..."
                rows={3}
                className="form-input-focus rounded-xl text-sm bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
              />
            </div>
          </div>
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              onClick={() => setTrustScoreDialogOpen(false)}
              disabled={isTrustScoreSubmitting}
              className="rounded-xl border-gray-200 h-11 px-5 text-gray-700 hover:bg-gray-100 font-semibold text-xs"
            >
              انصراف
            </Button>
            <Button
              onClick={handleTrustScoreSubmit}
              className="bg-gradient-to-r from-[#F47B20] to-[#E06A10] hover:from-[#E06A10] hover:to-[#D05A00] text-white rounded-xl font-bold h-11 px-6 shadow-md shadow-orange-500/20 text-xs flex items-center gap-1.5"
              disabled={isTrustScoreSubmitting}
            >
              <Check className="w-4 h-4 ml-0.5" />
              {isTrustScoreSubmitting ? "در حال ذخیره..." : "بازیابی امتیاز"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Dialog */}
      <Dialog open={studentDialogOpen} onOpenChange={setStudentDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden backdrop-blur-xl bg-white border border-orange-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] rounded-3xl" dir="rtl">
          <div className="p-5 sm:p-6 pb-4 border-b border-orange-100/80 bg-white flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500/10 to-amber-500/20 text-[#F47B20] border border-orange-200/50 flex items-center justify-center shrink-0 shadow-xs">
              <User className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                {currentStudent ? "ویرایش اطلاعات دانشجو" : "افزودن دانشجوی جدید"}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">مدیریت حساب و اطلاعات هویتی دانشجو در سلف</DialogDescription>
            </div>
          </div>
          <div className="p-5 sm:p-6 space-y-4 max-h-[calc(85vh-150px)] overflow-y-auto scrollbar-thin scrollbar-thumb-orange-200">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold text-gray-700">نام و نام خانوادگی <span className="text-rose-500">*</span></Label>
              <Input
                id="name"
                name="name"
                value={studentFormData.name}
                onChange={handleStudentInputChange}
                placeholder="مثال: علی رضایی"
                className="form-input-focus rounded-xl h-11 text-sm bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="student_id" className="text-xs font-bold text-gray-700">شماره دانشجویی <span className="text-rose-500">*</span></Label>
                <Input
                  id="student_id"
                  name="student_id"
                  value={studentFormData.student_id}
                  onChange={handleStudentInputChange}
                  placeholder="مثال: 40112345"
                  className="form-input-focus rounded-xl h-11 font-mono text-sm bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-bold text-gray-700">شماره تماس همراه <span className="text-rose-500">*</span></Label>
                <Input
                  id="phone"
                  name="phone"
                  value={studentFormData.phone}
                  onChange={handleStudentInputChange}
                  placeholder="مثال: 09121111111"
                  className="form-input-focus rounded-xl h-11 font-mono text-sm bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="department" className="text-xs font-bold text-gray-700">دانشکده</Label>
                <Input
                  id="department"
                  name="department"
                  value={studentFormData.department}
                  onChange={handleStudentInputChange}
                  placeholder="مثال: مهندسی کامپیوتر"
                  className="form-input-focus rounded-xl h-11 text-sm bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-bold text-gray-700">وضعیت حساب</Label>
                <Select
                  name="status"
                  value={studentFormData.status}
                  onValueChange={(value) =>
                    setStudentFormData({ ...studentFormData, status: value as "active" | "inactive" })
                  }
                >
                  <SelectTrigger className="form-input-focus rounded-xl h-11 text-sm bg-gray-50/50 hover:bg-white focus:bg-white transition-colors">
                    <SelectValue placeholder="انتخاب وضعیت" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="active">فعال</SelectItem>
                    <SelectItem value="inactive">غیرفعال</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-gray-700">پست الکترونیکی (ایمیل)</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={studentFormData.email}
                onChange={handleStudentInputChange}
                placeholder="student@university.ac.ir"
                className="form-input-focus rounded-xl h-11 font-mono text-left text-sm bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
                dir="ltr"
              />
            </div>
          </div>
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              onClick={() => setStudentDialogOpen(false)}
              disabled={isStudentSubmitting}
              className="rounded-xl border-gray-200 h-11 px-5 text-gray-700 hover:bg-gray-100 font-semibold text-xs"
            >
              انصراف
            </Button>
            <Button
              onClick={handleStudentSubmit}
              className="bg-gradient-to-r from-[#F47B20] to-[#E06A10] hover:from-[#E06A10] hover:to-[#D05A00] text-white rounded-xl font-bold h-11 px-6 shadow-md shadow-orange-500/20 text-xs flex items-center gap-1.5"
              disabled={isStudentSubmitting}
            >
              <Check className="w-4 h-4 ml-0.5" />
              {isStudentSubmitting ? "در حال ذخیره..." : currentStudent ? "به‌روزرسانی اطلاعات" : "افزودن دانشجو"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Delete Dialog */}
      <Dialog open={studentDeleteDialogOpen} onOpenChange={setStudentDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden backdrop-blur-xl bg-white border border-rose-100 shadow-[0_25px_60px_-15px_rgba(225,29,72,0.2)] rounded-3xl" dir="rtl">
          <div className="p-5 sm:p-6 pb-4 border-b border-rose-100 bg-white flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200/70 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-rose-600 tracking-tight">
                حذف پرونده دانشجو
              </DialogTitle>
              <DialogDescription className="text-xs text-rose-600/80 font-medium mt-0.5">هشدار حذف پرونده کاربری</DialogDescription>
            </div>
          </div>
          <div className="p-5 sm:p-6 space-y-3.5">
            <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200/80 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900 space-y-1">
                <p className="font-bold">آیا از حذف پرونده این دانشجو اطمینان دارید؟</p>
                <p className="text-rose-700/90 leading-relaxed">
                  دانشجو <strong className="text-rose-950 font-black">«{currentStudent?.name}»</strong> با شماره دانشجویی <span className="font-mono bg-white px-2 py-0.5 rounded-lg text-rose-700 font-bold border border-rose-200 shadow-2xs">{toPersianDigits(currentStudent?.student_id)}</span> برای همیشه از سیستم حذف خواهد شد.
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              onClick={() => setStudentDeleteDialogOpen(false)}
              disabled={isStudentSubmitting}
              className="rounded-xl border-gray-200 h-11 px-5 text-gray-700 hover:bg-gray-100 font-semibold text-xs"
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={handleStudentDelete}
              disabled={isStudentSubmitting}
              className="rounded-xl font-bold bg-rose-600 hover:bg-rose-700 h-11 px-6 shadow-md shadow-rose-600/20 text-xs flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4 ml-0.5" />
              {isStudentSubmitting ? "در حال حذف..." : "حذف پرونده"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Inquiry Modal */}
      <Dialog open={isInquiryModalOpen} onOpenChange={setIsInquiryModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden backdrop-blur-xl bg-white border border-orange-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] rounded-3xl" dir="rtl">
          {inquiryResult && (
            <>
              <div className="p-5 sm:p-6 pb-4 border-b border-orange-100/80 bg-white flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500/10 to-amber-500/20 text-[#F47B20] border border-orange-200/50 flex items-center justify-center shrink-0 shadow-xs">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                    نتیجه استعلام برخط پرداخت
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-500 mt-0.5">جزئیات تاییدیه تراکنش از درگاه بانکی</DialogDescription>
                </div>
              </div>
              <div className="p-5 sm:p-6 space-y-3.5 text-xs sm:text-sm">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                  <span className="font-bold text-gray-700">وضعیت تراکنش:</span>
                  <Badge 
                    variant={
                      inquiryResult.status === 'PAID' || inquiryResult.status === 'VERIFIED' ? 'default' :
                      inquiryResult.status === 'FAILED' || inquiryResult.status === 'REVERSED' ? 'destructive' :
                      'outline'
                    }
                    className="text-xs"
                  >
                    {formatStatus(inquiryResult.status)}
                    {inquiryResult.reversed && ' (برگشت خودکار انجام شد)'}
                  </Badge>
                </div>
                
                {inquiryResult.payment && (
                  <div className="space-y-2.5 p-4 rounded-2xl bg-orange-50/50 border border-orange-100">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">مبلغ پرداختی:</span>
                      <span className="font-extrabold text-emerald-600 text-sm">{formatPersianPrice(inquiryResult.payment.amount)} تومان</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">کاربر پرداخت‌کننده:</span>
                      <span className="font-bold text-gray-900">{inquiryResult.payment.user?.full_name || 'نامشخص'}</span>
                    </div>
                    {inquiryResult.payment.user?.phone_number && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">شماره تماس:</span>
                        <span className="font-mono text-gray-800">{toPersianDigits(inquiryResult.payment.user.phone_number)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">تاریخ تراکنش:</span>
                      <span className="text-gray-700">{toPersianDigits(new Date(inquiryResult.payment.created_at).toLocaleString('fa-IR'))}</span>
                    </div>
                    {inquiryResult.payment.ref_id && (
                      <div className="flex justify-between items-center pt-2.5 border-t border-orange-200/60">
                        <span className="text-gray-600 font-bold">شماره پیگیری شاپرک:</span>
                        <span className="font-mono font-black text-[#F47B20] text-sm">{toPersianDigits(inquiryResult.payment.ref_id)}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {inquiryResult.message && (
                  <div className="p-3 bg-muted/60 rounded-xl text-xs text-muted-foreground">
                    <p>{inquiryResult.message}</p>
                  </div>
                )}
              </div>
              <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end">
                <Button onClick={() => setIsInquiryModalOpen(false)} className="bg-gradient-to-r from-[#F47B20] to-[#E06A10] hover:from-[#E06A10] hover:to-[#D05A00] text-white rounded-xl font-bold h-11 px-6 shadow-md shadow-orange-500/20 text-xs">
                  بستن
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Voucher Add/Edit Dialog */}
      <Dialog open={voucherDialogOpen} onOpenChange={setVoucherDialogOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden backdrop-blur-xl bg-white border border-orange-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] rounded-3xl" dir="rtl">
          <div className="p-5 sm:p-6 pb-4 border-b border-orange-100/80 bg-white flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500/10 to-amber-500/20 text-[#F47B20] border border-orange-200/50 flex items-center justify-center shrink-0 shadow-xs">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                {currentVoucher ? "ویرایش ژتون" : "افزودن ژتون جدید"}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                {currentVoucher ? "ویرایش اطلاعات و مبلغ تخفیف ژتون" : "مشخصات نوع ژتون جدید سامانه را وارد کنید"}
              </DialogDescription>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-4 max-h-[calc(85vh-150px)] overflow-y-auto scrollbar-thin scrollbar-thumb-orange-200">
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="vCode" className="text-xs font-bold text-gray-700">کد شناسه (یکتا) <span className="text-rose-500">*</span></Label>
                <Input
                  id="vCode"
                  value={voucherFormData.code}
                  onChange={(e) => setVoucherFormData({ ...voucherFormData, code: e.target.value })}
                  placeholder="مثال: TYPE_5"
                  className="font-mono text-left dir-ltr form-input-focus rounded-xl h-11 text-sm bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vName" className="text-xs font-bold text-gray-700">عنوان نمایشی ژتون <span className="text-rose-500">*</span></Label>
                <Input
                  id="vName"
                  value={voucherFormData.name}
                  onChange={(e) => setVoucherFormData({ ...voucherFormData, name: e.target.value })}
                  placeholder="مثال: ژتون کارمندی"
                  className="form-input-focus rounded-xl h-11 text-sm bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="vDiscount" className="text-xs font-bold text-gray-700">مبلغ تخفیف / یارانه (تومان) <span className="text-rose-500">*</span></Label>
                <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                  {formatPersianPrice(voucherFormData.discount_amount || 0)} تومان
                </span>
              </div>
              <div className="relative">
                <Input
                  id="vDiscount"
                  type="text"
                  inputMode="numeric"
                  value={voucherFormData.discount_amount === 0 ? "" : toPersianDigits(voucherFormData.discount_amount)}
                  onChange={(e) => setVoucherFormData({ ...voucherFormData, discount_amount: parsePersianInt(e.target.value) })}
                  placeholder="مثال: ۵۰۰۰۰"
                  className="form-input-focus font-mono rounded-xl h-11 text-sm pl-14 bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 pointer-events-none">تومان</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vDesc" className="text-xs font-bold text-gray-700">توضیحات و کاربرد (اختیاری)</Label>
              <Input
                id="vDesc"
                value={voucherFormData.description}
                onChange={(e) => setVoucherFormData({ ...voucherFormData, description: e.target.value })}
                placeholder="توضیح کوتاه درباره جامعه هدف این ژتون"
                className="form-input-focus rounded-xl h-11 text-sm bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
              />
            </div>

            {/* Live Interactive Voucher Preview */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-orange-50/80 to-amber-50/40 border border-orange-200/60 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-gray-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#F47B20]" />
                  پیش‌نمایش کارت ژتون برای دانشجو:
                </span>
                <span className="font-mono text-[#F47B20] font-bold bg-white px-2 py-0.5 rounded-md border border-orange-200">
                  {toPersianDigits(voucherFormData.code || "TYPE_1")}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-orange-100 shadow-2xs">
                <span className="text-xs font-bold text-gray-900">{voucherFormData.name || "عنوان ژتون"}</span>
                <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                  {formatPersianPrice(voucherFormData.discount_amount || 0)} ت یارانه
                </span>
              </div>
            </div>

            {/* Status Switch Card */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-orange-100/80 bg-orange-50/40">
              <div className="space-y-0.5">
                <Label htmlFor="vActive" className="text-xs font-bold text-gray-900 cursor-pointer flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  وضعیت فعال بودن در سلف
                </Label>
                <p className="text-[11px] text-gray-500">در صورت غیرفعال بودن، دانشجویان قادر به انتخاب آن نخواهند بود</p>
              </div>
              <Switch
                id="vActive"
                checked={voucherFormData.is_active}
                onCheckedChange={(checked) => setVoucherFormData({ ...voucherFormData, is_active: checked })}
              />
            </div>
          </div>

          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              onClick={() => setVoucherDialogOpen(false)}
              disabled={isVoucherSubmitting}
              className="rounded-xl border-gray-200 h-11 px-5 text-gray-700 hover:bg-gray-100 font-semibold text-xs"
            >
              انصراف
            </Button>
            <Button
              onClick={handleSaveVoucher}
              disabled={isVoucherSubmitting}
              className="bg-gradient-to-r from-[#F47B20] to-[#E06A10] hover:from-[#E06A10] hover:to-[#D05A00] text-white rounded-xl font-bold h-11 px-6 shadow-md shadow-orange-500/20 text-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 ml-0.5" />
              {isVoucherSubmitting ? "در حال ذخیره..." : currentVoucher ? "ذخیره تغییرات" : "ایجاد ژتون جدید"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Voucher Delete Confirmation Dialog */}
      <Dialog open={voucherDeleteDialogOpen} onOpenChange={setVoucherDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden backdrop-blur-xl bg-white border border-rose-100 shadow-[0_25px_60px_-15px_rgba(225,29,72,0.2)] rounded-3xl" dir="rtl">
          <div className="p-5 sm:p-6 pb-4 border-b border-rose-100 bg-white flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200/70 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-rose-600 tracking-tight">
                حذف ژتون
              </DialogTitle>
              <DialogDescription className="text-xs text-rose-600/80 font-medium mt-0.5">هشدار حذف نوع ژتون از سیستم</DialogDescription>
            </div>
          </div>
          <div className="p-5 sm:p-6 space-y-3.5">
            <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200/80 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900 space-y-1">
                <p className="font-bold">آیا از حذف این نوع ژتون اطمینان دارید؟</p>
                <p className="text-rose-700/90 leading-relaxed">
                  آیا از حذف ژتون <strong className="text-rose-950 font-black">«{currentVoucher?.name}»</strong> (کد: <span className="font-mono bg-white px-2 py-0.5 rounded-lg text-rose-700 font-bold border border-rose-200 shadow-2xs">{toPersianDigits(currentVoucher?.code)}</span>) اطمینان دارید؟ با حذف این ژتون، وابستگی آن از تمام غذاهایی که به آن متصل بودند حذف خواهد شد.
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              onClick={() => setVoucherDeleteDialogOpen(false)}
              disabled={isVoucherSubmitting}
              className="rounded-xl border-gray-200 h-11 px-5 text-gray-700 hover:bg-gray-100 font-semibold text-xs"
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteVoucher}
              disabled={isVoucherSubmitting}
              className="bg-rose-600 hover:bg-rose-700 rounded-xl font-bold h-11 px-6 shadow-md shadow-rose-600/20 text-xs flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4 ml-0.5" />
              {isVoucherSubmitting ? "در حال حذف..." : "حذف ژتون"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
