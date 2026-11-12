"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Image from "next/image"
import Link from "next/link"
import { Phone, Lock, ArrowLeft, Sparkles, UtensilsCrossed, Zap, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast, Toaster } from "react-hot-toast"
import { useAuth } from "@/lib/auth-context"
import api from "@/lib/axios"
import { API_ROUTES, createApiUrl } from "@/lib/api"
import { toEnglishDigits } from "@/lib/formatters"
import { Field } from "@/components/account/Field"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

const loginSchema = z.object({
  phone_number: z.preprocess(
    (val) => toEnglishDigits(val as string).trim(),
    z.string().regex(/^09\d{9}$/, { message: "شماره تلفن باید ۱۱ رقم و با ۰۹ شروع شود" })
  ),
  password: z.string().min(6, { message: "رمز عبور باید حداقل ۶ کاراکتر باشد" }),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login: authLogin, isAuthenticated, isLoading, user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [hasStoredToken, setHasStoredToken] = useState(false)
  // Header visual styles: 1 = Warm Radiant Aura (Default), 2 = Neon Glass Ring, 3 = Living Mesh & Tagline
  const [headerStyle, setHeaderStyle] = useState<1 | 2 | 3>(1)
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
      {/* Background Ambience based on selected style */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-hero" />

      {/* Floating Animated Orbs for Depth and Warmth */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={cn(
            "absolute -top-24 right-[-10%] size-96 rounded-full blur-3xl opacity-60 transition-all duration-1000",
            headerStyle === 1 && "bg-gradient-to-br from-orange-400/30 via-amber-300/20 to-transparent blob-animate-1",
            headerStyle === 2 && "bg-gradient-to-br from-rose-400/25 via-orange-300/20 to-transparent",
            headerStyle === 3 && "bg-gradient-to-br from-amber-400/35 via-orange-200/25 to-transparent blob-animate-2"
          )}
        />
        <div
          className={cn(
            "absolute top-1/4 -left-20 size-80 rounded-full blur-3xl opacity-50 transition-all duration-1000",
            headerStyle === 1 && "bg-gradient-to-tr from-amber-400/25 via-orange-300/15 to-transparent blob-animate-2",
            headerStyle === 2 && "bg-gradient-to-tr from-amber-300/25 via-orange-400/20 to-transparent",
            headerStyle === 3 && "bg-gradient-to-tr from-rose-400/25 via-amber-300/20 to-transparent blob-animate-1"
          )}
        />
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

      {/* Style Switcher Pill - Allows testing proposed styles interactively */}
      <div className="absolute top-3 left-4 z-30 flex items-center gap-1 rounded-full border border-white/60 bg-white/75 p-1 shadow-sm backdrop-blur-md text-[11px] font-medium text-foreground/75">
        <span className="px-2 text-muted-foreground flex items-center gap-1">
          <Sparkles className="size-3 text-orange-500" />
          طرح هدر:
        </span>
        <button
          type="button"
          onClick={() => setHeaderStyle(1)}
          className={cn(
            "rounded-full px-2.5 py-0.5 transition-all cursor-pointer",
            headerStyle === 1
              ? "bg-brand text-white font-bold shadow-xs"
              : "hover:bg-black/5 text-muted-foreground"
          )}
        >
          ۱: هاله و نشان‌ها
        </button>
        <button
          type="button"
          onClick={() => setHeaderStyle(2)}
          className={cn(
            "rounded-full px-2.5 py-0.5 transition-all cursor-pointer",
            headerStyle === 2
              ? "bg-brand text-white font-bold shadow-xs"
              : "hover:bg-black/5 text-muted-foreground"
          )}
        >
          ۲: رینگ نئونی
        </button>
        <button
          type="button"
          onClick={() => setHeaderStyle(3)}
          className={cn(
            "rounded-full px-2.5 py-0.5 transition-all cursor-pointer",
            headerStyle === 3
              ? "bg-brand text-white font-bold shadow-xs"
              : "hover:bg-black/5 text-muted-foreground"
          )}
        >
          ۳: مش زنده
        </button>
      </div>

      {/* Header with borderless logo and rich ambient elements */}
      <header className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 pt-12 pb-5 text-center sm:flex-none sm:gap-4 sm:pt-16 sm:pb-8">
        {/* Borderless Floating Logo Container */}
        <div className="relative group">
          {/* Style 1: Ambient Warm Saffron Aura */}
          {headerStyle === 1 && (
            <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-orange-400/30 to-amber-300/30 blur-xl animate-pulse" />
          )}

          {/* Style 2: Rotating Glass Neon Halo Ring */}
          {headerStyle === 2 && (
            <div className="absolute -inset-3.5 rounded-full border border-orange-400/40 border-dashed animate-spin-slow opacity-80" />
          )}

          {/* Style 3: Subtle Radiant Halo */}
          {headerStyle === 3 && (
            <div className="absolute -inset-5 rounded-full bg-radial from-orange-500/25 via-amber-300/10 to-transparent blur-lg" />
          )}

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

        {/* Title and Proposed Header Accents */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl drop-shadow-xs">
            رستوران جوان
          </h1>

          {/* Style 1: Frosted Glass Micro-Badges */}
          {headerStyle === 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5">
              <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-orange-700 shadow-sm backdrop-blur-md">
                <Zap className="size-3.5 text-orange-500" />
                سفارش و تحویل هوشمند سلف
              </span>
              <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-orange-700 shadow-sm backdrop-blur-md">
                <ShieldCheck className="size-3.5 text-emerald-500" />
                تخفیف ویژه دانشجویی
              </span>
            </div>
          )}

          {/* Style 2: Minimalist Glowing Status Capsule */}
          {headerStyle === 2 && (
            <div className="pt-0.5">
              <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-foreground/80 shadow-sm backdrop-blur-md">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                سامانه فعال رزرو و تحویل آنلاین غذای دانشگاه
              </span>
            </div>
          )}

          {/* Style 3: Elegant Culinary Persian Tagline */}
          {headerStyle === 3 && (
            <div className="pt-0.5">
              <p className="text-xs sm:text-sm font-medium text-orange-800/80 glass inline-block rounded-full px-4 py-1 shadow-xs">
                ✨ طعم اصیل و باکیفیت، بدون اتلاف وقت در صف
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Bottom sheet on mobile, centered card on desktop */}
      <section className="relative z-10 mx-auto flex max-h-[78svh] w-full max-w-[560px] shrink-0 flex-col rounded-t-[2.25rem] border-t border-glass-border bg-glass-strong pt-6 shadow-sheet backdrop-blur-2xl sm:mb-8 sm:max-h-none sm:max-w-[460px] sm:rounded-[1.75rem] sm:border sm:pt-8">
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
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
              placeholder="حداقل ۶ کاراکتر"
              required
              value={passwordValue}
              onChange={(e) => {
                setValue("password", e.target.value, { shouldValidate: true })
              }}
              error={errors.password?.message}
            />

            <div className="text-left">
              <Link
                href="/forgot-password"
                className="inline-block py-1 text-xs text-muted-foreground transition-colors hover:text-orange-600"
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

            <div className="border-t border-input/50 pt-3 text-center text-sm">
              <span className="text-muted-foreground">حساب کاربری ندارید؟ </span>
              <Link href="/sign-up" className="font-bold text-orange-600 hover:underline">
                ثبت‌نام کنید
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
              {isSubmitting ? "در حال ورود..." : "ورود به حساب"}
              {!isSubmitting && <ArrowLeft className="size-4" />}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
