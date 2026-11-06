"use client"

import { Suspense, useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, ArrowRight, Copy, CheckCheck } from "lucide-react"
import api from "@/lib/axios"
import { API_ROUTES, createApiUrl } from "@/lib/api"
import { toPersianDigits, formatPersianPrice } from "@/lib/formatters"
import { toast, Toaster } from "react-hot-toast"

function PaymentVerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [copied, setCopied] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState<{
    amount: number
    ref_id: string
  } | null>(null)

  const verifyPayment = useCallback(
    async (authority: string) => {
      try {
        const response = await api.get(createApiUrl(API_ROUTES.PAYMENT_VERIFY), {
          params: { Authority: authority, Status: "OK" },
        })

        if (response.status === 200) {
          setStatus("success")
          setMessage("پرداخت با موفقیت تایید و سفارش شما ثبت گردید")
          setPaymentDetails({
            amount: response.data.amount,
            ref_id: response.data.ref_id,
          })

          setTimeout(() => {
            router.push("/student-dashboard")
          }, 4500)
        } else {
          setStatus("error")
          setMessage("تراکنش توسط درگاه بانکی تایید نشد یا پرداخت ناموفق بود")
        }
      } catch (error) {
        console.error("Error verifying payment:", error)
        setStatus("error")
        setMessage("خطا در تایید وضعیت پرداخت از درگاه")
      }
    },
    [router]
  )

  useEffect(() => {
    const authority = searchParams.get("Authority")
    const statusParam = searchParams.get("Status")

    if (!authority || !statusParam) {
      setStatus("error")
      setMessage("اطلاعات بازگشتی از درگاه پرداخت ناقص است")
      return
    }

    verifyPayment(authority)
  }, [searchParams, verifyPayment])

  const copyRefId = () => {
    if (!paymentDetails?.ref_id) return
    navigator.clipboard.writeText(paymentDetails.ref_id)
    setCopied(true)
    toast.success("شناسه پرداخت کپی شد")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div dir="rtl" className="bg-page min-h-screen flex items-center justify-center p-4 font-sans text-foreground">
      <Toaster position="top-center" />
      <div className="glass w-full max-w-md rounded-[2rem] p-6 sm:p-8 border border-glass-border shadow-xl text-center">
        {/* Logo */}
        <div className="mx-auto mb-4 relative size-12 shrink-0 drop-shadow-sm">
          <Image
            src="/images/javanfoods_logo.png"
            alt="رستوران جوان"
            fill
            className="object-contain"
            priority
          />
        </div>

        {status === "loading" && (
          <div className="py-8 space-y-4">
            <div className="mx-auto size-14 animate-spin rounded-full border-3 border-primary border-t-transparent" />
            <h2 className="text-lg font-bold text-foreground">در حال بررسی پرداخت...</h2>
            <p className="text-xs text-muted-foreground">
              لطفاً چند لحظه شکیبا باشید تا نتیجه تراکنش از شاپرک دریافت شود.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 py-2">
            <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-10" />
            </div>
            <h2 className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              پرداخت با موفقیت انجام شد
            </h2>
            <p className="text-xs text-muted-foreground">{message}</p>

            {paymentDetails && (
              <div className="rounded-2xl bg-glass/60 p-4 border border-glass-border space-y-2 text-sm text-right">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">مبلغ تراکنش:</span>
                  <span className="font-bold text-primary">
                    {formatPersianPrice(paymentDetails.amount)} تومان
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-glass-border">
                  <span className="text-xs text-muted-foreground">شناسه پیگیری:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-foreground">
                      {toPersianDigits(paymentDetails.ref_id)}
                    </span>
                    <button
                      type="button"
                      aria-label="کپی شناسه"
                      onClick={copyRefId}
                      className="size-6 inline-grid place-items-center rounded-md hover:bg-glass text-muted-foreground hover:text-foreground transition cursor-pointer"
                    >
                      {copied ? (
                        <CheckCheck className="size-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <Button
              variant="brand"
              onClick={() => router.push("/student-dashboard")}
              className="w-full gap-2 rounded-full py-2.5 text-xs font-semibold cursor-pointer shadow-glow"
            >
              <ArrowRight className="size-4" />
              <span>بازگشت به سامانه رستوران</span>
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 py-2">
            <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <XCircle className="size-10" />
            </div>
            <h2 className="text-xl font-black text-rose-600 dark:text-rose-400">
              خطا در پرداخت
            </h2>
            <p className="text-xs text-muted-foreground">{message}</p>

            <div className="flex gap-2 pt-2">
              <Button
                variant="glass"
                onClick={() => router.push("/payment/history")}
                className="flex-1 rounded-full text-xs font-medium cursor-pointer"
              >
                تاریخچه پرداخت‌ها
              </Button>
              <Button
                variant="brand"
                onClick={() => router.push("/student-dashboard")}
                className="flex-1 rounded-full text-xs font-medium cursor-pointer"
              >
                بازگشت به داشبورد
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PaymentVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-page min-h-screen flex items-center justify-center p-4">
          <div className="glass rounded-[1.75rem] p-8 flex items-center gap-3">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm font-medium">در حال بارگذاری...</span>
          </div>
        </div>
      }
    >
      <PaymentVerifyContent />
    </Suspense>
  )
}
