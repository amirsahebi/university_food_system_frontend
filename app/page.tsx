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
import { AuthPageBackground } from "@/components/account/AuthPageBackground"

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
  const { login: authLogin, isAuthenticated, isLoading, user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [hasStoredToken, setHasStoredToken] = useState(false)

  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
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

  const hasToken = typeof window !== "undefined" ? !!localStorage.getItem("access_token") : false
  if (!isClient || hasStoredToken || (hasToken && (isAuthenticated || isLoading))) {
    return (
      <div
        dir="rtl"
        className="relative flex min-h-svh flex-col items-center justify-center bg-page font-sans"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-hero" />
        <div className="relative z-10 flex flex-col items-center space-y-4">
          <div className="relative size-24 animate-pulse">
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
      className="relative flex min-h-svh flex-col justify-between overflow-x-hidden font-sans sm:justify-center py-6 sm:py-10"
    >
      {/* Decorative Wave & Doodle Background */}
      <AuthPageBackground variant="login" />

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

      {/* Header matching the mockup: Logo + رستوران جوان + Subtitle */}
      <header className="relative z-10 flex flex-col items-center justify-center gap-2 px-6 pt-6 pb-4 text-center sm:pt-4 sm:pb-5 animate-in fade-in-0 slide-in-from-top-4 duration-700 ease-out fill-mode-both">
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

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1 drop-shadow-xs">
          رستوران جوان
        </h1>

        {/* Subtitle with divider lines: — طعم خوب، تجربه‌ای خوشمزه‌تر — */}
        <div className="flex items-center justify-center gap-2.5 text-xs sm:text-sm font-bold text-orange-950/80 mt-0.5">
          <span className="w-6 sm:w-10 h-0.5 bg-orange-400/60 rounded-full" />
          <span>طعم خوب، تجربه‌ای خوشمزه‌تر</span>
          <span className="w-6 sm:w-10 h-0.5 bg-orange-400/60 rounded-full" />
        </div>
      </header>

      {/* Authentic Frosted Glass Card */}
      <section className="relative z-10 mx-auto flex w-full max-w-[460px] shrink-0 flex-col rounded-t-[2.5rem] sm:rounded-[2.25rem] border border-white/80 bg-white/85 dark:bg-neutral-900/85 backdrop-blur-2xl px-6 sm:px-8 pt-7 pb-6 shadow-[0_20px_50px_-15px_rgba(249,115,22,0.18)] modal-glass mb-2 sm:mb-6 animate-in fade-in-0 zoom-in-[0.98] slide-in-from-bottom-5 duration-700 delay-100 ease-out fill-mode-both">
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
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

          <div className="text-center pt-0.5">
            <Link
              href="/forgot-password"
              className="inline-block py-1 text-xs sm:text-sm font-semibold text-gray-600 hover:text-orange-600 transition-colors"
            >
              رمز عبور خود را فراموش کرده‌اید؟
            </Link>
          </div>

          {loginError && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-xs leading-5 text-red-700 animate-shake"
            >
              {loginError}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-13 sm:h-12 w-full rounded-2xl bg-gradient-to-r from-[#FF7A1A] via-orange-500 to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white text-base font-bold shadow-[0_10px_25px_-5px_rgba(234,88,12,0.45)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isSubmitting ? "در حال ورود..." : "ورود به حساب"}</span>
            {!isSubmitting && <ArrowLeft className="size-5" />}
          </Button>

          <div className="pt-2 text-center text-xs sm:text-sm">
            <span className="text-gray-600 font-medium">حساب کاربری ندارید؟ </span>
            <Link href="/sign-up" className="font-extrabold text-orange-600 hover:text-orange-700 hover:underline">
              ثبت‌نام کنید
            </Link>
          </div>
        </form>
      </section>
    </div>
  )
}
