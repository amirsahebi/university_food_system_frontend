"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CreditCard } from "lucide-react"
import { toast, Toaster } from "react-hot-toast"
import api from "@/lib/axios"
import { API_ROUTES, createApiUrl } from "@/lib/api"

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
  }
}

export default function PaymentHistoryPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPaymentHistory()
  }, [])

  const fetchPaymentHistory = async () => {
    try {
      setIsLoading(true)
      const response = await api.get(createApiUrl(API_ROUTES.PAYMENT_HISTORY))
      // Sort payments in reverse order (newest first)
      const sortedPayments = (response.data.results || []).sort(
        (a: Payment, b: Payment) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      setPayments(sortedPayments)
    } catch (error) {
      console.error("Error fetching payment history:", error)
      toast.error("خطا در دریافت تاریخچه پرداخت‌ها")
    } finally {
      setIsLoading(false)
    }
  }

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "در انتظار پرداخت"
      case "paid":
        return "پرداخت شده"
      case "failed":
        return "ناموفق"
      default:
        return status
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "paid":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <div className="min-h-screen bg-[#FBF7F4] p-3 sm:p-4 rtl">
      <Toaster position="top-center" />

      <header className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/student-dashboard")} className="ml-2">
          <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold">تاریخچه پرداخت‌ها</h1>
      </header>

      <div className="w-full max-w-3xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        ) : payments.length === 0 ? (
          <Card className="bg-white rounded-2xl shadow-[0_0_10px_rgba(0,0,0,0.1)] border border-gray-300">
            <CardContent className="p-8 text-center">
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg text-gray-500">تاریخچه پرداختی یافت نشد</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <Card
                key={payment.id}
                className="bg-white rounded-2xl shadow-[0_0_10px_rgba(0,0,0,0.1)] border border-gray-300"
              >
                <CardHeader className="pb-2 px-4 sm:px-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${getPaymentStatusColor(payment.status)} w-fit`}>
                      {getPaymentStatusText(payment.status)}
                    </span>
                    <CardTitle className="text-base sm:text-lg">{formatDate(payment.created_at)}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                      <span className="font-bold text-lg" dir="rtl">
                        {new Intl.NumberFormat("fa-IR", { useGrouping: true })
                          .format(payment.amount)
                          .replace(/٬/g, ",")}{" "}
                        تومان
                      </span>
                      {payment.order_details && (
                        <span className="text-gray-600">{payment.order_details.food_name}</span>
                      )}
                    </div>

                    {payment.ref_id && (
                      <div className="text-sm text-gray-500 break-words" dir="ltr">
                        شناسه پرداخت: {payment.ref_id}
                      </div>
                    )}

                    {payment.order_details && payment.order_details.reserved_date && (
                      <div className="text-sm text-gray-500">تاریخ رزرو: {payment.order_details.reserved_date}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

