"use client"

import { useRef, type ChangeEvent, type KeyboardEvent, type ClipboardEvent } from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { toEnglishDigits } from "@/lib/formatters"

interface VerificationCodeProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: boolean
}

export function VerificationCode({
  value,
  onChange,
  disabled = false,
  error = false,
}: VerificationCodeProps) {
  const length = 6
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const digits = value
    .split("")
    .slice(0, length)
    .concat(Array(length).fill(""))
    .slice(0, length)

  const focusInput = (index: number) => {
    if (index >= 0 && index < length && inputs.current[index]) {
      inputs.current[index]?.focus()
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const rawVal = toEnglishDigits(e.target.value).replace(/\D/g, "")
    if (!rawVal) return

    if (rawVal.length > 1) {
      // Multiple digits pasted or typed
      const pastedChars = rawVal.slice(0, length - index).split("")
      const newDigits = [...digits]
      pastedChars.forEach((ch, i) => {
        if (index + i < length) {
          newDigits[index + i] = ch
        }
      })
      const nextVal = newDigits.join("").slice(0, length)
      onChange(nextVal)
      focusInput(Math.min(index + pastedChars.length, length - 1))
    } else {
      const newDigits = [...digits]
      newDigits[index] = rawVal
      const nextVal = newDigits.join("").slice(0, length)
      onChange(nextVal)
      if (index < length - 1) {
        focusInput(index + 1)
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits]
        newDigits[index - 1] = ""
        onChange(newDigits.join(""))
        focusInput(index - 1)
      } else {
        const newDigits = [...digits]
        newDigits[index] = ""
        onChange(newDigits.join(""))
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault()
      focusInput(index - 1)
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault()
      focusInput(index + 1)
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault()
    const pasted = toEnglishDigits(e.clipboardData.getData("text/plain")).replace(/\D/g, "")
    if (!pasted) return

    const chars = pasted.slice(0, length).split("")
    const newDigits = Array(length).fill("")
    chars.forEach((ch, i) => {
      newDigits[i] = ch
    })
    const nextVal = newDigits.join("")
    onChange(nextVal)
    focusInput(Math.min(chars.length, length - 1))
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="code-0" className="text-sm font-semibold text-foreground/80">
        کد تأیید
      </Label>
      <div dir="ltr" className="grid grid-cols-6 gap-2 sm:gap-3">
        {Array.from({ length }, (_, i) => (
          <input
            key={i}
            id={`code-${i}`}
            ref={(el) => {
              inputs.current[i] = el
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={1}
            disabled={disabled}
            value={digits[i] || ""}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={(e) => handlePaste(e, i)}
            className={cn(
              "h-14 sm:h-16 w-full rounded-2xl border border-white/70 bg-white/65 text-2xl font-bold text-center text-primary-deep shadow-xs transition-colors focus:bg-white/90 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 focus:outline-none",
              error && "border-red-500 text-red-500 animate-shake"
            )}
            aria-label={`رقم ${i + 1} کد تأیید`}
          />
        ))}
      </div>
    </div>
  )
}
