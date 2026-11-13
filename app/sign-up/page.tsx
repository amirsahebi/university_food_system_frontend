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
  ArrowRight,
  ArrowLeft,
  Send,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast, Toaster } from "react-hot-toast"
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
      className="relative min-h-screen bg-white font-sans overflow-x-hidden flex flex-col justify-between selection:bg-orange-500/20"
      style={{ fontFamily: "'Vazirmatn', 'Segoe UI', system-ui, sans-serif" }}
    >
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
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
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
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-bold"
            >
              ورود به حساب کاربری
            </Button>
          </div>
        </div>
      )}

      {/* ───── HERO SECTION (Design A) ───── */}
      <div
        className="relative w-full overflow-hidden shrink-0"
        style={{
          height: "46vh",
          minHeight: 250,
          background: "linear-gradient(145deg, #ff7a00 0%, #f95d00 40%, #e84b00 70%, #c73a00 100%)",
        }}
      >
        {/* Soft radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 70% at 50% 110%, rgba(255,255,255,0.16) 0%, transparent 70%)",
          }}
        />
        {/* Subtle decorative circles */}
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            top: -60,
            right: -60,
            width: 240,
            height: 240,
            background: "rgba(255,255,255,0.07)",
          }}
        />
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            top: -20,
            right: -20,
            width: 140,
            height: 140,
            background: "rgba(255,255,255,0.07)",
          }}
        />
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            bottom: -40,
            left: -50,
            width: 200,
            height: 200,
            background: "rgba(0,0,0,0.06)",
          }}
        />

        {/* Logo + Title centered in hero */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 text-white text-center px-6 animate-hero-entrance">
          <Link
            href="/"
            aria-label="رستوران جوان"
            className="relative transition-transform hover:scale-105 active:scale-95"
          >
            <div
              className="relative"
              style={{
                width: 82,
                height: 82,
                filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.28)) brightness(1.05)",
              }}
            >
              <Image
                src="/images/javanfoods_logo.png"
                alt="رستوران جوان"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
          <h1
            className="text-2xl sm:text-3xl font-black tracking-tight"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.25)" }}
          >
            ثبت‌نام دانشجو
          </h1>
          <p className="text-xs sm:text-sm text-white/90 font-medium">
            ساخت حساب دانشجویی جوان
          </p>
        </div>
      </div>

      {/* ───── CARD SHEET ───── */}
      <div
        className="relative flex-1 w-full bg-white px-5 pt-6 pb-10 sm:px-8 sm:pt-8"
        style={{
          marginTop: "-2rem",
          borderTopLeftRadius: "2rem",
          borderTopRightRadius: "2rem",
          boxShadow: "0 -4px 30px rgba(0,0,0,0.07)",
        }}
      >
        {/* Handle bar */}
        <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-gray-200" />

        <div className="mx-auto w-full max-w-[420px] animate-form-content">
          {/* Step Indicator */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-bold text-[#F97316]">
                {step === 0
                  ? "اطلاعات فردی"
                  : step === 1
                  ? "اطلاعات دانشجویی"
                  : step === 2
                  ? "تأیید شماره موبایل"
                  : "تعیین رمز عبور"}
              </span>
              <span className="text-xs text-gray-400 font-medium">
                مرحله {toPersianDigits(step + 1)} از ۴
              </span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#F97316] to-[#EA580C] rounded-full transition-all duration-300"
                style={{ width: `${(step + 1) * 25}%` }}
              />
            </div>
          </div>

          {/* Form Body */}
          <div className="space-y-4">
            {/* Step 0: Personal Info (firstName and lastName: dir="rtl") */}
            {step === 0 && (
              <div className="space-y-3.5 animate-in fade-in-0 duration-300 fill-mode-both">
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

            {/* Step 1: Student & Phone Info (studentNumber and phoneNumber: dir="ltr") */}
            {step === 1 && (
              <div className="space-y-3.5 animate-in fade-in-0 duration-300 fill-mode-both">
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
              </div>
            )}

            {/* Step 2: Verification Code (verificationCode: dir="ltr") */}
            {step === 2 && (
              <div className="space-y-3.5 animate-in fade-in-0 duration-300 fill-mode-both">
                <div className="text-center">
                  <p className="text-xs font-semibold text-gray-700">کد ۶ رقمی ارسال‌شده به شماره زیر را وارد کنید:</p>
                  <p className="mt-1 text-sm text-[#F97316] font-mono font-bold" dir="ltr">
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
                      className="p-0 h-auto text-xs text-[#F97316] font-bold"
                    >
                      ارسال مجدد کد تأیید
                    </Button>
                  ) : (
                    <span>ارسال مجدد کد پس از {formatTimer(resendTimer)}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-gray-500 hover:text-[#F97316] transition-colors cursor-pointer"
                  >
                    ویرایش شماره
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Passwords (password and confirmPassword: dir="ltr") */}
            {step === 3 && (
              <div className="space-y-3.5 animate-in fade-in-0 duration-300 fill-mode-both">
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
              </div>
            )}

            {/* Back to Login link */}
            <div className="pt-2 text-center text-xs sm:text-sm">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-1.5 text-gray-600 hover:text-[#F97316] font-medium transition-colors"
              >
                <span>حساب کاربری دارید؟ بازگشت به صفحه ورود</span>
                <ArrowLeft className="size-3.5" />
              </Link>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <Button
                type="button"
                disabled={isVerifying}
                onClick={handlePrimaryClick}
                className="h-12 sm:h-12.5 w-full rounded-2xl bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isVerifying ? "در حال بررسی..." : submitLabel}
                {!isVerifying &&
                  (step === 1 ? (
                    <Send className="size-4 shrink-0" />
                  ) : (
                    <ArrowLeft className="size-4 shrink-0" />
                  ))}
              </Button>

              {step > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isVerifying}
                  className="mt-2 h-10 w-full rounded-xl text-gray-500 hover:text-gray-800 text-xs cursor-pointer"
                  onClick={() => {
                    setStep((s) => s - 1)
                    setCodeError(false)
                  }}
                >
                  <ArrowRight className="size-3.5 ml-1" />
                  مرحله قبل
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
