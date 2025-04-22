"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { toast, Toaster } from "react-hot-toast"
import {
  ChevronRight,
  ChevronLeft,
  User,
  Hash,
  Phone,
  Lock,
  GraduationCap,
  Send,
  Check,
  AlertCircle,
  CheckCircle2,
  UserRound,
  School,
  ShieldCheck,
  KeyRound,
} from "lucide-react"
import api from "@/lib/axios"
import { API_ROUTES, createApiUrl } from "@/lib/api"
import OTPInput from "@/components/otp-input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  studentName: string
}

const SuccessModal = ({ isOpen, onClose, studentName }: SuccessModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 15 }}
            className="bg-white/90 backdrop-blur-md rounded-3xl p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="relative h-16 w-16">
                  <Image
                    src="/images/javanfoods_logo.png"
                    alt="رستوران جوان"
                    fill
                    className="object-contain drop-shadow-md"
                    priority
                  />
                </div>
              </div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5, times: [0, 0.8, 1] }}
                className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4"
              >
                <motion.div
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </motion.div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-[#f97316] mb-2"
              >
                ثبت نام با موفقیت انجام شد!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 mb-6"
                dir="rtl"
              >
                {studentName} عزیز، حساب کاربری شما با موفقیت ایجاد شد. در حال انتقال به صفحه ورود...
              </motion.p>

              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.5, duration: 3 }}
                className="h-1 bg-[#f97316] rounded-full mb-6"
              />

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <Button onClick={onClose} className="bg-[#f97316] hover:bg-orange-600">
                  ورود به حساب کاربری
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const convertToEnglishNumbers = (input: string): string => {
  const persianNumbers = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"]
  let result = input

  for (let i = 0; i < 10; i++) {
    const persianRegex = new RegExp(persianNumbers[i], "g")
    result = result.replace(persianRegex, i.toString())
  }

  return result
}

const convertToPersianNumbers = (input: string): string => {
  const persianNumbers = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"]
  let result = input

  for (let i = 0; i < 10; i++) {
    const englishRegex = new RegExp(i.toString(), "g")
    result = result.replace(englishRegex, persianNumbers[i])
  }

  return result
}

const signUpSchema = z
  .object({
    firstName: z.string().min(2, { message: "نام باید حداقل 2 حرف باشد" }),
    lastName: z.string().min(2, { message: "نام خانوادگی باید حداقل 2 حرف باشد" }),
    studentNumber: z.string().regex(/^\d{7,12}$/, { message: "شماره دانشجویی باید بین 7 تا 10 رقم باشد" }),
    phoneNumber: z.string().regex(/^09\d{9}$/, { message: "شماره تلفن باید 11 رقم و با 09 شروع شود" }),
    verificationCode: z.string(),
    password: z.string().min(8, { message: "رمز عبور باید حداقل 8 کاراکتر باشد" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "رمزهای عبور مطابقت ندارند",
    path: ["confirmPassword"],
  })

type SignUpForm = z.infer<typeof signUpSchema>

const steps = [
  { icon: <UserRound size={18} />, text: "اطلاعات شخصی" },
  { icon: <School size={18} />, text: "اطلاعات دانشجویی" },
  { icon: <ShieldCheck size={18} />, text: "تایید شماره تلفن" },
  { icon: <KeyRound size={18} />, text: "رمز عبور" },
]

export default function SignUp() {
  const [step, setStep] = useState(0)
  const [isVerifying, setIsVerifying] = useState(false)
  const [canResend, setCanResend] = useState(false)
  const [resendTimer, setResendTimer] = useState(300) // 5 minutes in seconds
  const [isCodeVerified, setIsCodeVerified] = useState(false)
  const [isCodeError, setIsCodeError] = useState(false)
  const [displayPhoneNumber, setDisplayPhoneNumber] = useState("")
  const [displayStudentNumber, setDisplayStudentNumber] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
    resetField,
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
  })
  const router = useRouter()

  const onSubmit = async (data: SignUpForm) => {
    try {
      await api.post(createApiUrl(API_ROUTES.SIGNUP), {
        first_name: data.firstName,
        last_name: data.lastName,
        phone_number: data.phoneNumber,
        password: data.password,
        role: "student",
        verification_code: data.verificationCode,
        student_number: data.studentNumber,
      })

      // Show success modal instead of toast
      setShowSuccessModal(true)

      // Set a timer to redirect to login page after 4 seconds
      redirectTimerRef.current = setTimeout(() => {
        router.push("/")
      }, 4000)
    } catch (error) {
      console.error(error)
      toast.error("خطا در ثبت نام. لطفا دوباره تلاش کنید.")
    }
  }

  const password = watch("password", "")
  const phoneNumber = watch("phoneNumber", "")

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return 0
    if (password.length < 4) return 25
    if (password.length < 8) return 50
    if (password.length < 12) return 75
    return 100
  }

  const passwordStrength = getPasswordStrength(password)

  useEffect(() => {
    if (resendTimer > 0 && !canResend && step === 2) {
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

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "phoneNumber" && value.phoneNumber) {
        setDisplayPhoneNumber(convertToPersianNumbers(value.phoneNumber))
      }
      if (name === "studentNumber" && value.studentNumber) {
        setDisplayStudentNumber(convertToPersianNumbers(value.studentNumber))
      }
    })

    // Initialize values
    const currentPhoneNumber = watch("phoneNumber")
    if (currentPhoneNumber) {
      setDisplayPhoneNumber(convertToPersianNumbers(currentPhoneNumber))
    }

    const currentStudentNumber = watch("studentNumber")
    if (currentStudentNumber) {
      setDisplayStudentNumber(convertToPersianNumbers(currentStudentNumber))
    }

    return () => subscription.unsubscribe()
  }, [watch])

  // Clear validation error when step changes
  useEffect(() => {
    setValidationError(null)
    setIsCodeError(false)
    setIsCodeVerified(false)
  }, [step])

  const validateCurrentStep = async () => {
    setValidationError(null)

    // Define which fields to validate based on current step
    let fieldsToValidate: (keyof SignUpForm)[] = []

    switch (step) {
      case 0:
        fieldsToValidate = ["firstName", "lastName"]
        break
      case 1:
        fieldsToValidate = ["studentNumber", "phoneNumber"]
        break
      case 2:
        if (!isCodeVerified) {
          setValidationError("لطفا کد تایید را وارد کنید")
          return false
        }
        break
      case 3:
        fieldsToValidate = ["password", "confirmPassword"]
        break
    }

    // Trigger validation for the specified fields
    const isValid = await trigger(fieldsToValidate)

    if (!isValid) {
      setValidationError("لطفا تمام فیلدها را به درستی پر کنید")
    }

    return isValid
  }

  const goToNextStep = async () => {
    const isValid = await validateCurrentStep()
    if (isValid) {
      setStep(step + 1)
    }
  }

  const sendVerificationCode = async () => {
    const isValid = await validateCurrentStep()
    if (!isValid) return

    try {
      const studentNumber = watch("studentNumber")

      // First check if student number exists
      const studentCheckResponse = await api.post(createApiUrl(API_ROUTES.CHECK_STUDENT_NUMBER_EXISTS), {
        student_number: studentNumber,
      })

      if (studentCheckResponse.data.exists) {
        toast.error("این شماره دانشجویی قبلاً ثبت شده است")
        setValidationError("این شماره دانشجویی قبلاً ثبت شده است")
        return
      }

      const phoneNumber = watch("phoneNumber")
      setIsVerifying(true)
      // First check if phone number exists
      const checkResponse = await api.post(createApiUrl(API_ROUTES.CHECK_PHONE_EXISTS), {
        phone_number: phoneNumber,
      })

      if (checkResponse.data.exists) {
        toast.error("این شماره تلفن قبلاً ثبت شده است")
        setIsVerifying(false)
        return
      }

      // If phone doesn't exist, send verification code
      await api.post(createApiUrl(API_ROUTES.SEND_VERIFICATION_CODE), { phone_number: phoneNumber })
      toast.success("کد تایید ارسال شد")
      setStep(2)
      setResendTimer(300) // Reset timer to 5 minutes
      setCanResend(false)
      setIsCodeVerified(false)
      setIsCodeError(false)
      resetField("verificationCode")
      setDisplayPhoneNumber(convertToPersianNumbers(phoneNumber)) // Update displayed phone number
    } catch (error) {
      console.error("Error sending verification code:", error)
      toast.error("خطا در ارسال کد تایید")
    } finally {
      setIsVerifying(false)
    }
  }

  const verifyCode = async (code: string) => {
    if (code.length !== 6) {
      return
    }

    setIsVerifying(true)
    try {
      const response = await api.post(createApiUrl(API_ROUTES.VERIFY_CODE), {
        phone_number: phoneNumber,
        code: code,
      })

      if (response.data.verified) {
        setIsCodeVerified(true)
        setIsCodeError(false)
        setValidationError(null)
        // Automatically proceed to next step after a short delay
        setTimeout(() => {
          setStep(3)
        }, 500)
      } else {
        setIsCodeVerified(false)
        setIsCodeError(true)
        // Clear the code after a short delay
        setTimeout(() => {
          resetField("verificationCode")
        }, 600)
      }
    } catch (error) {
      console.error("Error verifying code:", error)
      setIsCodeVerified(false)
      setIsCodeError(true)
      // Clear the code after a short delay
      setTimeout(() => {
        resetField("verificationCode")
      }, 600)
    } finally {
      setIsVerifying(false)
    }
  }

  const resendVerificationCode = async () => {
    if (!canResend) return

    const phoneNumber = watch("phoneNumber")
    try {
      await api.post(createApiUrl(API_ROUTES.SEND_VERIFICATION_CODE), { phone_number: phoneNumber })
      toast.success("کد تایید مجدداً ارسال شد")
      setResendTimer(300) // Reset timer to 5 minutes
      setCanResend(false)
      setIsCodeVerified(false)
      setIsCodeError(false)
      resetField("verificationCode")
    } catch (error) {
      console.error(error)
      toast.error("خطا در ارسال مجدد کد تایید")
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }

  const handleOtpComplete = (otp: string) => {
    verifyCode(otp)
  }

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current)
      }
    }
  }, [])

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-pattern bg-pattern-animate"
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
          <p className="text-gray-500 text-sm" style={{ animationDelay: "0.3s" }}>
            ثبت نام دانشجو
          </p>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              {steps.map((stepItem, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full mb-1 transition-colors ${
                      index === step
                        ? "bg-orange-100 text-[#f97316]"
                        : index < step
                          ? "bg-green-100 text-green-500"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {index < step ? <Check size={18} /> : stepItem.icon}
                  </div>
                  <span
                    className={`text-xs hidden md:block ${
                      index === step ? "text-[#f97316] font-bold" : index < step ? "text-green-500" : "text-gray-400"
                    }`}
                  >
                    {stepItem.text}
                  </span>
                </div>
              ))}
            </div>
            <Progress
              value={(step + 1) * (100 / steps.length)}
              className="h-2 bg-orange-100"
              indicatorClassName="bg-[#f97316]"
            />
          </div>

          {validationError && (
            <Alert variant="destructive" className="mb-4 animate-shake">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                {step === 0 && (
                  <div className="space-y-4" dir="rtl">
                    <div>
                      <Label htmlFor="firstName">نام</Label>
                      <div className="relative mt-1">
                        <Input
                          id="firstName"
                          {...register("firstName")}
                          className={`pr-10 form-input-focus ${errors.firstName ? "border-red-500 focus:border-red-500" : ""}`}
                        />
                        <User
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-400"
                          size={18}
                        />
                      </div>
                      {errors.firstName && (
                        <p className="text-red-500 text-sm mt-1 animate-shake">{errors.firstName.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName">نام خانوادگی</Label>
                      <div className="relative mt-1">
                        <Input
                          id="lastName"
                          {...register("lastName")}
                          className={`pr-10 form-input-focus ${errors.lastName ? "border-red-500 focus:border-red-500" : ""}`}
                        />
                        <User
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-400"
                          size={18}
                        />
                      </div>
                      {errors.lastName && (
                        <p className="text-red-500 text-sm mt-1 animate-shake">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>
                )}
                {step === 1 && (
                  <div className="space-y-4" dir="rtl">
                    <div>
                      <Label htmlFor="studentNumber">شماره دانشجویی</Label>
                      <div className="relative mt-1">
                        <Input
                          id="studentNumber"
                          value={displayStudentNumber}
                          onChange={(e) => {
                            const englishValue = convertToEnglishNumbers(e.target.value)
                            setValue("studentNumber", englishValue)
                            setDisplayStudentNumber(convertToPersianNumbers(englishValue))
                          }}
                          className={`pr-10 form-input-focus ${errors.studentNumber ? "border-red-500 focus:border-red-500" : ""}`}
                        />
                        <Hash
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-400"
                          size={18}
                        />
                      </div>
                      {errors.studentNumber && (
                        <p className="text-red-500 text-sm mt-1 animate-shake">{errors.studentNumber.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="phoneNumber">شماره تلفن</Label>
                      <div className="relative mt-1">
                        <Input
                          id="phoneNumber"
                          value={displayPhoneNumber}
                          onChange={(e) => {
                            const englishValue = convertToEnglishNumbers(e.target.value)
                            setValue("phoneNumber", englishValue)
                            setDisplayPhoneNumber(convertToPersianNumbers(englishValue))
                          }}
                          className={`pr-10 form-input-focus ${errors.phoneNumber ? "border-red-500 focus:border-red-500" : ""}`}
                        />
                        <Phone
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-400"
                          size={18}
                        />
                      </div>
                      {errors.phoneNumber && (
                        <p className="text-red-500 text-sm mt-1 animate-shake">{errors.phoneNumber.message}</p>
                      )}
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-4" dir="rtl">
                    <Card className="w-full rounded-xl shadow-md bg-white/70 backdrop-blur-md">
                      <CardHeader>
                        <CardTitle className="text-xl text-center">کد تایید</CardTitle>
                        <CardDescription className="text-center">
                          کد تایید 6 رقمی را که به شماره {convertToPersianNumbers(phoneNumber)} ارسال شده است وارد کنید.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6 flex flex-col items-center">
                        <OTPInput
                          length={6}
                          value={watch("verificationCode") || ""}
                          onChange={(value) => {
                            // Convert any Persian digits to English first
                            const englishValue = convertToEnglishNumbers(value)
                            // Only update if the value is different to prevent infinite loops
                            const currentValue = watch("verificationCode") || ""
                            if (currentValue !== englishValue) {
                              setValue("verificationCode", englishValue)
                            }
                          }}
                          onComplete={handleOtpComplete}
                          isError={isCodeError}
                          isSuccess={isCodeVerified}
                          disabled={isVerifying}
                        />
                        {isCodeVerified && (
                          <p className="text-green-500 text-sm flex items-center justify-center">
                            <Check className="mr-1 h-4 w-4" /> کد تایید شد
                          </p>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <div className="flex items-center">
                          {!canResend ? (
                            <span className="text-sm text-gray-500">
                              زمان باقی‌مانده: {convertToPersianNumbers(formatTime(resendTimer))}
                            </span>
                          ) : (
                            <Button
                              type="button"
                              onClick={resendVerificationCode}
                              variant="link"
                              className="text-[#f97316] p-0"
                            >
                              ارسال مجدد کد
                            </Button>
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  </div>
                )}
                {step === 3 && (
                  <div className="space-y-4" dir="rtl">
                    <div>
                      <Label htmlFor="password">رمز عبور</Label>
                      <div className="relative mt-1">
                        <Input
                          id="password"
                          type="password"
                          {...register("password")}
                          className={`pr-10 form-input-focus ${errors.password ? "border-red-500 focus:border-red-500" : ""}`}
                        />
                        <Lock
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-400"
                          size={18}
                        />
                      </div>
                      {errors.password && (
                        <p className="text-red-500 text-sm mt-1 animate-shake">{errors.password.message}</p>
                      )}
                      <Progress
                        value={passwordStrength}
                        className="h-2 mt-2 bg-orange-100"
                        indicatorClassName={`${
                          passwordStrength <= 25
                            ? "bg-red-500"
                            : passwordStrength <= 50
                              ? "bg-yellow-500"
                              : passwordStrength <= 75
                                ? "bg-blue-500"
                                : "bg-green-500"
                        }`}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        قدرت رمز عبور:{" "}
                        {passwordStrength === 100
                          ? "عالی"
                          : passwordStrength >= 75
                            ? "خوب"
                            : passwordStrength >= 50
                              ? "متوسط"
                              : "ضعیف"}
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">تکرار رمز عبور</Label>
                      <div className="relative mt-1">
                        <Input
                          id="confirmPassword"
                          type="password"
                          {...register("confirmPassword")}
                          className={`pr-10 form-input-focus ${errors.confirmPassword ? "border-red-500 focus:border-red-500" : ""}`}
                        />
                        <Lock
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-400"
                          size={18}
                        />
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1 animate-shake">{errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            <div className="mt-6 flex justify-between items-center">
              {step === 0 ? (
                <Button
                  type="button"
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="btn-hover-effect"
                >
                  بازگشت به صفحه ورود
                </Button>
              ) : step > 0 && (
                <Button type="button" onClick={() => setStep(step - 1)} variant="outline" className="btn-hover-effect">
                  <ChevronLeft className="mr-2 h-4 w-4" /> قبلی
                </Button>
              )}
              {step < steps.length - 1 ? (
                step === 1 ? (
                  <Button
                    type="button"
                    onClick={sendVerificationCode}
                    className="ml-auto bg-[#f97316] hover:bg-orange-600 btn-hover-effect"
                    disabled={isVerifying}
                  >
                    <Send className="mr-2 h-4 w-4" /> {isVerifying ? "در حال ارسال..." : "ارسال کد تایید"}
                  </Button>
                ) : step === 2 ? (
                  <Button
                    type="button"
                    onClick={goToNextStep}
                    className="ml-auto bg-[#f97316] hover:bg-orange-600 btn-hover-effect"
                    disabled={!isCodeVerified}
                  >
                    بعدی <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={goToNextStep}
                    className="ml-auto bg-[#f97316] hover:bg-orange-600 btn-hover-effect"
                  >
                    بعدی <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )
              ) : (
                <Button
                  type="submit"
                  className="ml-auto bg-[#f97316] hover:bg-orange-600 btn-hover-effect"
                  onClick={async (e) => {
                    const isValid = await validateCurrentStep()
                    if (!isValid) {
                      e.preventDefault()
                    }
                  }}
                >
                  ثبت نام <GraduationCap className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          router.push("/")
        }}
        studentName={`${watch("firstName")} ${watch("lastName")}`}
      />
    </div>
  )
}
