'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast, Toaster } from 'react-hot-toast'
import { User, Phone, Camera, Save, Lock, Menu, LogOut, ChevronLeft, GraduationCap } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from '@/lib/auth-context'
import api from '@/lib/axios'
import { API_ROUTES, createApiUrl } from '@/lib/api'

const editProfileSchema = z.object({
  first_name: z.string().min(2, { message: 'نام باید حداقل 2 حرف باشد' }),
  last_name: z.string().min(2, { message: 'نام خانوادگی باید حداقل 2 حرف باشد' }),
  phone_number: z.string(),
  avatar_url: z.string().optional(),
  avatar: z.any().optional(),
  student_number: z.string().optional(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'رمز عبور فعلی الزامی است' }),
  newPassword: z.string().min(8, { message: 'رمز عبور جدید باید حداقل 8 کاراکتر باشد' }),
  confirmNewPassword: z.string().min(8, { message: 'تکرار رمز عبور جدید باید حداقل 8 کاراکتر باشد' }),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "رمزهای عبور جدید مطابقت ندارند",
  path: ["confirmNewPassword"],
})

export default function EditProfile() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const { register: registerProfile, handleSubmit: handleSubmitProfile, formState: { errors: errorsProfile }, setValue } = useForm<z.infer<typeof editProfileSchema>>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone_number: '',
      student_number: '',
    }
  })

  const { register: registerPassword, handleSubmit: handleSubmitPassword, formState: { errors: errorsPassword } } = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    }
  })

  useEffect(() => {
    fetchUserData();
  }, [setValue])

  const fetchUserData = async () => {
    try {
      const response = await api.get(createApiUrl(API_ROUTES.ME));
      const userData = response.data;
      console.log(response.data)
      setValue('first_name', userData.first_name || '');
      setValue('last_name', userData.last_name || '');
      setValue('phone_number', userData.phone_number || '');
      setValue('student_number', userData.student_number || '');
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('خطا در دریافت اطلاعات کاربر');
    }
  };

  const onSubmit = async (data: z.infer<typeof editProfileSchema>) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('first_name', data.first_name)
      formData.append('last_name', data.last_name)
      formData.append('phone_number', data.phone_number)
      formData.append('student_number', data.student_number || '')
      

      await api.put(createApiUrl(API_ROUTES.UPDATE_PROFILE), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming you store the token in localStorage
        }
      })
      toast.success('پروفایل با موفقیت به‌روزرسانی شد')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('خطا در به‌روزرسانی پروفایل')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onChangePassword = async (data: z.infer<typeof changePasswordSchema>) => {
    setIsChangingPassword(true)
    try {
      await api.post(createApiUrl(API_ROUTES.CHANGE_PASSWORD), {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      })
      toast.success('رمز عبور با موفقیت تغییر کرد')
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('خطا در تغییر رمز عبور')
    } finally {
      setIsChangingPassword(false)
    }
  }


  const handleLogout = async () => {
    try {
      await api.post(createApiUrl(API_ROUTES.SIGNOUT),{
        refresh_token: localStorage.getItem('refresh_token')
      })
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      toast.success('با موفقیت از حساب کاربری خارج شدید')
      router.push('/')
    } catch (error) {
      console.error('Error logging out:', error)
      toast.error('خطا در خروج از حساب کاربری')
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-[#FBF7F4] p-4 rtl">
      <Toaster position="top-center" />
      <header className="flex justify-between items-center mb-6">
        <Button variant="ghost" size="icon" className="rounded-full transition-all duration-300 ease-in-out hover:scale-105">
          <Menu className="h-6 w-6" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full transition-all duration-300 ease-in-out hover:scale-105">
              <User className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuItem asChild dir='rtl'>
              <Link href="/student-dashboard" className="flex items-center">
                <ChevronLeft className="ml-2 h-4 w-4" />
                <span>بازگشت به داشبورد</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} dir='rtl'>
              <LogOut className="ml-2 h-4 w-4" />
              <span>خروج</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="max-w-4xl mx-auto" dir='rtl'>
        <Card className="bg-white rounded-2xl shadow-[0_0_10px_rgba(0,0,0,0.1)] mb-6">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold text-center text-primary mb-6">ویرایش پروفایل</h1>
            <form onSubmit={handleSubmitProfile(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="first_name" className="mb-2 block">نام</Label>
                  <div className="relative">
                    <Input id="first_name" {...registerProfile('first_name')} className="pr-10" />
                    <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  </div>
                  {errorsProfile.first_name && <p className="text-red-500 text-sm mt-1">{errorsProfile.first_name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="last_name" className="mb-2 block">نام خانوادگی</Label>
                  <div className="relative">
                    <Input id="last_name" {...registerProfile('last_name')} className="pr-10" />
                    <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  </div>
                  {errorsProfile.last_name && <p className="text-red-500 text-sm mt-1">{errorsProfile.last_name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="phone_number" className="mb-2 block">شماره تلفن</Label>
                  <div className="relative">
                    <Input
                      id="phone_number"
                      {...registerProfile('phone_number')}
                      className="pr-10"
                      readOnly
                    />
                    <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="student_number" className="mb-2 block">شماره دانشجویی</Label>
                  <div className="relative">
                    <Input id="student_number" {...registerProfile('student_number')} className="pr-10" />
                    <GraduationCap className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Save className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl shadow-[0_0_10px_rgba(0,0,0,0.1)]">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-primary mb-4">تغییر رمز عبور</h2>
            <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword" className="mb-2 block">رمز عبور فعلی</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type="password"
                    {...registerPassword('currentPassword')}
                    className="pr-10"
                  />
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                </div>
                {errorsPassword.currentPassword && <p className="text-red-500 text-sm mt-1">{errorsPassword.currentPassword.message}</p>}
              </div>
              <div>
                <Label htmlFor="newPassword" className="mb-2 block">رمز عبور جدید</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type="password"
                    {...registerPassword('newPassword')}
                    className="pr-10"
                  />
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                </div>
                {errorsPassword.newPassword && <p className="text-red-500 text-sm mt-1">{errorsPassword.newPassword.message}</p>}
              </div>
              <div>
                <Label htmlFor="confirmNewPassword" className="mb-2 block">تکرار رمز عبور جدید</Label>
                <div className="relative">
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    {...registerPassword('confirmNewPassword')}
                    className="pr-10"
                  />
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                </div>
                {errorsPassword.confirmNewPassword && <p className="text-red-500 text-sm mt-1">{errorsPassword.confirmNewPassword.message}</p>}
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isChangingPassword}>
                {isChangingPassword ? (
                  <Lock className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                {isChangingPassword ? 'در حال تغییر رمز عبور...' : 'تغییر رمز عبور'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

