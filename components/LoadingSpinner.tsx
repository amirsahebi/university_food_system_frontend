'use client'

import Image from 'next/image'

interface LoadingSpinnerProps {
  text?: string
}

export const LoadingSpinner = ({ text = "در حال بارگذاری..." }: LoadingSpinnerProps) => {
  return (
    <div
      dir="rtl"
      className="relative flex min-h-screen flex-col items-center justify-center bg-white font-sans selection:bg-orange-500/20"
      style={{ fontFamily: "'Vazirmatn', 'Segoe UI', system-ui, sans-serif" }}
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="relative size-20 animate-pulse">
          <Image
            src="/images/javanfoods_logo.png"
            alt="رستوران جوان"
            fill
            className="object-contain filter drop-shadow-md"
            priority
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-xl font-bold text-gray-800">رستوران جوان</h1>
          <div className="h-1.5 w-36 overflow-hidden rounded-full bg-orange-100">
            <div className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-orange-400 to-orange-600" />
          </div>
          <p className="text-xs text-muted-foreground animate-pulse">{text}</p>
        </div>
      </div>
    </div>
  )
}

export default LoadingSpinner
