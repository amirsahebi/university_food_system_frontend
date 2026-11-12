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
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast, Toaster } from "react-hot-toast"
import { cn } from "@/lib/utils"
import api from "@/lib/axios"
import { API_ROUTES, createApiUrl } from "@/lib/api"
import { toEnglishDigits, toPersianDigits } from "@/lib/formatters"
import { Field } from "@/components/account/Field"
import { VerificationCode } from "@/components/account/VerificationCode"

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
      className="relative flex h-svh flex-col overflow-hidden bg-page font-sans sm:h-auto sm:min-h-svh sm:justify-center sm:overflow-visible sm:overflow-x-hidden"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-hero" />

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

      {/* Background Ambience with Dynamic Living Mesh */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-hero" />

      {/* Floating Animated Living Mesh Orbs with Soft Color Fluidity */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Saffron / Orange Flame Orb */}
        <div className="absolute -top-24 right-[-10%] size-[28rem] rounded-full bg-gradient-to-br from-orange-500/40 via-amber-400/30 to-transparent blur-3xl opacity-75 animate-living-mesh-1" />

        {/* Sunset Coral / Rose Radiance Orb */}
        <div className="absolute top-1/4 -left-20 size-[26rem] rounded-full bg-gradient-to-tr from-rose-500/35 via-orange-400/25 to-transparent blur-3xl opacity-70 animate-living-mesh-2" />

        {/* Golden Honey / Saffron Sunbeam Orb (under the card) */}
        <div className="absolute -bottom-20 left-1/4 size-[30rem] rounded-full bg-gradient-to-t from-amber-400/40 via-orange-300/25 to-transparent blur-3xl opacity-65 animate-living-mesh-3" />

        {/* Deep Coral / Terracotta Accent Orb */}
        <div className="absolute top-1/2 right-1/4 size-[22rem] rounded-full bg-gradient-to-br from-orange-600/25 via-pink-500/15 to-transparent blur-3xl opacity-50 animate-living-mesh-4" />
      </div>

      {/* Header with Official Borderless Logo and Gentle Entrance Animation */}
      <header className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-end gap-3 px-6 pb-5 pt-8 text-center sm:flex-none sm:gap-4 sm:pb-8 sm:pt-12 animate-in fade-in-0 slide-in-from-top-4 duration-700 ease-out fill-mode-both">
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
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl drop-shadow-xs">
            ثبت‌نام دانشجو
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base font-medium">ساخت حساب دانشجویی جوان</p>
        </div>
      </header>

      {/* Authentic Translucent Glass Card on Desktop & Mobile */}
      <section className="relative z-10 mx-auto flex max-h-[82svh] w-full max-w-[560px] shrink-0 flex-col rounded-t-[2.25rem] border-t border-glass-border glass-auth-card pt-5 shadow-sheet sm:mb-8 sm:max-h-none sm:max-w-[460px] sm:rounded-[1.75rem] sm:border sm:pt-7 animate-in fade-in-0 zoom-in-[0.98] slide-in-from-bottom-5 duration-700 delay-100 ease-out fill-mode-both">
        {/* Step Indicator */}
        <div className="shrink-0 px-5 pb-4 sm:px-8">
          {/* Mobile Stepper Bar */}
          <div className="mb-4 sm:hidden">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-bold text-orange-600">{steps[step]}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                مرحله {faDigits[step]} از ۴
              </span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-brand transition-all duration-500"
                style={{ width: `${(step + 1) * 25}%` }}
              />
            </div>
          </div>

          {/* Desktop Steps Grid */}
          <ol className="hidden grid-cols-4 gap-2 sm:grid" aria-label="مراحل ثبت‌نام">
            {steps.map((label, i) => {
              const Icon = stepIcons[i] ?? UserRound
              const isCurrent = i === step
              const isDone = i < step
              return (
                <li
                  key={label}
                  aria-current={isCurrent ? "step" : undefined}
                  className="flex min-w-0 flex-col items-center gap-1.5 text-center"
                >
                  <span
                    className={cn(
                      "grid size-10 place-items-center rounded-2xl transition-all",
                      isCurrent
                        ? "bg-brand text-white shadow-glow"
                        : isDone
                        ? "bg-emerald-100 text-emerald-600 font-bold"
                        : "bg-neutral-100 text-muted-foreground"
                    )}
                  >
                    {isDone ? <Check className="size-4 stroke-[3]" /> : <Icon className="size-4" />}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] leading-4",
                      isCurrent ? "font-bold text-orange-600" : "text-muted-foreground"
                    )}
                  >
                    {label}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>

        {/* Form Body */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div key={step} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-3 sm:px-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-both">
            {/* Step 0: Personal Info */}
            {step === 0 && (
              <>
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
              </>
            )}

            {/* Step 1: Student & Phone Info (Inputs MUST be LTR) */}
            {step === 1 && (
              <>
                <Field
                  id="studentNumber"
                  label="شماره دانشجویی"
                  icon={Hash}
                  inputMode="numeric"
                  dir="ltr"
                  placeholder="401123456"
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
              </>
            )}

            {/* Step 2: Verification Code */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-base font-bold text-foreground">تأیید شماره موبایل</h2>
                  <p className="mt-1 text-sm text-muted-foreground font-mono" dir="ltr">
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

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  {canResend ? (
                    <Button
                      type="button"
                      variant="link"
                      onClick={handleResendCode}
                      disabled={isVerifying}
                      className="p-0 h-auto text-xs text-orange-600 font-bold"
                    >
                      ارسال مجدد کد تأیید
                    </Button>
                  ) : (
                    <span>ارسال مجدد کد پس از {formatTimer(resendTimer)}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-muted-foreground hover:text-orange-600 transition-colors"
                  >
                    ویرایش شماره
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Passwords (Inputs MUST be LTR) */}
            {step === 3 && (
              <>
                <Field
                  id="password"
                  label="رمز عبور"
                  icon={Lock}
                  type="password"
                  autoComplete="new-password"
                  dir="ltr"
                  placeholder="حداقل ۸ کاراکتر"
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
              </>
            )}

            {/* Back to Login link */}
            <div className="border-t border-input/50 pt-3 text-center text-sm">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-orange-600 transition-colors"
              >
                <ArrowRight className="size-4" />
                حساب کاربری دارید؟ بازگشت به صفحه ورود
              </Link>
            </div>
          </div>

          {/* Action Bar */}
          <div className="shrink-0 border-t border-input/40 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 sm:px-8">
            <Button
              type="button"
              variant="brand"
              disabled={isVerifying}
              onClick={handlePrimaryClick}
              className="h-14 w-full text-base font-bold sm:h-12 sm:text-sm flex items-center justify-center gap-2"
            >
              {isVerifying ? "در حال بررسی..." : submitLabel}
              {!isVerifying && (step === 1 ? <Send className="size-4" /> : <ArrowLeft className="size-4" />)}
            </Button>
            {step > 0 && (
              <Button
                type="button"
                variant="ghost"
                disabled={isVerifying}
                className="mt-1 h-11 w-full rounded-full text-muted-foreground hover:bg-black/5"
                onClick={() => {
                  setStep((s) => s - 1)
                  setCodeError(false)
                }}
              >
                <ArrowRight className="size-4 ml-1" />
                مرحله قبل
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
