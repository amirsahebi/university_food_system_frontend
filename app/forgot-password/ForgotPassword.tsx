"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Phone, Lock, KeyRound, ShieldCheck, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast, Toaster } from "react-hot-toast"
import api from "@/lib/axios"
import { API_ROUTES, createApiUrl } from "@/lib/api"
import { toEnglishDigits } from "@/lib/formatters"
import { Field } from "@/components/account/Field"
import { VerificationCode } from "@/components/account/VerificationCode"

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
      className="relative min-h-screen bg-white font-sans overflow-x-hidden flex flex-col justify-between selection:bg-orange-500/20"
      style={{ fontFamily: "'Vazirmatn', 'Segoe UI', system-ui, sans-serif" }}
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

      {/* ───── HERO SECTION (Design A) ───── */}
      <div
        className="relative w-full overflow-hidden shrink-0"
        style={{
          height: "46vh",
          minHeight: 250,
          background: "linear-gradient(145deg, #ff7a00 0%, #f95d00 40%, #e84b00 70%, #c73a00 100%)",
        }}
      >
        {/* Soft radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 70% at 50% 110%, rgba(255,255,255,0.16) 0%, transparent 70%)",
          }}
        />
        {/* Subtle decorative circles */}
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            top: -60,
            right: -60,
            width: 240,
            height: 240,
            background: "rgba(255,255,255,0.07)",
          }}
        />
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            top: -20,
            right: -20,
            width: 140,
            height: 140,
            background: "rgba(255,255,255,0.07)",
          }}
        />
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            bottom: -40,
            left: -50,
            width: 200,
            height: 200,
            background: "rgba(0,0,0,0.06)",
          }}
        />

        {/* Logo + Title centered in hero */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 text-white text-center px-6">
          <Link
            href="/"
            aria-label="رستوران جوان"
            className="relative transition-transform hover:scale-105 active:scale-95"
          >
            <div
              className="relative"
              style={{
                width: 82,
                height: 82,
                filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.28)) brightness(1.05)",
              }}
            >
              <Image
                src="/images/javanfoods_logo.png"
                alt="رستوران جوان"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
          <h1
            className="text-2xl sm:text-3xl font-black tracking-tight"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.25)" }}
          >
            بازیابی رمز عبور
          </h1>
          <p className="text-xs sm:text-sm text-white/90 font-medium">
            دسترسی دوباره به حساب کاربری
          </p>
        </div>
      </div>

      {/* ───── CARD SHEET ───── */}
      <div
        className="relative flex-1 w-full bg-white px-5 pt-6 pb-10 sm:px-8 sm:pt-8"
        style={{
          marginTop: "-2rem",
          borderTopLeftRadius: "2rem",
          borderTopRightRadius: "2rem",
          boxShadow: "0 -4px 30px rgba(0,0,0,0.07)",
        }}
      >
        {/* Handle bar */}
        <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-gray-200" />

        <div className="mx-auto w-full max-w-[420px]">
          {/* Info Header Box */}
          <div className="rounded-2xl bg-orange-50 border border-orange-200/60 p-3.5 flex items-center gap-3 mb-5">
            <div className="size-10 rounded-xl bg-orange-100 text-[#F97316] flex items-center justify-center shrink-0 border border-orange-200 shadow-xs">
              <KeyRound className="size-5" />
            </div>
            <div className="text-right flex-1">
              <h2 className="text-xs sm:text-sm font-bold text-gray-900">
                {step === 0 ? "شماره حساب شما" : "تأیید هویت و رمز عبور جدید"}
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                {step === 0
                  ? "شماره موبایل ثبت‌شده در حساب کاربری"
                  : `کد ارسال‌شده به ${phoneNumber}`}
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

              <div className="pt-1 text-center text-xs sm:text-sm">
                <span className="text-gray-500">حساب کاربری ندارید؟ </span>
                <Link href="/sign-up" className="font-bold text-[#F97316] hover:underline">
                  ثبت‌نام کنید
                </Link>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 sm:h-12.5 w-full rounded-2xl bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? "در حال ارسال..." : "ارسال کد تأیید"}
                  {!isSubmitting && <ArrowLeft className="size-4 shrink-0" />}
                </Button>
              </div>

              <div className="pt-3 text-center">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm text-gray-500 hover:text-[#F97316] font-medium transition-colors"
                >
                  <span>بازگشت به صفحه ورود</span>
                  <ArrowLeft className="size-3.5" />
                </Link>
              </div>
            </form>
          ) : (
            <form noValidate onSubmit={handleResetSubmit(onResetPassword)} className="space-y-4">
              <div className="space-y-1 text-center">
                <p className="text-xs font-semibold text-gray-700">کد ۶ رقمی ارسال‌شده را وارد کنید:</p>
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
                  placeholder="حداقل ۸ کاراکتر"
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
                  className="h-12 sm:h-12.5 w-full rounded-2xl bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? "در حال تغییر رمز..." : "تغییر رمز عبور"}
                  {!isSubmitting && <ArrowLeft className="size-4 shrink-0" />}
                </Button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="text-xs sm:text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors cursor-pointer"
                >
                  مرحله قبل
                </button>
                <Link
                  href="/"
                  className="text-xs sm:text-sm text-gray-500 hover:text-[#F97316] font-medium transition-colors"
                >
                  انصراف و بازگشت
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
