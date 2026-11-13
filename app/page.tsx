"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Image from "next/image"
import Link from "next/link"
import { Phone, Lock, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast, Toaster } from "react-hot-toast"
import { useAuth } from "@/lib/auth-context"
import api from "@/lib/axios"
import { API_ROUTES, createApiUrl } from "@/lib/api"
import { toEnglishDigits } from "@/lib/formatters"
import { Field } from "@/components/account/Field"

export const dynamic = "force-dynamic"

const loginSchema = z.object({
  phone_number: z.preprocess(
    (val) => toEnglishDigits((val as string) || "").trim(),
    z
      .string()
      .min(1, { message: "لطفاً شماره موبایل را وارد کنید" })
      .regex(/^09\d{9}$/, { message: "شماره تلفن باید ۱۱ رقم و با ۰۹ شروع شود" })
  ),
  password: z
    .string()
    .min(1, { message: "لطفاً رمز عبور را وارد کنید" })
    .min(6, { message: "رمز عبور باید حداقل ۶ کاراکتر باشد" }),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login: authLogin, user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [hasStoredToken, setHasStoredToken] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
    const cachedRole = typeof window !== "undefined" ? localStorage.getItem("user_role") : null
    if (token) {
      setHasStoredToken(true)
      router.replace(`/${cachedRole || user?.role || "student"}-dashboard`)
    }
  }, [router, user])

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone_number: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true)
    setLoginError(null)

    try {
      const response = await api.post(createApiUrl(API_ROUTES.SIGNIN), data)
      const { access_token, refresh_token, user } = response.data
      localStorage.setItem("access_token", access_token)
      localStorage.setItem("refresh_token", refresh_token)
      localStorage.setItem("user_role", user.role)
      localStorage.setItem("user_data", JSON.stringify(user))
      await authLogin(user)
      toast.success("ورود با موفقیت انجام شد")
      router.replace(`/${user.role}-dashboard`)
    } catch (error: unknown) {
      console.error("Login error:", error)
      const errorResponse = error as { response?: { data?: { message?: string } } }
      const errorMessage =
        errorResponse.response?.data?.message || "خطا در ورود. لطفاً دوباره تلاش کنید."
      setLoginError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (hasStoredToken) {
    return (
      <div
        dir="rtl"
        className="relative flex min-h-screen flex-col items-center justify-center bg-white font-sans"
        style={{ fontFamily: "'Vazirmatn', 'Segoe UI', system-ui, sans-serif" }}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="relative size-20 animate-pulse">
            <Image
              src="/images/javanfoods_logo.png"
              alt="رستوران جوان"
              fill
              className="object-contain filter drop-shadow-md"
              priority
            />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl font-bold text-gray-800">رستوران جوان</h1>
            <div className="h-1.5 w-36 overflow-hidden rounded-full bg-orange-100">
              <div className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-orange-400 to-orange-600" />
            </div>
            <p className="text-xs text-muted-foreground animate-pulse">در حال ورود به سامانه...</p>
          </div>
        </div>
      </div>
    )
  }

  const phoneValue = watch("phone_number")
  const passwordValue = watch("password")

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
            رستوران جوان
          </h1>
          <p className="text-xs sm:text-sm text-white/90 font-medium">
            سامانه رزرو غذای دانشجویی
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
        <div
          className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-gray-200"
        />

        <div className="mx-auto w-full max-w-[420px]">
          <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  setValue("phone_number", toEnglishDigits(e.target.value).trim(), {
                    shouldValidate: true,
                  })
                }}
                error={errors.phone_number?.message}
              />
            </div>

            <div>
              <Field
                id="password"
                label="رمز عبور"
                icon={Lock}
                type="password"
                autoComplete="current-password"
                dir="ltr"
                placeholder="رمز عبور خود را وارد کنید"
                required
                value={passwordValue}
                onChange={(e) => {
                  setValue("password", e.target.value, { shouldValidate: true })
                }}
                error={errors.password?.message}
              />
            </div>

            <div className="text-center pt-0.5">
              <Link
                href="/forgot-password"
                className="inline-block text-xs sm:text-sm text-gray-500 transition-colors hover:text-[#F47B20] font-medium"
              >
                رمز عبور خود را فراموش کرده‌اید؟
              </Link>
            </div>

            {loginError && (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-2.5 text-xs leading-5 text-red-700 text-right animate-shake"
              >
                {loginError}
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 sm:h-12.5 w-full rounded-2xl bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? "در حال ورود..." : "ورود به حساب"}
                {!isSubmitting && <ArrowLeft className="size-4 shrink-0" />}
              </Button>
            </div>

            <div className="pt-3 text-center text-xs sm:text-sm">
              <span className="text-gray-500">حساب کاربری ندارید؟ </span>
              <Link href="/sign-up" className="font-bold text-[#F97316] hover:underline">
                ثبت‌نام کنید
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
