"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"

export default function PaymentStartPage() {
  const params = useParams()
  const authority = params.authority as string

  useEffect(() => {
    if (authority) {
      // Redirect to ZarinPal payment gateway
      window.location.href = `https://www.zarinpal.com/pg/StartPay/${authority}`
    }
  }, [authority])

  return (
    <div className="min-h-screen bg-[#FBF7F4] flex items-center justify-center p-4 rtl">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-lg">در حال انتقال به درگاه پرداخت...</p>
      </div>
    </div>
  )
}

