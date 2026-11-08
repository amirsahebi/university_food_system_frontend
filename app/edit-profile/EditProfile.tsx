"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast, Toaster } from "react-hot-toast"
import {
  User,
  Phone,
  Save,
  Lock,
  LogOut,
  ChevronRight,
  GraduationCap,
  ShieldCheck,
  KeyRound,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import api from "@/lib/axios"
import { API_ROUTES, createApiUrl } from "@/lib/api"

const editProfileSchema = z.object({
  first_name: z.string().min(2, { message: "نام باید حداقل ۲ حرف باشد" }),
  last_name: z.string().min(2, { message: "نام خانوادگی باید حداقل ۲ حرف باشد" }),
  phone_number: z.string(),
  avatar_url: z.string().optional(),
  avatar: z.any().optional(),
  student_number: z.string().optional(),
})

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "رمز عبور فعلی الزامی است" }),
    newPassword: z.string().min(8, { message: "رمز عبور جدید باید حداقل ۸ کاراکتر باشد" }),
    confirmNewPassword: z.string().min(8, { message: "تکرار رمز عبور جدید باید حداقل ۸ کاراکتر باشد" }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "رمزهای عبور جدید مطابقت ندارند",
    path: ["confirmNewPassword"],
  })

export default function EditProfile() {
  const { isLoading } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: errorsProfile },
    setValue,
  } = useForm<z.infer<typeof editProfileSchema>>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone_number: "",
      student_number: "",
    },
  })

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: errorsPassword },
    reset: resetPasswordForm,
  } = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  })

  const fetchUserData = useCallback(async () => {
    try {
      const response = await api.get(createApiUrl(API_ROUTES.ME))
      const userData = response.data
      setValue("first_name", userData.first_name || "")
      setValue("last_name", userData.last_name || "")
      setValue("phone_number", userData.phone_number || "")
      setValue("student_number", userData.student_number || "")
    } catch (error) {
      console.error("Error fetching user data:", error)
      toast.error("خطا در دریافت اطلاعات کاربر")
    }
  }, [setValue])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  const onSubmit = async (data: z.infer<typeof editProfileSchema>) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("first_name", data.first_name)
      formData.append("last_name", data.last_name)
      formData.append("phone_number", data.phone_number)
      if (data.student_number) {
        formData.append("student_number", data.student_number)
      }

      const response = await api.put(createApiUrl(API_ROUTES.UPDATE_PROFILE), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      if (response.status === 200) {
        toast.success("پروفایل با موفقیت به‌روزرسانی شد")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      const err = error as { response?: { data?: { message?: string } } }
      const errorMsg = err.response?.data?.message || "خطا در به‌روزرسانی پروفایل"
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const onChangePassword = async (data: z.infer<typeof changePasswordSchema>) => {
    setIsChangingPassword(true)
    try {
      const response = await api.post(createApiUrl(API_ROUTES.CHANGE_PASSWORD), {
        currentPassword: data.currentPassword,
        old_password: data.currentPassword,
        newPassword: data.newPassword,
        new_password: data.newPassword,
      })

      if (response.status === 200) {
        toast.success("رمز عبور با موفقیت تغییر یافت")
        resetPasswordForm()
      }
    } catch (error) {
      console.error("Error changing password:", error)
      const err = error as {
        response?: {
          data?: {
            error?: string
            message?: string
            detail?: string
            old_password?: string | string[]
            new_password?: string | string[]
            currentPassword?: string | string[]
            newPassword?: string | string[]
          }
        }
      }
      const resData = err?.response?.data
      const errorMsg =
        resData?.error ||
        resData?.message ||
        resData?.detail ||
        (Array.isArray(resData?.old_password) ? resData.old_password[0] : resData?.old_password) ||
        (Array.isArray(resData?.new_password) ? resData.new_password[0] : resData?.new_password) ||
        (Array.isArray(resData?.currentPassword) ? resData.currentPassword[0] : resData?.currentPassword) ||
        (Array.isArray(resData?.newPassword) ? resData.newPassword[0] : resData?.newPassword) ||
        "خطا در تغییر رمز عبور"
      toast.error(errorMsg)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token")
      if (refreshToken) {
        await api.post(createApiUrl(API_ROUTES.SIGNOUT), { refresh_token: refreshToken })
      }
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      toast.success("با موفقیت از حساب کاربری خارج شدید")
      router.push("/")
    } catch (error) {
      console.error("Error logging out:", error)
      toast.error("خطا در خروج از حساب کاربری")
    }
  }

  if (isLoading) {
    return (
      <div className="bg-page min-h-screen flex items-center justify-center p-4">
        <div className="glass rounded-[1.75rem] p-8 flex items-center gap-3">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm font-medium">در حال بارگذاری اطلاعات...</span>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="bg-page min-h-screen pb-16 font-sans text-foreground">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="sticky top-0 z-40 px-2 sm:px-4 pt-3 sm:pt-4">
        <div className="glass mx-auto flex max-w-2xl items-center justify-between rounded-full px-3 sm:px-4 py-2 sm:py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="relative size-8 sm:size-9 shrink-0 drop-shadow-sm">
              <Image
                src="/images/javanfoods_logo.png"
                alt="رستوران جوان"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="font-extrabold text-sm sm:text-base text-foreground tracking-tight">
              ویرایش پروفایل
            </h1>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="glass"
              size="sm"
              onClick={() => router.push("/student-dashboard")}
              className="gap-1 rounded-full px-3 text-xs font-semibold cursor-pointer"
            >
              <ChevronRight className="size-4" />
              <span>داشبورد</span>
            </Button>
            <Button
              variant="glass"
              size="sm"
              onClick={handleLogout}
              className="size-8 sm:size-auto sm:px-3 p-0 rounded-full text-destructive hover:bg-destructive-soft transition cursor-pointer"
              title="خروج از حساب"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline text-xs mr-1">خروج</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto mt-6 max-w-2xl space-y-6 px-4">
        {/* Personal Info Card */}
        <div className="glass rounded-[1.75rem] p-5 sm:p-7 border border-glass-border space-y-5">
          <div className="flex items-center gap-3 border-b border-glass-border pb-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand text-primary-foreground shadow-glow">
              <User className="size-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground">اطلاعات کاربری</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                مشخصات فردی و شماره دانشجویی خود را ویرایش کنید
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitProfile(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="first_name" className="text-xs font-semibold text-foreground">
                  نام
                </Label>
                <div className="relative">
                  <Input
                    id="first_name"
                    {...registerProfile("first_name")}
                    className="glass-strong border-glass-border rounded-xl pr-10 focus:ring-primary focus:border-primary text-sm h-11"
                  />
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                </div>
                {errorsProfile.first_name && (
                  <p className="text-xs text-destructive mt-1">{errorsProfile.first_name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="last_name" className="text-xs font-semibold text-foreground">
                  نام خانوادگی
                </Label>
                <div className="relative">
                  <Input
                    id="last_name"
                    {...registerProfile("last_name")}
                    className="glass-strong border-glass-border rounded-xl pr-10 focus:ring-primary focus:border-primary text-sm h-11"
                  />
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                </div>
                {errorsProfile.last_name && (
                  <p className="text-xs text-destructive mt-1">{errorsProfile.last_name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone_number" className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>شماره تلفن (نام کاربری)</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <ShieldCheck className="size-3 text-emerald-500" />
                    غیرقابل تغییر
                  </span>
                </Label>
                <div className="relative">
                  <Input
                    id="phone_number"
                    {...registerProfile("phone_number")}
                    className="glass border-glass-border rounded-xl pr-10 bg-muted/30 text-muted-foreground text-sm h-11 cursor-not-allowed"
                    readOnly
                    dir="ltr"
                  />
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="student_number" className="text-xs font-semibold text-foreground">
                  شماره دانشجویی
                </Label>
                <div className="relative">
                  <Input
                    id="student_number"
                    {...registerProfile("student_number")}
                    className="glass-strong border-glass-border rounded-xl pr-10 focus:ring-primary focus:border-primary text-sm h-11"
                    dir="ltr"
                    placeholder="اختیاری"
                  />
                  <GraduationCap className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="brand"
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl text-sm font-bold shadow-md cursor-pointer gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    <span>در حال ذخیره...</span>
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    <span>ذخیره تغییرات</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="glass rounded-[1.75rem] p-5 sm:p-7 border border-glass-border space-y-5">
          <div className="flex items-center gap-3 border-b border-glass-border pb-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand text-primary-foreground shadow-glow">
              <KeyRound className="size-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground">تغییر رمز عبور</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                رمز عبور جدید باید حداقل ۸ کاراکتر داشته باشد
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword" className="text-xs font-semibold text-foreground">
                رمز عبور فعلی
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type="password"
                  {...registerPassword("currentPassword")}
                  className="glass-strong border-glass-border rounded-xl pr-10 focus:ring-primary focus:border-primary text-sm h-11"
                  dir="ltr"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
              {errorsPassword.currentPassword && (
                <p className="text-xs text-destructive mt-1">
                  {errorsPassword.currentPassword.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="newPassword" className="text-xs font-semibold text-foreground">
                  رمز عبور جدید
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type="password"
                    {...registerPassword("newPassword")}
                    className="glass-strong border-glass-border rounded-xl pr-10 focus:ring-primary focus:border-primary text-sm h-11"
                    dir="ltr"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                </div>
                {errorsPassword.newPassword && (
                  <p className="text-xs text-destructive mt-1">
                    {errorsPassword.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmNewPassword" className="text-xs font-semibold text-foreground">
                  تکرار رمز عبور جدید
                </Label>
                <div className="relative">
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    {...registerPassword("confirmNewPassword")}
                    className="glass-strong border-glass-border rounded-xl pr-10 focus:ring-primary focus:border-primary text-sm h-11"
                    dir="ltr"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                </div>
                {errorsPassword.confirmNewPassword && (
                  <p className="text-xs text-destructive mt-1">
                    {errorsPassword.confirmNewPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="brand"
                disabled={isChangingPassword}
                className="w-full h-11 rounded-xl text-sm font-bold shadow-md cursor-pointer gap-2"
              >
                {isChangingPassword ? (
                  <>
                    <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    <span>در حال به‌روزرسانی رمز...</span>
                  </>
                ) : (
                  <>
                    <Lock className="size-4" />
                    <span>تغییر رمز عبور</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
