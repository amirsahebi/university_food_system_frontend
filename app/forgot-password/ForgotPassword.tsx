"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { toast, Toaster } from "react-hot-toast"
import { Send, ArrowLeft, LogIn, Phone, Key, Lock } from "lucide-react"
import Link from "next/link"
import api from "@/lib/axios"
import { API_ROUTES, createApiUrl } from "@/lib/api"
import { AnimatePresence, motion } from "framer-motion"

const requestCodeSchema = z.object({
  phone_number: z.string().regex(/^09\d{9}$/, { message: "شماره تلفن باید 11 رقم و با 09 شروع شود" }),
})

const resetPasswordSchema = z
  .object({
    phone_number: z.string().regex(/^09\d{9}$/, { message: "شماره تلفن باید 11 رقم و با 09 شروع شود" }),
    verification_code: z.string(),
    new_password: z.string().min(8, { message: "رمز عبور جدید باید حداقل 8 کاراکتر باشد" }),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "رمزهای عبور جدید مطابقت ندارند",
    path: ["confirm_password"],
  })

type RequestCodeForm = z.infer<typeof requestCodeSchema>
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"request" | "reset">("request")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")

  const {
    register: registerRequest,
    handleSubmit: handleSubmitRequest,
    formState: { errors: errorsRequest },
  } = useForm<RequestCodeForm>({
    resolver: zodResolver(requestCodeSchema),
  })

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: errorsReset },
    setValue,
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmitRequest = async (data: RequestCodeForm) => {
    setIsSubmitting(true)
    try {
      await api.post(createApiUrl(API_ROUTES.REQUEST_PASSWORD_RESET), { phone_number: data.phone_number })
      toast.success("کد تایید به شماره تلفن شما ارسال شد")
      setPhoneNumber(data.phone_number)
      setStep("reset")
      setValue("phone_number", data.phone_number)
    } catch (error) {
      console.error("Request error:", error)
      toast.error("خطا در ارسال کد تایید. لطفا دوباره تلاش کنید.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmitReset = async (data: ResetPasswordForm) => {
    setIsSubmitting(true)
    try {
      await api.post(createApiUrl(API_ROUTES.RESET_PASSWORD), {
        phone_number: data.phone_number,
        otp: data.verification_code,
        new_password: data.new_password,
      })
      toast.success("رمز عبور با موفقیت تغییر کرد")
      setTimeout(() => {
        window.location.href = "/"
      }, 2000)
    } catch (error) {
      console.error("Reset error:", error)
      toast.error("خطا در تغییر رمز عبور. لطفا دوباره تلاش کنید.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-pattern bg-pattern-animate"
      dir="rtl"
    >
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

      <Card className="w-full max-w-md backdrop-blur-md bg-white/55 rounded-3xl shadow-xl border-0 relative z-10 animate-fade-in">
        <CardHeader className="flex flex-col items-center space-y-2 pb-2">
          <div
            className="mb-2"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="relative h-20 w-20">
              <Image src="/images/javanfoods_logo.png" alt="رستوران جوان" fill className="object-contain" priority />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800" style={{ animationDelay: "0.2s" }}>
            رستوران جوان
          </h1>
          <p className="text-gray-500 text-sm" style={{ animationDelay: "0.3s" }}>
            {step === "request" ? "بازیابی رمز عبور" : "تغییر رمز عبور"}
          </p>
        </CardHeader>

        <CardContent className="pt-4">
          <AnimatePresence mode="wait">
            {step === "request" ? (
              <motion.div
                key="request"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleSubmitRequest(onSubmitRequest)} className="space-y-4" dir="rtl">
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">شماره تلفن</Label>
                    <div className="relative">
                      <Input
                        id="phone_number"
                        type="tel"
                        placeholder="09123456789"
                        {...registerRequest("phone_number")}
                        className="pr-10 form-input-focus"
                        dir="rtl"
                      />
                      <Phone
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-400"
                        size={18}
                      />
                    </div>
                    {errorsRequest.phone_number && (
                      <p className="text-sm text-red-500 animate-shake">{errorsRequest.phone_number.message}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full py-5 sm:py-6 text-base sm:text-lg bg-[#f97316] hover:bg-orange-600 btn-hover-effect"
                    disabled={isSubmitting}
                    dir="rtl"
                  >
                    {isSubmitting ? (
                      <>
                        در حال ارسال...
                        <Send className="mr-2 h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      <>
                        ارسال کد تایید
                        <Send className="mr-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="reset"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleSubmitReset(onSubmitReset)} className="space-y-4" dir="rtl">
                  <div className="space-y-2">
                    <Label htmlFor="reset_phone_number">شماره تلفن</Label>
                    <div className="relative">
                      <Input
                        id="reset_phone_number"
                        type="tel"
                        placeholder="09123456789"
                        {...registerReset("phone_number")}
                        className="pr-10 form-input-focus"
                        dir="rtl"
                        defaultValue={phoneNumber}
                        readOnly
                      />
                      <Phone
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-400"
                        size={18}
                      />
                    </div>
                    {errorsReset.phone_number && (
                      <p className="text-sm text-red-500 animate-shake">{errorsReset.phone_number.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="verification_code">کد تایید</Label>
                    <div className="relative">
                      <Input
                        id="verification_code"
                        type="text"
                        placeholder="123456"
                        {...registerReset("verification_code")}
                        className="pr-10 form-input-focus"
                        dir="rtl"
                      />
                      <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-400" size={18} />
                    </div>
                    {errorsReset.verification_code && (
                      <p className="text-sm text-red-500 animate-shake">{errorsReset.verification_code.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_password">رمز عبور جدید</Label>
                    <div className="relative">
                      <Input
                        id="new_password"
                        type="password"
                        placeholder="••••••••"
                        {...registerReset("new_password")}
                        className="pr-10 form-input-focus"
                        dir="rtl"
                      />
                      <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-400" size={18} />
                    </div>
                    {errorsReset.new_password && (
                      <p className="text-sm text-red-500 animate-shake">{errorsReset.new_password.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">تکرار رمز عبور جدید</Label>
                    <div className="relative">
                      <Input
                        id="confirm_password"
                        type="password"
                        placeholder="••••••••"
                        {...registerReset("confirm_password")}
                        className="pr-10 form-input-focus"
                        dir="rtl"
                      />
                      <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-400" size={18} />
                    </div>
                    {errorsReset.confirm_password && (
                      <p className="text-sm text-red-500 animate-shake">{errorsReset.confirm_password.message}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full py-5 sm:py-6 text-base sm:text-lg bg-[#f97316] hover:bg-orange-600 btn-hover-effect"
                    disabled={isSubmitting}
                    dir="rtl"
                  >
                    {isSubmitting ? (
                      <>
                        در حال تغییر رمز عبور...
                        <LogIn className="mr-2 h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      <>
                        تغییر رمز عبور
                        <LogIn className="mr-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 px-4 sm:px-6 pb-6">
          {step === "reset" && (
            <Button variant="ghost" className="text-[#f97316] hover:text-orange-600" onClick={() => setStep("request")}>
              <ArrowLeft className="ml-2 h-4 w-4" />
              بازگشت به مرحله قبل
            </Button>
          )}
          <Link href="/" className="text-sm text-[#f97316] hover:underline text-center">
            بازگشت به صفحه ورود
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
