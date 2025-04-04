"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
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
      className="min-h-screen bg-gradient-to-bl from-orange-100 to-red-100 flex items-center justify-center p-4 sm:p-6 md:p-8"
      dir="rtl"
    >
      <Toaster position="top-center" />
      <Card className="w-full max-w-md shadow-[0_20px_50px_rgba(8,_112,_184,_0.3)] rounded-2xl overflow-hidden">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {step === "request" ? "بازیابی رمز عبور" : "تغییر رمز عبور"}
          </CardTitle>
          <CardDescription className="text-center">
            {step === "request"
              ? "شماره تلفن خود را وارد کنید تا کد تایید برای شما ارسال شود"
              : "کد تایید و رمز عبور جدید خود را وارد کنید"}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
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
                        className="pr-10"
                        dir="rtl"
                      />
                      <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                    {errorsRequest.phone_number && (
                      <p className="text-sm text-red-500">{errorsRequest.phone_number.message}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full py-5 sm:py-6 text-base sm:text-lg"
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
                        className="pr-10"
                        dir="rtl"
                        defaultValue={phoneNumber}
                        readOnly
                      />
                      <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                    {errorsReset.phone_number && (
                      <p className="text-sm text-red-500">{errorsReset.phone_number.message}</p>
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
                        className="pr-10"
                        dir="rtl"
                      />
                      <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                    {errorsReset.verification_code && (
                      <p className="text-sm text-red-500">{errorsReset.verification_code.message}</p>
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
                        className="pr-10"
                        dir="rtl"
                      />
                      <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                    {errorsReset.new_password && (
                      <p className="text-sm text-red-500">{errorsReset.new_password.message}</p>
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
                        className="pr-10"
                        dir="rtl"
                      />
                      <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                    {errorsReset.confirm_password && (
                      <p className="text-sm text-red-500">{errorsReset.confirm_password.message}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full py-5 sm:py-6 text-base sm:text-lg"
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
            <Button
              variant="ghost"
              className="text-orange-600 hover:text-orange-700"
              onClick={() => setStep("request")}
            >
              <ArrowLeft className="ml-2 h-4 w-4" />
              بازگشت به مرحله قبل
            </Button>
          )}
          <Link href="/" className="text-sm text-orange-600 hover:underline text-center">
            بازگشت به صفحه ورود
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

