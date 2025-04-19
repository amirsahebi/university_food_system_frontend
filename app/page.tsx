"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { toast, Toaster } from "react-hot-toast"
import { Phone, Lock } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import api from "@/lib/axios"
import { API_ROUTES, createApiUrl } from "@/lib/api"

const loginSchema = z.object({
  phone_number: z.string().regex(/^09\d{9}$/, { message: "شماره تلفن باید 11 رقم و با 09 شروع شود" }),
  password: z.string().min(6, { message: "رمز عبور باید حداقل 6 کاراکتر باشد" }),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login: authLogin } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true)
    setLoginError(null)

    try {
      const response = await api.post(createApiUrl(API_ROUTES.SIGNIN), data)
      const { access_token, refresh_token, user } = response.data
      localStorage.setItem("access_token", access_token)
      localStorage.setItem("refresh_token", refresh_token)
      await authLogin(user)
      toast.success("ورود با موفقیت انجام شد")
      router.push(`/${user.role}-dashboard`)
    } catch (error: unknown) {
      console.error("Login error:", error)
      const errorResponse = error as { response?: { data?: { message?: string } } }
      const errorMessage = errorResponse.response?.data?.message || "خطا در ورود. لطفا دوباره تلاش کنید."
      setLoginError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-pattern bg-pattern-animate"
      dir="rtl"
    >
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden">
          <svg
            className="absolute top-0 right-0 h-full w-full"
            viewBox="0 0 900 600"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g>
              <path
                className="blob-animate-1"
                d="M0 486.7C-52.7 454 -105.4 421.3 -166.8 402.8C-228.3 384.3 -298.5 380 -344.2 344.2C-389.8 308.3 -410.9 241 -430.5 178.3C-450.2 115.7 -468.5 57.9 -486.7 0L0 0Z"
                fill="url(#orange-gradient-1)"
                transform="translate(900, 0)"
              ></path>
            </g>
            <g>
              <path
                className="blob-animate-2"
                d="M0 -486.7C59.2 -472.3 118.5 -457.9 181.4 -437.9C244.3 -417.9 311 -392.4 344.2 -344.2C377.4 -295.9 377.2 -224.9 395.4 -163.8C413.6 -102.6 450.2 -51.3 486.7 0L0 0Z"
                fill="url(#orange-gradient-2)"
                transform="translate(0, 600)"
              ></path>
            </g>
            <defs>
              <linearGradient id="orange-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.3"></stop>
                <stop offset="100%" stopColor="#fdba74" stopOpacity="0.2"></stop>
              </linearGradient>
              <linearGradient id="orange-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fb923c" stopOpacity="0.3"></stop>
                <stop offset="100%" stopColor="#fed7aa" stopOpacity="0.2"></stop>
              </linearGradient>
            </defs>
          </svg>
        </div>
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

      <Card className="w-full max-w-md backdrop-blur-md bg-white/55 rounded-3xl shadow-xl border-0 relative z-10 animate-fade-in">
        <CardHeader className="flex flex-col items-center space-y-2 pb-2">
          <div
            className="mb-2"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="relative h-20 w-20">
              <Image src="/images/javanfoods_logo.png" alt="رستوران جوان" fill className="object-contain" priority />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800" style={{ animationDelay: "0.2s" }}>
            رستوران جوان
          </h1>
        </CardHeader>

        <CardContent className="pt-4 mt-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="relative" style={{ animationDelay: "0.4s" }}>
              <Input
                id="phone_number"
                type="tel"
                placeholder="شماره موبایل"
                {...register("phone_number")}
                className="pr-12 py-6 text-right rounded-xl border-gray-200 bg-white/70 focus:bg-white form-input-focus input-icon-right"
              />
              <Phone className="absolute right-4 top-1/2 transform -translate-y-1/2 text-orange-400" size={20} />
              {errors.phone_number && (
                <p className="text-sm text-red-500 mt-1 animate-shake">{errors.phone_number.message}</p>
              )}
            </div>

            <div className="relative" style={{ animationDelay: "0.5s" }}>
              <Input
                id="password"
                type="password"
                placeholder="رمز عبور"
                {...register("password")}
                className="pr-12 py-6 text-right rounded-xl border-gray-200 bg-white/70 focus:bg-white form-input-focus input-icon-right"
              />
              <Lock className="absolute right-4 top-1/2 transform -translate-y-1/2 text-orange-400" size={20} />
              {errors.password && <p className="text-sm text-red-500 mt-1 animate-shake">{errors.password.message}</p>}
            </div>

            {loginError && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-shake">
                {loginError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-6 text-lg bg-[#f97316] hover:bg-orange-600 rounded-xl font-medium transition-all btn-hover-effect"
              style={{ animationDelay: "0.6s" }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "در حال ورود..." : "ورود"}
            </Button>
          </form>

          <div className="mt-6 text-center" style={{ animationDelay: "0.7s" }}>
            <Link href="/forgot-password" className="text-sm text-gray-600 hover:text-orange-500 transition-colors">
              رمز عبور خود را فراموش کرده‌اید؟
            </Link>

            <div className="mt-4 text-sm text-gray-600 flex justify-center gap-2">
              <span>حساب کاربری ندارید؟</span>
              <Link href="/sign-up" className="text-orange-500 hover:text-orange-600 hover:underline transition-colors">
                ثبت‌نام کنید
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
