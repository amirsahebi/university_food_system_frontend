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
import { WavyAuthBackground } from "@/components/account/WavyAuthBackground"

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
      className="relative flex min-h-screen flex-col justify-between overflow-x-hidden font-sans px-4 py-6 sm:py-10 selection:bg-orange-500/20"
    >
      {/* Background with Layered Waves & Vector Food Illustrations */}
      <WavyAuthBackground variant="forgot-password" />

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

      {/* Header with Logo, Title, and Subtitle */}
      <header className="relative z-10 flex flex-col items-center justify-center text-center pt-2 sm:pt-4 pb-4 animate-in fade-in-0 slide-in-from-top-4 duration-700 ease-out fill-mode-both">
        <Link
          href="/"
          aria-label="رستوران جوان"
          className="relative mb-3 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        >
          <div className="relative size-20 sm:size-22 drop-shadow-md">
            <Image
              src="/images/javanfoods_logo.png"
              alt="رستوران جوان"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 drop-shadow-xs">
          بازیابی رمز عبور
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">
          دسترسی دوباره به حساب شما
        </p>
      </header>

      {/* Authentic Frosted Glass Card */}
      <section className="relative z-10 mx-auto w-full max-w-[420px] rounded-[2rem] bg-white/85 dark:bg-neutral-900/85 backdrop-blur-xl border border-white/90 dark:border-white/20 shadow-xl shadow-orange-500/10 p-5 sm:p-7 animate-in fade-in-0 zoom-in-[0.98] slide-in-from-bottom-5 duration-700 delay-100 ease-out fill-mode-both">
        {/* Info Header Box Matching Reference Design */}
        <div className="rounded-2xl bg-[#FFF1E7] border border-[#FDBA74]/50 p-3 flex items-center gap-3 mb-4 shadow-xs">
          <div className="size-10 rounded-xl bg-orange-100/90 text-[#F47B20] flex items-center justify-center shrink-0 border border-orange-200/60 shadow-xs">
            <KeyRound className="size-5" />
          </div>
          <div className="text-right flex-1">
            <h2 className="text-xs sm:text-sm font-bold text-gray-900">
              {step === 0 ? "شماره حساب شما" : "تأیید هویت و رمز عبور جدید"}
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
              {step === 0 ? "شماره موبایل ثبت‌شده در حساب کاربری" : `کد ارسال‌شده به ${phoneNumber}`}
            </p>
          </div>
        </div>

        {step === 0 ? (
          <form noValidate onSubmit={handleRequestSubmit(onRequestCode)} className="space-y-4">
            <div>
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
            </div>

            <div className="pt-2 text-center text-xs sm:text-sm">
              <span className="text-gray-500">حساب کاربری ندارید؟ </span>
              <Link href="/sign-up" className="font-bold text-[#F47B20] hover:underline">
                ثبت‌نام کنید
              </Link>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 sm:h-12.5 w-full rounded-2xl bg-gradient-to-r from-[#F47B20] to-[#E06A10] hover:from-[#E06A10] hover:to-[#D05A00] text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? "در حال ارسال..." : "ارسال کد تأیید"}
                {!isSubmitting && <ArrowLeft className="size-4 shrink-0" />}
              </Button>
            </div>

            <div className="pt-3 text-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-[#F47B20] font-medium transition-colors"
              >
                <span>بازگشت به صفحه ورود</span>
                <ArrowLeft className="size-3.5" />
              </Link>
            </div>
          </form>
        ) : (
          <form noValidate onSubmit={handleResetSubmit(onResetPassword)} className="space-y-4">
            <div className="space-y-1 text-center">
              <p className="text-xs font-semibold text-gray-700">کد ۴ رقمی ارسال‌شده را وارد کنید:</p>
              <VerificationCode
                value={otpCode}
                onChange={(val) => {
                  setOtpCode(val)
                  setOtpError(false)
                }}
                error={otpError}
              />
            </div>

            <div>
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
            </div>

            <div>
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
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 sm:h-12.5 w-full rounded-2xl bg-gradient-to-r from-[#F47B20] to-[#E06A10] hover:from-[#E06A10] hover:to-[#D05A00] text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? "در حال تغییر رمز..." : "تغییر رمز عبور"}
                {!isSubmitting && <ArrowLeft className="size-4 shrink-0" />}
              </Button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="text-xs text-gray-500 hover:text-gray-800 font-medium transition-colors cursor-pointer"
              >
                مرحله قبل
              </button>
              <Link
                href="/"
                className="text-xs text-gray-500 hover:text-[#F47B20] font-medium transition-colors"
              >
                انصراف و بازگشت
              </Link>
            </div>
          </form>
        )}
      </section>

      {/* Spacer to balance vertical layout */}
      <div className="h-6 sm:h-8" />
    </div>
  )
}
