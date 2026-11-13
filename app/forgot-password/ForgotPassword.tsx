"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Phone, Lock, KeyRound, ShieldCheck, ArrowRight, ArrowLeft, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast, Toaster } from "react-hot-toast"
import api from "@/lib/axios"
import { API_ROUTES, createApiUrl } from "@/lib/api"
import { toEnglishDigits } from "@/lib/formatters"
import { Field } from "@/components/account/Field"
import { VerificationCode } from "@/components/account/VerificationCode"
import { AuthPageBackground } from "@/components/account/AuthPageBackground"

const requestCodeSchema = z.object({
  phone_number: z.preprocess(
    (val) => toEnglishDigits((val as string) || "").trim(),
    z
      .string()
      .min(1, { message: "لطفاً شماره موبایل را وارد کنید" })
      .regex(/^09\d{9}$/, { message: "شماره تلفن باید ۱۱ رقم و با ۰۹ شروع شود" })
  ),
})

const resetPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(1, { message: "لطفاً رمز عبور جدید را وارد کنید" })
      .min(8, { message: "رمز عبور جدید باید حداقل ۸ کاراکتر باشد" }),
    confirm_password: z
      .string()
      .min(1, { message: "لطفاً تکرار رمز عبور جدید را وارد کنید" }),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "رمزهای عبور جدید مطابقت ندارند",
    path: ["confirm_password"],
  })

type RequestCodeForm = z.infer<typeof requestCodeSchema>
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export default function ForgotPassword() {
  const [step, setStep] = useState<0 | 1>(0)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [otpError, setOtpError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const {
    handleSubmit: handleRequestSubmit,
    setValue: setRequestValue,
    watch: watchRequest,
    formState: { errors: requestErrors },
  } = useForm<RequestCodeForm>({
    resolver: zodResolver(requestCodeSchema),
    defaultValues: { phone_number: "" },
  })

  const {
    handleSubmit: handleResetSubmit,
    setValue: setResetValue,
    watch: watchReset,
    formState: { errors: resetErrors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { new_password: "", confirm_password: "" },
  })

  const phoneValue = watchRequest("phone_number")
  const newPasswordValue = watchReset("new_password")
  const confirmPasswordValue = watchReset("confirm_password")

  const onRequestCode = async (data: RequestCodeForm) => {
    setIsSubmitting(true)
    try {
      await api.post(createApiUrl(API_ROUTES.REQUEST_PASSWORD_RESET), {
        phone_number: data.phone_number,
      })
      toast.success("کد تأیید به شماره تلفن شما ارسال شد")
      setPhoneNumber(data.phone_number)
      setStep(1)
    } catch (error: unknown) {
      console.error("Request reset error:", error)
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || "خطا در ارسال کد تأیید. لطفاً دوباره تلاش کنید.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const onResetPassword = async (data: ResetPasswordForm) => {
    if (otpCode.length !== 6) {
      setOtpError(true)
      toast.error("لطفاً کد تأیید ۶ رقمی را وارد کنید")
      return
    }

    setIsSubmitting(true)
    setOtpError(false)
    try {
      await api.post(createApiUrl(API_ROUTES.RESET_PASSWORD), {
        phone_number: phoneNumber,
        otp: otpCode,
        new_password: data.new_password,
      })
      toast.success("رمز عبور با موفقیت تغییر کرد")
      setTimeout(() => {
        router.push("/")
      }, 1500)
    } catch (error: unknown) {
      console.error("Reset password error:", error)
      setOtpError(true)
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || "کد تأیید نامعتبر است یا منقضی شده است.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      dir="rtl"
      className="relative flex min-h-svh flex-col justify-between overflow-x-hidden font-sans sm:justify-center py-6 sm:py-10"
    >
      {/* Decorative Wave & Doodle Background */}
      <AuthPageBackground variant="forgot" />

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

      {/* Header matching the mockup: Logo + بازیابی رمز عبور + Subtitle */}
      <header className="relative z-10 flex flex-col items-center justify-center gap-1.5 px-6 pt-5 pb-3 text-center sm:pt-6 sm:pb-4 animate-in fade-in-0 slide-in-from-top-4 duration-700 ease-out fill-mode-both">
        <Link
          href="/"
          aria-label="رستوران جوان"
          className="relative flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        >
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md">
            <Image
              src="/images/javanfoods_logo.png"
              alt="رستوران جوان"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1 drop-shadow-xs">
          بازیابی رمز عبور
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm font-semibold text-gray-700 mt-0.5">
          دسترسی دوباره به حساب شما
        </p>
      </header>

      {/* Authentic Frosted Glass Card */}
      <section className="relative z-10 mx-auto flex w-[calc(100%-2rem)] sm:w-full max-w-[390px] shrink-0 flex-col rounded-[2.25rem] border border-white/90 bg-white/85 dark:bg-neutral-900/85 backdrop-blur-xl px-6 sm:px-7 py-6 sm:py-7 shadow-[0_15px_35px_-5px_rgba(249,115,22,0.12),0_4px_12px_rgba(0,0,0,0.03)] modal-glass my-auto animate-in fade-in-0 zoom-in-[0.98] slide-in-from-bottom-5 duration-700 delay-100 ease-out fill-mode-both">
        {/* Info Box matching the center mockup */}
        <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-[#FFF5EB] border border-orange-200/80 mb-5">
          <div className="size-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
            <KeyRound className="size-5" />
          </div>
          <div className="text-right flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">
              {step === 0 ? "شماره حساب شما" : "تأیید و رمز عبور جدید"}
            </p>
            <p className="text-[11px] sm:text-xs text-gray-500 truncate mt-0.5">
              {step === 0 ? "شماره موبایل ثبت‌شده در حساب کاربری" : phoneNumber}
            </p>
          </div>
        </div>

        {step === 0 ? (
          <form key="step-0" noValidate onSubmit={handleRequestSubmit(onRequestCode)} className="space-y-4 sm:space-y-5">
            <Field
              id="phone_number"
              label="شماره موبایل"
              icon={Phone}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              placeholder="09123456789"
              required
              value={phoneValue}
              onChange={(e) => {
                setRequestValue("phone_number", toEnglishDigits(e.target.value).trim(), {
                  shouldValidate: true,
                })
              }}
              error={requestErrors.phone_number?.message}
            />

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#FF7A1A] via-orange-500 to-[#EA580C] hover:from-orange-600 hover:to-[#C2410C] text-white text-base font-bold shadow-[0_8px_20px_rgba(234,88,12,0.35)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <span>{isSubmitting ? "در حال ارسال..." : "ارسال کد تأیید"}</span>
              {!isSubmitting && <ArrowLeft className="size-5" />}
            </Button>

            <div className="pt-2 text-center text-xs sm:text-sm">
              <span className="text-gray-600 font-medium">حساب کاربری ندارید؟ </span>
              <Link href="/sign-up" className="font-extrabold text-orange-600 hover:text-orange-700 hover:underline">
                ثبت‌نام کنید
              </Link>
            </div>

            <div className="pt-1 text-center text-xs">
              <Link href="/" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-orange-600 transition-colors">
                <ArrowRight className="size-3.5" />
                <span>بازگشت به صفحه ورود</span>
              </Link>
            </div>
          </form>
        ) : (
          <form key="step-1" noValidate onSubmit={handleResetSubmit(onResetPassword)} className="space-y-4 sm:space-y-5">
            <VerificationCode
              value={otpCode}
              onChange={(val) => {
                setOtpCode(val)
                setOtpError(false)
              }}
              error={otpError}
            />

            <Field
              id="new_password"
              label="رمز عبور جدید"
              icon={Lock}
              type="password"
              dir="ltr"
              placeholder="حداقل ۶ کاراکتر"
              showStrength
              required
              value={newPasswordValue}
              onChange={(e) => {
                setResetValue("new_password", e.target.value, { shouldValidate: true })
              }}
              error={resetErrors.new_password?.message}
            />

            <Field
              id="confirm_password"
              label="تکرار رمز عبور جدید"
              icon={ShieldCheck}
              type="password"
              dir="ltr"
              placeholder="رمز عبور را دوباره وارد کنید"
              required
              value={confirmPasswordValue}
              onChange={(e) => {
                setResetValue("confirm_password", e.target.value, { shouldValidate: true })
              }}
              error={resetErrors.confirm_password?.message}
            />

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#FF7A1A] via-orange-500 to-[#EA580C] hover:from-orange-600 hover:to-[#C2410C] text-white text-base font-bold shadow-[0_8px_20px_rgba(234,88,12,0.35)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <span>{isSubmitting ? "در حال تغییر رمز..." : "ثبت رمز عبور جدید"}</span>
              {!isSubmitting && <ArrowLeft className="size-5" />}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="h-11 w-full rounded-2xl text-xs sm:text-sm font-semibold text-gray-500 hover:text-orange-600 hover:bg-orange-50/50"
              onClick={() => setStep(0)}
            >
              <ArrowRight className="size-4 ml-1.5" />
              ویرایش شماره موبایل
            </Button>
          </form>
        )}
      </section>

      {/* Breathing space for bottom wave and doodles */}
      <div className="h-6 sm:h-10 pointer-events-none" />
    </div>
  )
}
