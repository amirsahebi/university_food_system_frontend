"use client"

import React, { useState, useEffect } from "react"
import Image, { ImageProps } from "next/image"
import { cn } from "@/lib/utils"

export interface FoodImageProps extends Omit<ImageProps, "src"> {
  src?: string | null
  alt: string
  fallbackSrc?: string
  containerClassName?: string
}

export const FoodImage: React.FC<FoodImageProps> = ({
  src,
  alt,
  fallbackSrc = "/placeholder.svg",
  className,
  containerClassName,
  fill = true,
  sizes = "(max-width: 768px) 100vw, 200px",
  ...props
}) => {
  const [hasError, setHasError] = useState(false)

  // Reset error state when src changes
  useEffect(() => {
    setHasError(false)
  }, [src])

  const imageSource = !hasError && src && src.trim() !== "" ? src : fallbackSrc

  return (
    <div className={cn("relative w-full h-full overflow-hidden flex items-center justify-center bg-orange-50/50", containerClassName)}>
      <Image
        {...props}
        src={imageSource}
        alt={alt}
        fill={fill}
        sizes={sizes}
        className={cn("object-cover transition-opacity duration-200", className)}
        onError={() => setHasError(true)}
      />
    </div>
  )
}

export default FoodImage
