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
import { WavyAuthBackground } from "@/components/account/WavyAuthBackground"

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
        className="relative flex min-h-svh flex-col items-center justify-center bg-[#FFF8F2] font-sans"
      >
        <WavyAuthBackground variant="login" />
        <div className="relative z-10 flex flex-col items-center space-y-4">
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
      className="relative flex min-h-screen flex-col justify-between overflow-x-hidden font-sans px-4 py-6 sm:py-10 selection:bg-orange-500/20"
    >
      {/* Background with Layered Waves & Vector Food Illustrations */}
      <WavyAuthBackground variant="login" />

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

      {/* Header with Logo, Title, and Decorative Subtitle Dashes */}
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
          رستوران جوان
        </h1>

        {/* Subtitle with dual orange dashes matching exact design */}
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-600 font-medium mt-1.5">
          <span className="w-5 h-0.5 bg-[#F47B20] rounded-full inline-block" />
          <span>طعم خوب، تجربه‌ای خوشمزه‌تر</span>
          <span className="w-5 h-0.5 bg-[#F47B20] rounded-full inline-block" />
        </div>
      </header>

      {/* Authentic Frosted Glass Card */}
      <section className="relative z-10 mx-auto w-full max-w-[420px] rounded-[2rem] bg-white/85 dark:bg-neutral-900/85 backdrop-blur-xl border border-white/90 dark:border-white/20 shadow-xl shadow-orange-500/10 p-5 sm:p-7 animate-in fade-in-0 zoom-in-[0.98] slide-in-from-bottom-5 duration-700 delay-100 ease-out fill-mode-both">
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
              className="inline-block text-xs text-gray-500 transition-colors hover:text-[#F47B20] font-medium"
            >
              رمز عبور خود را فراموش کرده‌اید؟
            </Link>
          </div>

          {loginError && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-2.5 text-xs leading-5 text-red-700 animate-shake text-right"
            >
              {loginError}
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 sm:h-12.5 w-full rounded-2xl bg-gradient-to-r from-[#F47B20] to-[#E06A10] hover:from-[#E06A10] hover:to-[#D05A00] text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? "در حال ورود..." : "ورود به حساب"}
              {!isSubmitting && <ArrowLeft className="size-4 shrink-0" />}
            </Button>
          </div>

          <div className="pt-3 text-center text-xs sm:text-sm">
            <span className="text-gray-500">حساب کاربری ندارید؟ </span>
            <Link href="/sign-up" className="font-bold text-[#F47B20] hover:underline">
              ثبت‌نام کنید
            </Link>
          </div>
        </form>
      </section>

      {/* Spacer to balance vertical layout */}
      <div className="h-6 sm:h-8" />
    </div>
  )
}
