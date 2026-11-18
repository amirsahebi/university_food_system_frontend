"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { LoadingSpinner } from "@/components/LoadingSpinner"

export default function PaymentStartPage() {
  const params = useParams()
  const authority = params.authority as string

  useEffect(() => {
    if (authority) {
      // Redirect to ZarinPal payment gateway
      window.location.href = `https://www.zarinpal.com/pg/StartPay/${authority}`
    }
  }, [authority])

  return <LoadingSpinner text="در حال انتقال به درگاه پرداخت..." />
}
