"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  CreditCard,
  ChevronRight,
  CalendarDays,
  Copy,
  CheckCheck,
  Receipt,
  ArrowUpRight,
  Clock,
  Search,
  Coins,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Utensils,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast, Toaster } from "react-hot-toast"
import api from "@/lib/axios"
import { API_ROUTES, createApiUrl } from "@/lib/api"
import { toPersianDigits, formatPersianPrice } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { withAuth } from "@/lib/withAuth"

interface Payment {
  id: number
  amount: number
  authority: string
  ref_id: string | null
  status: "pending" | "paid" | "failed"
  created_at: string
  order_details?: {
    food_name: string
    reserved_date: string
    meal_type?: "lunch" | "dinner"
  }
}

type FilterStatus = "all" | "paid" | "pending" | "failed"

function PaymentHistoryPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [userBalance, setUserBalance] = useState<number | null>(null)

  const fetchPaymentHistory = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true)
      else setIsRefreshing(true)

      const response = await api.get(createApiUrl(API_ROUTES.PAYMENT_HISTORY))
      const rawList = Array.isArray(response.data)
        ? response.data
        : response.data?.results || []

      const sortedPayments = rawList.sort(
        (a: Payment, b: Payment) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setPayments(sortedPayments)
    } catch (error) {
      console.error("Error fetching payment history:", error)
      toast.error("خطا در دریافت تاریخچه پرداخت‌ها")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  const fetchUserBalance = useCallback(async () => {
    try {
      const response = await api.get(createApiUrl(API_ROUTES.ME))
      if (response.data && typeof response.data.balance === "number") {
        setUserBalance(response.data.balance)
      }
    } catch {
      // Balance is supplementary; non-fatal
    }
  }, [])

  useEffect(() => {
    fetchPaymentHistory()
    fetchUserBalance()
  }, [fetchPaymentHistory, fetchUserBalance])

  const copyRefId = (payment: Payment) => {
    if (!payment.ref_id) return
    navigator.clipboard.writeText(payment.ref_id)
    setCopiedId(payment.id)
    toast.success("شناسه پرداخت کپی شد")
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getStatusMeta = (status: Payment["status"]) => {
    switch (status) {
      case "paid":
        return {
          label: "موفق",
          cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
          iconCls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
          icon: CheckCircle2,
          dotCls: "bg-emerald-500",
        }
      case "pending":
        return {
          label: "در انتظار پرداخت",
          cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
          iconCls: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
          icon: AlertCircle,
          dotCls: "bg-amber-500 animate-pulse",
        }
      case "failed":
        return {
          label: "ناموفق",
          cls: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
          iconCls: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
          icon: XCircle,
          dotCls: "bg-rose-500",
        }
      default:
        return {
          label: status,
          cls: "bg-muted text-muted-foreground border border-border",
          iconCls: "bg-muted text-muted-foreground",
          icon: Clock,
          dotCls: "bg-muted-foreground",
        }
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const formatted = new Intl.DateTimeFormat("fa-IR", {
        weekday: "short",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
      return toPersianDigits(formatted)
    } catch {
      return dateString
    }
  }

  // Summary counts
  const totalCount = payments.length
  const paidPayments = useMemo(() => payments.filter((p) => p.status === "paid"), [payments])
  const pendingCount = useMemo(() => payments.filter((p) => p.status === "pending").length, [payments])
  const failedCount = useMemo(() => payments.filter((p) => p.status === "failed").length, [payments])
  const paidCount = paidPayments.length
  const totalPaidAmount = useMemo(
    () => paidPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [paidPayments]
  )

  // Filtered payments list
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (activeFilter !== "all" && p.status !== activeFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase()
        const matchesRef = p.ref_id && p.ref_id.toLowerCase().includes(query)
        const matchesFood =
          p.order_details?.food_name &&
          p.order_details.food_name.toLowerCase().includes(query)
        const matchesAmount = String(p.amount).includes(query)
        return matchesRef || matchesFood || matchesAmount
      }
      return true
    })
  }, [payments, activeFilter, searchQuery])

  const filterTabs = [
    { id: "all" as const, label: "همه", count: totalCount },
    { id: "paid" as const, label: "موفق", count: paidCount },
    { id: "pending" as const, label: "در انتظار", count: pendingCount },
    { id: "failed" as const, label: "ناموفق", count: failedCount },
  ]

  return (
    <div dir="rtl" className="bg-page min-h-screen pb-16 font-sans text-foreground">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="sticky top-0 z-40 px-2 sm:px-4 pt-3 sm:pt-4">
        <div className="glass mx-auto flex max-w-5xl items-center justify-between rounded-full px-3 sm:px-4 py-2 sm:py-2.5">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative size-8 sm:size-9 shrink-0 drop-shadow-sm">
              <Image
                src="/images/javanfoods_logo.png"
                alt="رستوران جوان"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-sm sm:text-base text-foreground tracking-tight truncate">
                تاریخچه تراکنش‌ها
              </h1>
              <p className="text-[0.65rem] sm:text-xs text-muted-foreground hidden sm:block truncate">
                گزارش پرداخت‌ها و رسید سفارش‌های رستوران جوان
              </p>
            </div>
          </div>

          {/* User Balance & Back Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {userBalance !== null && (
              <div className="flex items-center gap-1 sm:gap-1.5 rounded-full bg-glass px-2.5 sm:px-3 py-1 sm:py-1.5 border border-glass-border">
                <Coins className="size-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  {formatPersianPrice(userBalance)}
                </span>
                <span className="text-[0.65rem] text-muted-foreground hidden xs:inline">
                  تومان
                </span>
              </div>
            )}

            <Button
              variant="glass"
              size="sm"
              onClick={() => fetchPaymentHistory(true)}
              className="size-8 sm:size-auto sm:px-2.5 p-0 sm:py-1.5 rounded-full cursor-pointer"
              title="بروزرسانی داده‌ها"
            >
              <RefreshCw
                className={cn("size-3.5 text-primary", isRefreshing && "animate-spin")}
              />
              <span className="hidden md:inline text-xs mr-1">بروزرسانی</span>
            </Button>

            <Button
              variant="brand"
              size="sm"
              onClick={() => router.push("/student-dashboard")}
              className="gap-1.5 rounded-full px-3 text-xs font-semibold cursor-pointer shadow-sm"
            >
              <ChevronRight className="size-4" />
              <span>بازگشت به داشبورد</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto mt-6 max-w-5xl space-y-5 px-3 sm:px-4">
        {/* Stats Summary Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
          <div className="glass rounded-[1.75rem] p-3.5 sm:p-5 border border-glass-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="size-7 rounded-xl bg-primary/10 grid place-items-center text-primary">
                <Receipt className="size-3.5" />
              </div>
              <span className="font-medium">کل تراکنش‌ها</span>
            </div>
            <div className="mt-2.5 text-lg sm:text-2xl font-black text-foreground">
              {toPersianDigits(totalCount)}{" "}
              <span className="text-xs font-normal text-muted-foreground">تراکنش</span>
            </div>
          </div>

          <div className="glass rounded-[1.75rem] p-3.5 sm:p-5 border border-glass-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="size-7 rounded-xl bg-emerald-500/10 grid place-items-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" />
              </div>
              <span className="font-medium">پرداخت‌های موفق</span>
            </div>
            <div className="mt-2.5 text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {toPersianDigits(paidCount)}{" "}
              <span className="text-xs font-normal text-muted-foreground">مورد</span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 glass rounded-[1.75rem] p-3.5 sm:p-5 border border-glass-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="size-7 rounded-xl bg-primary/10 grid place-items-center text-primary">
                <ArrowUpRight className="size-3.5" />
              </div>
              <span className="font-medium">مجموع مبالغ پرداخت‌شده</span>
            </div>
            <div className="mt-2.5 text-lg sm:text-2xl font-black text-primary truncate">
              {formatPersianPrice(totalPaidAmount)}{" "}
              <span className="text-xs font-normal text-muted-foreground">تومان</span>
            </div>
          </div>
        </section>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="glass flex items-center rounded-full p-1 border border-glass-border overflow-x-auto no-scrollbar">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition cursor-pointer shrink-0",
                    isActive
                      ? "text-primary-foreground font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeFilterPill"
                      className="absolute inset-0 rounded-full bg-brand shadow-glow"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                  <span
                    className={cn(
                      "relative z-10 rounded-full px-1.5 py-0.5 text-[0.65rem] font-mono",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {toPersianDigits(tab.count)}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="جستجو بر اساس نام غذا، کد پیگیری..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-glass-border bg-glass/80 pr-9 pl-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            />
          </div>
        </div>

        {/* Transactions List */}
        {isLoading ? (
          <div className="glass rounded-[1.75rem] p-12 text-center border border-glass-border">
            <div className="mx-auto mb-3 size-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm font-medium text-muted-foreground">
              در حال بارگذاری تراکنش‌ها...
            </p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="glass rounded-[1.75rem] p-10 sm:p-14 text-center border border-glass-border">
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-3xl bg-glass-strong text-muted-foreground">
              <CreditCard className="size-8 text-primary/70" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              {searchQuery || activeFilter !== "all"
                ? "تراکنشی با این مشخصات یافت نشد"
                : "تاریخچه پرداختی ثبت نشده است"}
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
              {searchQuery || activeFilter !== "all"
                ? "می‌توانید فیلتر وضعیت را تغییر دهید یا عبارت دیگری جستجو نمایید."
                : "هنوز هیچ پرداخت یا تراکنشی در سامانه برای حساب کاربری شما ثبت نشده است."}
            </p>
            <Button
              variant="brand"
              className="mt-5 gap-1.5 rounded-full px-5 text-xs font-semibold cursor-pointer shadow-sm"
              onClick={() => router.push("/student-dashboard")}
            >
              <Utensils className="size-4" />
              <span>مشاهده و رزرو غذا</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredPayments.map((payment) => {
                const statusMeta = getStatusMeta(payment.status)
                const StatusIcon = statusMeta.icon

                return (
                  <motion.article
                    key={payment.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="glass group rounded-[1.75rem] p-4 sm:p-5 transition hover:-translate-y-0.5 border border-glass-border shadow-xs hover:shadow-md"
                  >
                    {/* Top Row: Icon, Title, Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "grid size-11 sm:size-12 shrink-0 place-items-center rounded-2xl shadow-xs",
                            statusMeta.iconCls
                          )}
                        >
                          <CreditCard className="size-5 sm:size-6" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-sm sm:text-base text-foreground tracking-tight truncate">
                              {payment.order_details?.food_name || "پرداخت سفارش غذا"}
                            </h3>
                            {payment.order_details?.meal_type && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-bold text-primary">
                                {payment.order_details.meal_type === "dinner"
                                  ? "شام"
                                  : "ناهار"}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="size-3 text-muted-foreground/70" />
                            <span>{formatDate(payment.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div
                        className={cn(
                          "shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1 text-xs font-semibold",
                          statusMeta.cls
                        )}
                      >
                        <span className={cn("size-1.5 rounded-full", statusMeta.dotCls)} />
                        <StatusIcon className="size-3.5" />
                        <span>{statusMeta.label}</span>
                      </div>
                    </div>

                    {/* Bottom Row: Metadata & Price */}
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-glass/60 p-3 sm:p-3.5 border border-glass-border">
                      <div className="flex items-center gap-2.5 sm:gap-4 text-xs text-muted-foreground flex-wrap">
                        {payment.order_details?.reserved_date && (
                          <div className="flex items-center gap-1">
                            <CalendarDays className="size-3.5 text-primary" />
                            <span>
                              تاریخ تحویل:{" "}
                              <strong className="text-foreground font-semibold">
                                {toPersianDigits(payment.order_details.reserved_date)}
                              </strong>
                            </span>
                          </div>
                        )}

                        {payment.ref_id && (
                          <div className="flex items-center gap-1 bg-glass px-2 py-1 rounded-lg border border-glass-border">
                            <span>کد پیگیری:</span>
                            <span className="font-mono font-bold text-foreground">
                              {toPersianDigits(payment.ref_id)}
                            </span>
                            <button
                              type="button"
                              aria-label="کپی کد پیگیری"
                              onClick={() => copyRefId(payment)}
                              className="size-5 inline-grid place-items-center rounded hover:bg-glass-strong text-muted-foreground hover:text-foreground transition cursor-pointer"
                              title="کپی شناسه پرداخت"
                            >
                              {copiedId === payment.id ? (
                                <CheckCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </button>
                          </div>
                        )}

                        {payment.authority && (
                          <div className="text-[0.7rem] text-muted-foreground/80 hidden md:block">
                            شناسه مرجع: {payment.authority.slice(0, 16)}...
                          </div>
                        )}
                      </div>

                      {/* Amount */}
                      <div className="flex items-baseline justify-end gap-1 font-black text-lg sm:text-xl text-primary">
                        <span>{formatPersianPrice(payment.amount)}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          تومان
                        </span>
                      </div>
                    </div>
                  </motion.article>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  )
}

export default withAuth(PaymentHistoryPage)
