"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  UserRound,
  Hash,
  Phone,
  Lock,
  ShieldCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  Send,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast, Toaster } from "react-hot-toast"
import { cn } from "@/lib/utils"
import api from "@/lib/axios"
import { API_ROUTES, createApiUrl } from "@/lib/api"
import { toEnglishDigits, toPersianDigits } from "@/lib/formatters"
import { Field } from "@/components/account/Field"
import { VerificationCode } from "@/components/account/VerificationCode"
import { AuthPageBackground } from "@/components/account/AuthPageBackground"

export const dynamic = "force-dynamic"

const signUpSchema = z
  .object({
    firstName: z
      .string()
      .min(1, { message: "لطفاً نام را وارد کنید" })
      .min(2, { message: "نام باید حداقل ۲ حرف باشد" }),
    lastName: z
      .string()
      .min(1, { message: "لطفاً نام خانوادگی را وارد کنید" })
      .min(2, { message: "نام خانوادگی باید حداقل ۲ حرف باشد" }),
    studentNumber: z.preprocess(
      (val) => toEnglishDigits((val as string) || "").trim(),
      z
        .string()
        .min(1, { message: "لطفاً شماره دانشجویی را وارد کنید" })
        .regex(/^\d{7,12}$/, { message: "شماره دانشجویی باید بین ۷ تا ۱۲ رقم باشد" })
    ),
    phoneNumber: z.preprocess(
      (val) => toEnglishDigits((val as string) || "").trim(),
      z
        .string()
        .min(1, { message: "لطفاً شماره موبایل را وارد کنید" })
        .regex(/^09\d{9}$/, { message: "شماره تلفن باید ۱۱ رقم و با ۰۹ شروع شود" })
    ),
    password: z
      .string()
      .min(1, { message: "لطفاً رمز عبور را وارد کنید" })
      .min(8, { message: "رمز عبور باید حداقل ۸ کاراکتر باشد" }),
    confirmPassword: z
      .string()
      .min(1, { message: "لطفاً تکرار رمز عبور را وارد کنید" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "رمزهای عبور مطابقت ندارند",
    path: ["confirmPassword"],
  })

type SignUpForm = z.infer<typeof signUpSchema>

const steps = ["اطلاعات فردی", "اطلاعات دانشجویی", "تأیید موبایل", "رمز عبور"]
const stepIcons = [UserRound, Hash, ShieldCheck, Lock]
const faDigits = ["۱", "۲", "۳", "۴"]

export default function SignUp() {
  const [step, setStep] = useState(0)
  const [verificationCode, setVerificationCode] = useState("")
  const [verificationToken, setVerificationToken] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [codeError, setCodeError] = useState(false)
  const [canResend, setCanResend] = useState(false)
  const [resendTimer, setResendTimer] = useState(180) // 3 minutes
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [registeredName, setRegisteredName] = useState("")
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      studentNumber: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
  })

  const firstName = watch("firstName")
  const lastName = watch("lastName")
  const studentNumber = watch("studentNumber")
  const phoneNumber = watch("phoneNumber")
  const password = watch("password")
  const confirmPassword = watch("confirmPassword")

  // Resend countdown timer
  useEffect(() => {
    if (step === 2 && resendTimer > 0 && !canResend) {
      timerRef.current = setTimeout(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
    } else if (resendTimer === 0 && !canResend) {
      setCanResend(true)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [resendTimer, canResend, step])

  // Step 1 to 2 transition: validate and send SMS code
  const handleSendCode = async () => {
    const isStepValid = await trigger(["studentNumber", "phoneNumber"])
    if (!isStepValid) return

    setIsVerifying(true)
    try {
      // 1. Check student number exists
      const studentRes = await api.post(createApiUrl(API_ROUTES.CHECK_STUDENT_NUMBER_EXISTS), {
        student_number: studentNumber,
      })
      if (studentRes.data.exists) {
        toast.error("این شماره دانشجویی قبلاً ثبت شده است")
        setIsVerifying(false)
        return
      }

      // 2. Check phone exists
      const phoneRes = await api.post(createApiUrl(API_ROUTES.CHECK_PHONE_EXISTS), {
        phone_number: phoneNumber,
      })
      if (phoneRes.data.exists) {
        toast.error("این شماره تلفن قبلاً ثبت شده است")
        setIsVerifying(false)
        return
      }

      // 3. Send SMS code
      await api.post(createApiUrl(API_ROUTES.SEND_VERIFICATION_CODE), {
        phone_number: phoneNumber,
      })
      toast.success("کد تأیید ارسال شد")
      setStep(2)
      setVerificationCode("")
      setCodeError(false)
      setResendTimer(180)
      setCanResend(false)
    } catch (error: unknown) {
      console.error("Verification code error:", error)
      const err = error as { response?: { status?: number; data?: { message?: string } } }
      if (err.response?.status === 429) {
        toast.error("تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد تلاش کنید.")
      } else {
        toast.error(err.response?.data?.message || "خطا در ارسال کد تأیید")
      }
    } finally {
      setIsVerifying(false)
    }
  }

  // Verify OTP code
  const handleVerifyCode = async (codeToVerify: string) => {
    if (codeToVerify.length !== 6) return

    setIsVerifying(true)
    setCodeError(false)
    try {
      const response = await api.post(createApiUrl(API_ROUTES.VERIFY_CODE), {
        phone_number: phoneNumber,
        code: codeToVerify,
      })

      if (response.data.verified) {
        setVerificationToken(response.data.verification_token)
        toast.success("شماره موبایل با موفقیت تأیید شد")
        setTimeout(() => {
          setStep(3)
        }, 400)
      } else {
        setCodeError(true)
        toast.error("کد وارد شده صحیح نمی‌باشد")
      }
    } catch (error: unknown) {
      console.error("Error verifying code:", error)
      setCodeError(true)
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || "کد تأیید نامعتبر است")
    } finally {
      setIsVerifying(false)
    }
  }

  // Resend code
  const handleResendCode = async () => {
    if (!canResend) return
    setIsVerifying(true)
    try {
      await api.post(createApiUrl(API_ROUTES.SEND_VERIFICATION_CODE), {
        phone_number: phoneNumber,
      })
      toast.success("کد تأیید مجدداً ارسال شد")
      setResendTimer(180)
      setCanResend(false)
      setVerificationCode("")
      setCodeError(false)
    } catch (error) {
      console.error(error)
      toast.error("خطا در ارسال مجدد کد تأیید")
    } finally {
      setIsVerifying(false)
    }
  }

  // Final Registration Submission
  const onFinalSubmit = async (data: SignUpForm) => {
    if (!verificationToken) {
      toast.error("لطفاً ابتدا شماره موبایل خود را تأیید کنید")
      setStep(2)
      return
    }

    setIsVerifying(true)
    try {
      await api.post(createApiUrl(API_ROUTES.SIGNUP), {
        first_name: data.firstName,
        last_name: data.lastName,
        phone_number: data.phoneNumber,
        password: data.password,
        role: "student",
        verification_code: verificationCode,
        verification_token: verificationToken,
        student_number: data.studentNumber,
      })

      setRegisteredName(`${data.firstName} ${data.lastName}`)
      setShowSuccessModal(true)

      setTimeout(() => {
        router.push("/")
      }, 3500)
    } catch (error: unknown) {
      console.error("Signup error:", error)
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || "خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.")
    } finally {
      setIsVerifying(false)
    }
  }

  // Primary action button router based on current step
  const handlePrimaryClick = async () => {
    if (step === 0) {
      const valid = await trigger(["firstName", "lastName"])
      if (valid) setStep(1)
    } else if (step === 1) {
      await handleSendCode()
    } else if (step === 2) {
      await handleVerifyCode(verificationCode)
    } else if (step === 3) {
      await handleSubmit(onFinalSubmit)()
    }
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${toPersianDigits(mins)}:${toPersianDigits(secs < 10 ? `0${secs}` : secs)}`
  }

  const submitLabel =
    step === 3
      ? "ثبت‌نام نهایی"
      : step === 1
      ? "ارسال کد تأیید"
      : step === 2
      ? "تأیید کد"
      : "ادامه"

  return (
    <div
      dir="rtl"
      className="relative flex min-h-svh flex-col justify-between overflow-x-hidden font-sans sm:justify-center py-6 sm:py-10"
    >
      {/* Decorative Wave & Doodle Background */}
      <AuthPageBackground variant="signup" />

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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white/95 p-6 text-center shadow-2xl backdrop-blur-md">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-orange-50 p-2 shadow-inner">
              <Image
                src="/images/javanfoods_logo.png"
                alt="رستوران جوان"
                width={56}
                height={56}
                className="object-contain"
              />
            </div>
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="size-10" />
            </div>
            <h2 className="text-2xl font-extrabold text-orange-600 mb-2">ثبت‌نام با موفقیت انجام شد!</h2>
            <p className="text-sm text-gray-600 leading-6 mb-6">
              {registeredName} عزیز، حساب کاربری دانشجویی شما با موفقیت ایجاد گردید. در حال انتقال به صفحه ورود...
            </p>
            <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-orange-100">
              <div className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-orange-400 to-orange-600" />
            </div>
            <Button
              onClick={() => router.push("/")}
              variant="brand"
              className="h-12 w-full font-bold"
            >
              ورود به حساب کاربری
            </Button>
          </div>
        </div>
      )}

      {/* Header matching the mockup: Logo + ثبت نام دانشجو + Subtitle */}
      <header className="relative z-10 flex flex-col items-center justify-center gap-1.5 px-6 pt-5 pb-3 text-center sm:pt-6 sm:pb-4 animate-in fade-in-0 slide-in-from-top-4 duration-700 ease-out fill-mode-both">
        <Link
          href="/"
          aria-label="رستوران جوان"
          className="relative flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        >
          <div className="relative size-18 sm:size-20 drop-shadow-md">
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
          ثبت نام دانشجو
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm font-semibold text-gray-700 mt-0.5">
          ساخت حساب دانشجویی جوان
        </p>
      </header>

      {/* Authentic Frosted Glass Card */}
      <section className="relative z-10 mx-auto flex w-[calc(100%-2rem)] sm:w-full max-w-[390px] shrink-0 flex-col rounded-[2.25rem] border border-white/90 bg-white/85 dark:bg-neutral-900/85 backdrop-blur-xl px-6 sm:px-7 py-6 sm:py-7 shadow-[0_15px_35px_-5px_rgba(249,115,22,0.12),0_4px_12px_rgba(0,0,0,0.03)] modal-glass my-auto animate-in fade-in-0 zoom-in-[0.98] slide-in-from-bottom-5 duration-700 delay-100 ease-out fill-mode-both">
        {/* Step Indicator Header matching the mockup */}
        <div className="mb-5 space-y-2">
          <div className="flex items-baseline justify-between text-xs sm:text-sm">
            <span className="font-extrabold text-orange-600">
              {step === 0 && "اطلاعات فردی"}
              {step === 1 && "شماره دانشجویی و موبایل"}
              {step === 2 && "تأیید شماره موبایل"}
              {step === 3 && "تعیین رمز عبور"}
            </span>
            <span className="text-gray-500 font-medium">
              مرحله {toPersianDigits(step + 1)} از ۴
            </span>
          </div>

          {/* Progress Bar Track */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-orange-100/90">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
              style={{ width: `${(step + 1) * 25}%` }}
            />
          </div>
        </div>

        {/* Form Body based on step */}
        <div className="space-y-4">
          {/* Step 0: Personal Info (نام و نام خانوادگی) */}
          {step === 0 && (
            <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-both">
              <Field
                id="firstName"
                label="نام"
                icon={UserRound}
                autoComplete="given-name"
                placeholder="نام شما"
                dir="rtl"
                required
                value={firstName}
                onChange={(e) => setValue("firstName", e.target.value, { shouldValidate: true })}
                error={errors.firstName?.message}
              />
              <Field
                id="lastName"
                label="نام خانوادگی"
                icon={UserRound}
                autoComplete="family-name"
                placeholder="نام خانوادگی شما"
                dir="rtl"
                required
                value={lastName}
                onChange={(e) => setValue("lastName", e.target.value, { shouldValidate: true })}
                error={errors.lastName?.message}
              />
            </div>
          )}

          {/* Step 1: Student & Phone Info */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-both">
              <Field
                id="studentNumber"
                label="شماره دانشجویی"
                icon={Hash}
                inputMode="numeric"
                dir="ltr"
                placeholder="مثال: 401123456"
                required
                value={studentNumber}
                onChange={(e) =>
                  setValue("studentNumber", toEnglishDigits(e.target.value).trim(), {
                    shouldValidate: true,
                  })
                }
                error={errors.studentNumber?.message}
              />
              <Field
                id="phoneNumber"
                label="شماره موبایل"
                icon={Phone}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                dir="ltr"
                placeholder="09123456789"
                required
                value={phoneNumber}
                onChange={(e) =>
                  setValue("phoneNumber", toEnglishDigits(e.target.value).trim(), {
                    shouldValidate: true,
                  })
                }
                error={errors.phoneNumber?.message}
              />
            </div>
          )}

          {/* Step 2: Verification Code */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-both">
              <div className="text-center pb-1">
                <h2 className="text-sm font-bold text-gray-800">کد تأیید پیامک‌شده را وارد کنید</h2>
                <p className="mt-1 text-xs text-gray-500 font-mono" dir="ltr">
                  {phoneNumber}
                </p>
              </div>

              <VerificationCode
                value={verificationCode}
                onChange={(val) => {
                  setVerificationCode(val)
                  setCodeError(false)
                  if (val.length === 6) {
                    handleVerifyCode(val)
                  }
                }}
                error={codeError}
                disabled={isVerifying}
              />

              <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                {canResend ? (
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleResendCode}
                    disabled={isVerifying}
                    className="p-0 h-auto text-xs text-orange-600 font-bold hover:underline"
                  >
                    ارسال مجدد کد تأیید
                  </Button>
                ) : (
                  <span>ارسال مجدد کد پس از {formatTimer(resendTimer)}</span>
                )}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-gray-500 hover:text-orange-600 transition-colors font-medium cursor-pointer"
                >
                  ویرایش شماره
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Passwords */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-both">
              <Field
                id="password"
                label="رمز عبور"
                icon={Lock}
                type="password"
                autoComplete="new-password"
                dir="ltr"
                placeholder="حداقل ۶ کاراکتر"
                showStrength
                required
                value={password}
                onChange={(e) => setValue("password", e.target.value, { shouldValidate: true })}
                error={errors.password?.message}
              />
              <Field
                id="confirmPassword"
                label="تکرار رمز عبور"
                icon={ShieldCheck}
                type="password"
                autoComplete="new-password"
                dir="ltr"
                placeholder="رمز عبور را دوباره وارد کنید"
                required
                value={confirmPassword}
                onChange={(e) =>
                  setValue("confirmPassword", e.target.value, { shouldValidate: true })
                }
                error={errors.confirmPassword?.message}
              />
            </div>
          )}

          {/* Back to Login link */}
          <div className="pt-2 text-center text-xs sm:text-sm">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-bold text-gray-600 hover:text-orange-600 transition-colors"
            >
              <span>حساب کاربری دارید؟ بازگشت به صفحه ورود</span>
              <ArrowLeft className="size-3.5" />
            </Link>
          </div>

          {/* Action Button */}
          <Button
            type="button"
            disabled={isVerifying}
            onClick={handlePrimaryClick}
            className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#FF7A1A] via-orange-500 to-[#EA580C] hover:from-orange-600 hover:to-[#C2410C] text-white text-base font-bold shadow-[0_8px_20px_rgba(234,88,12,0.35)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
          >
            <span>{isVerifying ? "در حال بررسی..." : submitLabel}</span>
            {!isVerifying && (step === 1 ? <Send className="size-4.5" /> : <ArrowLeft className="size-5" />)}
          </Button>

          {step > 0 && (
            <Button
              type="button"
              variant="ghost"
              disabled={isVerifying}
              className="h-11 w-full rounded-2xl text-xs sm:text-sm font-semibold text-gray-500 hover:text-orange-600 hover:bg-orange-50/50"
              onClick={() => {
                setStep((s) => s - 1)
                setCodeError(false)
              }}
            >
              <ArrowRight className="size-4 ml-1.5" />
              مرحله قبل
            </Button>
          )}
        </div>
      </section>

      {/* Breathing space for bottom wave and doodles */}
      <div className="h-6 sm:h-10 pointer-events-none" />
    </div>
  )
}
