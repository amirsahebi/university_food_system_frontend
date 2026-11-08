"use client"

import React, { useState, useEffect, useMemo } from "react"
import Image, { ImageProps } from "next/image"
import { cn } from "@/lib/utils"

export interface FoodImageProps extends Omit<ImageProps, "src"> {
  src?: string | null
  alt: string
  fallbackSrc?: string
  containerClassName?: string
}

function normalizeFoodImageUrl(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null
  const trimmed = url.trim()
  if (!trimmed) return null

  // 1. If URL contains /media/, extract the relative path
  // e.g. "http://javan-foods.ir/media/foods/xyz.jpg" -> "/media/foods/xyz.jpg"
  // e.g. "http://localhost:8000/media/foods/xyz.jpg" -> "/media/foods/xyz.jpg"
  // This turns any absolute backend URL into a safe same-origin path, completely
  // bypassing next/image remotePatterns requirements and preventing Mixed-Content blocking.
  const mediaIdx = trimmed.indexOf("/media/")
  if (mediaIdx !== -1) {
    return trimmed.substring(mediaIdx)
  }

  // 2. If it's an insecure HTTP URL on HTTPS, upgrade protocol
  if (trimmed.startsWith("http://")) {
    return trimmed.replace(/^http:\/\//, "https://")
  }

  return trimmed
}

export const FoodImage: React.FC<FoodImageProps> = ({
  src,
  alt,
  fallbackSrc = "/placeholder.svg",
  className,
  containerClassName,
  fill = true,
  sizes = "(max-width: 768px) 100vw, 200px",
  unoptimized = true,
  ...props
}) => {
  const [hasError, setHasError] = useState(false)

  // Reset error state when src changes
  useEffect(() => {
    setHasError(false)
  }, [src])

  const normalized = useMemo(() => normalizeFoodImageUrl(src), [src])
  const imageSource = !hasError && normalized ? normalized : fallbackSrc

  return (
    <div className={cn("relative w-full h-full overflow-hidden flex items-center justify-center bg-orange-50/50", containerClassName)}>
      <Image
        loading="lazy"
        decoding="async"
        {...props}
        src={imageSource}
        alt={alt}
        fill={fill}
        sizes={sizes}
        unoptimized={unoptimized}
        className={cn("object-cover transition-opacity duration-200", className)}
        onError={() => setHasError(true)}
      />
    </div>
  )
}

export default FoodImage
