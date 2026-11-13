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
import { AuthBackground } from "@/components/account/AuthBackground"

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
      className="relative flex h-svh flex-col overflow-hidden bg-page font-sans sm:h-auto sm:min-h-svh sm:justify-center sm:overflow-visible sm:overflow-x-hidden"
    >
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

      {/* Unified High-Performance Living Gravity Mesh Background */}
      <AuthBackground />

      <header className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-end gap-3 px-6 pb-6 pt-10 text-center sm:flex-none sm:gap-4 sm:pb-8 sm:pt-14 animate-in fade-in-0 slide-in-from-top-4 duration-700 ease-out fill-mode-both">
        <div className="relative group">
          <div className="absolute -inset-5 rounded-full bg-radial from-orange-500/35 via-amber-400/20 to-transparent blur-xl animate-logo-glow" />
          <Link
            href="/"
            aria-label="رستوران جوان"
            className="relative flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
          >
            <div className="relative size-20 sm:size-24 drop-shadow-md">
              <Image
                src="/images/javanfoods_logo.png"
                alt="رستوران جوان"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl drop-shadow-xs">
            بازیابی رمز عبور
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base font-medium">دسترسی دوباره به حساب شما</p>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex max-h-[80svh] w-full max-w-[560px] shrink-0 flex-col rounded-t-[2.25rem] border-t border-glass-border glass-auth-card pt-5 shadow-sheet sm:mb-8 sm:max-h-none sm:max-w-[460px] sm:rounded-[1.75rem] sm:border sm:pt-8 animate-in fade-in-0 zoom-in-[0.98] slide-in-from-bottom-5 duration-700 delay-100 ease-out fill-mode-both">
        <div className="shrink-0 px-5 pb-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-orange-100 text-orange-600 sm:size-11">
              <KeyRound className="size-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold">
                {step === 0 ? "شماره حساب شما" : "رمز عبور جدید"}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {step === 0 ? "شماره موبایل ثبت‌شده در حساب کاربری" : phoneNumber}
              </p>
            </div>
          </div>
        </div>

        {step === 0 ? (
          <form key="step-0" noValidate onSubmit={handleRequestSubmit(onRequestCode)} className="flex min-h-0 flex-1 flex-col animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-both">
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-3 sm:px-8">
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

              <div className="border-t border-input/50 pt-3 text-center text-sm">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-orange-600"
                >
                  <ArrowRight className="size-4" />
                  بازگشت به صفحه ورود
                </Link>
              </div>
            </div>

            <div className="shrink-0 border-t border-input/40 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 sm:px-8">
              <Button
                type="submit"
                variant="brand"
                disabled={isSubmitting}
                className="h-14 w-full text-base font-bold sm:h-12 sm:text-sm flex items-center justify-center gap-2"
              >
                {isSubmitting ? "در حال ارسال..." : "ارسال کد تأیید"}
                {!isSubmitting && <Send className="size-4" />}
              </Button>
            </div>
          </form>
        ) : (
          <form key="step-1" noValidate onSubmit={handleResetSubmit(onResetPassword)} className="flex min-h-0 flex-1 flex-col animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-both">
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-3 sm:px-8">
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
                placeholder="حداقل ۸ کاراکتر"
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

              <div className="border-t border-input/50 pt-3 text-center text-sm">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-orange-600"
                >
                  <ArrowRight className="size-4" />
                  انصراف و بازگشت به صفحه ورود
                </Link>
              </div>
            </div>

            <div className="shrink-0 border-t border-input/40 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 sm:px-8">
              <Button
                type="submit"
                variant="brand"
                disabled={isSubmitting}
                className="h-14 w-full text-base font-bold sm:h-12 sm:text-sm flex items-center justify-center gap-2"
              >
                {isSubmitting ? "در حال تغییر رمز..." : "تغییر رمز عبور"}
                {!isSubmitting && <ArrowLeft className="size-4" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="mt-1 h-11 w-full rounded-full text-muted-foreground hover:bg-black/5"
                onClick={() => setStep(0)}
              >
                <ArrowRight className="size-4 ml-1" />
                مرحله قبل
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
