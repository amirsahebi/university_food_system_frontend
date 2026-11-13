"use client"

import { useState } from "react"
import { Eye, EyeOff, LucideIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const strength = (value: string) =>
  Math.min(
    3,
    (/[a-z]/.test(value) ? 1 : 0) +
      (/[A-Z0-9]/.test(value) ? 1 : 0) +
      (value.length >= 8 ? 1 : 0)
  )
const strengthLabel = ["", "ضعیف", "متوسط", "قوی"]

export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  icon: LucideIcon
  showStrength?: boolean
  error?: string
}

export function Field({
  id,
  label,
  icon: Icon,
  type = "text",
  className,
  showStrength = false,
  error,
  dir,
  ...props
}: FieldProps) {
  const [shown, setShown] = useState(false)
  const isPassword = type === "password"
  const inputType = isPassword ? (shown ? "text" : "password") : type
  const isLtr = dir === "ltr"

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs sm:text-sm font-bold text-gray-800 text-right">
          {label}
        </Label>
        {error && <span className="text-xs text-red-500 font-medium animate-shake">{error}</span>}
      </div>
      <div className="relative">
        <Icon className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-orange-500" />
        <Input
          id={id}
          type={inputType}
          dir={dir}
          onInvalid={(e) => e.preventDefault()}
          {...props}
          className={cn(
            "h-12 rounded-2xl border border-orange-200/90 bg-white/80 pr-11 text-sm font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal shadow-xs transition-all focus-visible:bg-white focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-500/25",
            isPassword ? "pl-12" : "pl-4",
            isLtr && "text-left font-sans tracking-wide",
            error && "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/20",
            className
          )}
        />
        {isPassword && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={shown ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
            aria-pressed={shown}
            className="absolute left-2 top-1/2 size-9 -translate-y-1/2 rounded-xl text-gray-400 hover:text-orange-600 hover:bg-orange-50/80 transition-colors"
            onClick={() => setShown((v) => !v)}
          >
            {shown ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
          </Button>
        )}
      </div>
      {showStrength && isPassword && props.value && (
        <div className="flex items-center gap-3 pt-1">
          <div className="flex h-1.5 flex-1 gap-1.5">
            {[1, 2, 3].map((index) => (
              <span
                key={index}
                className={cn(
                  "flex-1 rounded-full transition-colors",
                  index <= strength(String(props.value)) ? "bg-orange-500" : "bg-neutral-200"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {strengthLabel[strength(String(props.value))]}
          </span>
        </div>
      )}
    </div>
  )
}
