"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from "lucide-react"
import api from "@/lib/axios"
import { API_ROUTES, createApiUrl } from "@/lib/api"

export default function PaymentVerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [paymentDetails, setPaymentDetails] = useState<{
    amount: number
    ref_id: string
  } | null>(null)

  useEffect(() => {
    const authority = searchParams.get("Authority")
    const statusParam = searchParams.get("Status")

    if (!authority || !statusParam) {
      setStatus("error")
      setMessage("اطلاعات پرداخت ناقص است")
      return
    }

    if (statusParam !== "OK") {
      setStatus("error")
      setMessage("پرداخت توسط کاربر لغو شد")
      return
    }

    verifyPayment(authority)
  }, [searchParams])

  const verifyPayment = async (authority: string) => {
    try {
      const response = await api.get(createApiUrl(API_ROUTES.PAYMENT_VERIFY), {
        params: { Authority: authority, Status: "OK" },
      })

      if (response.status === 200) {
        // Set success state and payment details
        setStatus("success")
        setMessage("پرداخت با موفقیت انجام شد")
        setPaymentDetails({
          amount: response.data.amount,
          ref_id: response.data.ref_id,
        })


        // Redirect after a short delay to show success state
        setTimeout(() => {
          router.push("/student-dashboard")
        }, 5000)
      }
    } catch (error) {
      console.error("Error verifying payment:", error)
      setStatus("error")
      setMessage("خطا در تایید پرداخت")
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF7F4] flex items-center justify-center p-4 rtl">
      <Card className="w-full max-w-md bg-white rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.1)] border border-gray-300">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {status === "loading" ? "در حال بررسی پرداخت" : status === "success" ? "پرداخت موفق" : "خطا در پرداخت"}
          </CardTitle>
          <CardDescription>{status === "loading" ? "لطفا صبر کنید..." : message}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          {status === "loading" ? (
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black"></div>
          ) : status === "success" ? (
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              {paymentDetails && (
                <div className="mt-4 p-4 bg-[#E8DED5] rounded-lg">
                  <p className="mb-2 font-semibold">
                    مبلغ:{" "}
                    {new Intl.NumberFormat("fa-IR", { useGrouping: true })
                      .format(paymentDetails.amount)
                      .replace(/٬/g, ",")}{" "}
                    تومان
                  </p>
                  <p className="font-semibold">کد پیگیری: {paymentDetails.ref_id}</p>
                </div>
              )}
            </div>
          ) : (
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            onClick={() => router.push("/student-dashboard")}
            className="bg-black hover:bg-black/80 text-white transition-colors duration-200"
          >
            {status === "success" ? "در حال انتقال به داشبورد..." : "بازگشت به داشبورد"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

