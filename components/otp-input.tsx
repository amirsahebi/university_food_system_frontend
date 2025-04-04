"use client"

import { useState, useRef, useEffect, type KeyboardEvent, type ClipboardEvent, type ChangeEvent } from "react"
import { cn } from "@/lib/utils"

interface OTPInputProps {
  length?: number
  onComplete?: (otp: string) => void
  autoFocus?: boolean
  disabled?: boolean
  value?: string
  onChange?: (value: string) => void
  inputClassName?: string
  containerClassName?: string
  isError?: boolean
  isSuccess?: boolean
  onClear?: () => void
}

const OTPInput = ({
  length = 6,
  onComplete,
  autoFocus = true,
  disabled = false,
  value = "",
  onChange,
  inputClassName,
  containerClassName,
  isError = false,
  isSuccess = false,
  onClear,
}: OTPInputProps) => {
  const [otp, setOtp] = useState<string[]>(
    value.split("").slice(0, length).concat(Array(length).fill("")).slice(0, length),
  )
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length)
  }, [length])

  // Handle external value changes
  useEffect(() => {
    if (value) {
      const valueArray = value.split("").slice(0, length).concat(Array(length).fill("")).slice(0, length)
      setOtp(valueArray)
    } else {
      setOtp(Array(length).fill(""))
    }
  }, [value, length])

  // Auto-focus first input on mount
  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus, disabled])

  // Notify when OTP is complete
  useEffect(() => {
    const otpValue = otp.join("")

    // Only call onChange if the value actually changed
    if (onChange && otpValue !== value) {
      onChange(otpValue)
    }

    if (otpValue.length === length && onComplete) {
      onComplete(otpValue)
    }
  }, [otp, length, onComplete, onChange, value])

  const focusInput = (index: number) => {
    if (inputRefs.current[index]) {
      inputRefs.current[index]?.focus()
    }
  }

  const clearOtp = () => {
    setOtp(Array(length).fill(""))
    if (onClear) {
      onClear()
    }
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value

    // Only accept numeric input
    if (!/^\d*$/.test(value)) {
      return
    }

    // Handle pasting multiple digits
    if (value.length > 1) {
      const valueArray = value.split("").slice(0, length - index)
      const newOtp = [...otp]

      valueArray.forEach((val, i) => {
        if (index + i < length) {
          newOtp[index + i] = val
        }
      })

      setOtp(newOtp)

      // Focus the next empty input or the last input
      const nextIndex = Math.min(index + valueArray.length, length - 1)
      focusInput(nextIndex)
    } else {
      // Handle single digit input
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)

      // Auto-focus next input
      if (value && index < length - 1) {
        focusInput(index + 1)
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    // Handle backspace
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // If current input is empty, focus previous input
        const newOtp = [...otp]
        newOtp[index - 1] = ""
        setOtp(newOtp)
        focusInput(index - 1)
      } else {
        // Clear current input
        const newOtp = [...otp]
        newOtp[index] = ""
        setOtp(newOtp)
      }
    }
    // Handle arrow keys
    else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault()
      focusInput(index - 1)
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault()
      focusInput(index + 1)
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text/plain").trim()

    // Only accept numeric input
    if (!/^\d*$/.test(pastedData)) {
      return
    }

    const pastedArray = pastedData.split("").slice(0, length - index)
    const newOtp = [...otp]

    pastedArray.forEach((val, i) => {
      if (index + i < length) {
        newOtp[index + i] = val
      }
    })

    setOtp(newOtp)

    // Focus the next empty input or the last input
    const nextIndex = Math.min(index + pastedArray.length, length - 1)
    focusInput(nextIndex)
  }

  return (
    <div
      className={cn("flex items-center justify-center gap-1 sm:gap-2", containerClassName)}
      role="group"
      aria-label="One-time password input"
      dir="ltr"
    >
      {Array.from({ length }, (_, index) => (
        <div key={index} className="relative">
          <input
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            value={otp[index] || ""}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={(e) => handlePaste(e, index)}
            disabled={disabled}
            className={cn(
              "w-8 h-10 sm:w-9 sm:h-11 md:w-10 md:h-12 text-center text-base md:text-lg font-semibold rounded-lg border-2 transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-offset-1",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isError
                ? "border-red-500 focus:border-red-500 focus:ring-red-500 animate-shake"
                : isSuccess
                  ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
              inputClassName,
            )}
            aria-label={`Digit ${index + 1} of one-time password`}
            aria-invalid={isError}
          />
        </div>
      ))}
    </div>
  )
}

export default OTPInput

