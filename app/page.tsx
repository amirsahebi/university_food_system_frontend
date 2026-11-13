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
import { AuthBackground } from "@/components/account/AuthBackground"

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
      className="relative flex h-svh flex-col overflow-hidden bg-page font-sans sm:h-auto sm:min-h-svh sm:justify-center sm:overflow-visible sm:overflow-x-hidden"
    >
      {/* Unified High-Performance Living Gravity Mesh Background */}
      <AuthBackground />

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

      {/* Header with borderless logo and elegant entrance animation */}
      <header className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 pt-10 pb-4 text-center sm:flex-none sm:gap-3.5 sm:pt-14 sm:pb-6 animate-in fade-in-0 slide-in-from-top-4 duration-700 ease-out fill-mode-both">
        {/* Borderless Floating Logo Container with Breathing Radiant Halo */}
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

        {/* Title ONLY - No text underneath */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl drop-shadow-xs">
            رستوران جوان
          </h1>
        </div>
      </header>

      {/* Authentic Glass Card - Translucent to show the living colorful mesh underneath */}
      <section className="relative z-10 mx-auto flex max-h-[78svh] w-full max-w-[560px] shrink-0 flex-col rounded-t-[2.25rem] border-t border-glass-border glass-auth-card pt-6 shadow-sheet sm:mb-8 sm:max-h-none sm:max-w-[460px] sm:rounded-[1.75rem] sm:border sm:pt-8 animate-in fade-in-0 zoom-in-[0.98] slide-in-from-bottom-5 duration-700 delay-100 ease-out fill-mode-both">
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-3 sm:px-8">
            <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-200 fill-mode-both">
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

            <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-300 fill-mode-both">
              <Field
                id="password"
                label="رمز عبور"
                icon={Lock}
                type="password"
                autoComplete="current-password"
                dir="ltr"
                placeholder="حداقل ۶ کاراکتر"
                required
                value={passwordValue}
                onChange={(e) => {
                  setValue("password", e.target.value, { shouldValidate: true })
                }}
                error={errors.password?.message}
              />
            </div>

            <div className="text-left animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-350 fill-mode-both">
              <Link
                href="/forgot-password"
                className="inline-block py-1 text-xs text-muted-foreground transition-colors hover:text-orange-600 font-medium"
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

            <div className="border-t border-black/5 dark:border-white/10 pt-3 text-center text-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-400 fill-mode-both">
              <span className="text-muted-foreground">حساب کاربری ندارید؟ </span>
              <Link href="/sign-up" className="font-bold text-orange-600 hover:underline">
                ثبت‌نام کنید
              </Link>
            </div>
          </div>

          <div className="shrink-0 border-t border-black/5 dark:border-white/10 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 sm:px-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-300 fill-mode-both">
            <Button
              type="submit"
              variant="brand"
              disabled={isSubmitting}
              className="h-14 w-full text-base font-bold sm:h-12 sm:text-sm flex items-center justify-center gap-2 shadow-glow hover:brightness-105 active:scale-[0.99] transition-all"
            >
              {isSubmitting ? "در حال ورود..." : "ورود به حساب"}
              {!isSubmitting && <ArrowLeft className="size-4" />}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
