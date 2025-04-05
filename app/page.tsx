
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { toast, Toaster } from "react-hot-toast"
import { LogIn, Phone, Lock } from "lucide-react"
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
      toast.error(errorMessage, {
        duration: 5000, // Increase duration to 5 seconds
        id: "login-error", // Use a consistent ID to prevent duplicates
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-bl from-orange-100 to-red-100 flex items-center justify-center p-4 sm:p-6 md:p-8"
      dir="rtl"
    >
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 5000, // Increase default duration
          style: {
            background: "#FFF",
            color: "#000",
          },
        }}
      />
      <Card className="w-full max-w-md shadow-[0_20px_50px_rgba(8,_112,_184,_0.3)] rounded-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">ورود به حساب کاربری</CardTitle>
          <CardDescription className="text-center">
            وارد حساب کاربری خود در سامانه رزرو غذای دانشگاه شوید
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" dir="rtl">
            <div className="space-y-2">
              <Label htmlFor="phone_number">شماره تلفن</Label>
              <div className="relative">
                <Input
                  id="phone_number"
                  type="tel"
                  placeholder="09123456789"
                  {...register("phone_number")}
                  className="pr-10"
                  dir="rtl"
                />
                <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              </div>
              {errors.phone_number && <p className="text-sm text-red-500">{errors.phone_number.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
              <div className="relative">
                <Input id="password" type="password" placeholder="••••••" {...register("password")} className="pr-10" />
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              </div>
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>

            {/* Display login error message */}
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {loginError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-5 sm:py-6 text-base sm:text-lg"
              disabled={isSubmitting}
              dir="rtl"
            >
              {isSubmitting ? (
                <>
                  در حال ورود...
                  <LogIn className="mr-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                <>
                  ورود
                  <LogIn className="mr-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 px-4 sm:px-6 pb-6">
          <Link href="/forgot-password" className="text-sm text-orange-600 hover:underline">
            رمز عبور خود را فراموش کرده‌اید؟
          </Link>
          <div className="text-sm text-gray-600">
            حساب کاربری ندارید؟{" "}
            <Link href="/sign-up" className="text-orange-600 hover:underline">
              ثبت‌نام کنید
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

