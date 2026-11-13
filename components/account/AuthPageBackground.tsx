"use client"

import React, { memo } from "react"

interface AuthPageBackgroundProps {
  variant?: "login" | "forgot" | "signup"
}

// Crisp Vector Leaf with gradient and central vein
function Leaf({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`pointer-events-none select-none ${className || ""}`} style={style}>
      <svg viewBox="0 0 44 44" className="w-full h-full drop-shadow-xs" fill="none">
        <defs>
          <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="50%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>
        </defs>
        {/* Organic leaf body */}
        <path
          d="M8 36 C8 20, 20 8, 36 8 C36 24, 24 36, 8 36 Z"
          fill="url(#leafGradient)"
        />
        {/* Leaf central vein */}
        <path
          d="M9 35 C18 26, 26 18, 35 9"
          stroke="#166534"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.5"
        />
        {/* Subtle side veins */}
        <path
          d="M17 27 C22 26, 26 23, 28 20"
          stroke="#166534"
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0.3"
        />
        <path
          d="M21 23 C25 21, 28 17, 30 14"
          stroke="#166534"
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0.3"
        />
      </svg>
    </div>
  )
}

// 4x5 Dot Matrix Grid
function DotGrid({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`pointer-events-none select-none ${className || ""}`} style={style}>
      <svg width="44" height="56" viewBox="0 0 44 56" fill="none">
        {[0, 1, 2, 3, 4].map((row) =>
          [0, 1, 2, 3].map((col) => (
            <circle
              key={`${row}-${col}`}
              cx={col * 12 + 4}
              cy={row * 12 + 4}
              r="2"
              fill="#FDBA74"
              opacity="0.65"
            />
          ))
        )}
      </svg>
    </div>
  )
}

// Food & Academic Line Art Doodles
function ChefHatDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 38h24v-6H12v6z" />
      <path d="M12 32c-3-2-4-7-1-11 0-1 1-3 3-4 1-6 8-10 14-7 4-3 10-1 12 3 3 2 4 6 2 9 3 4 1 9-2 10" />
      <path d="M18 38v-6M24 38v-6M30 38v-6" />
    </svg>
  )
}

function ClocheDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 36h32" />
      <path d="M12 36c0-11 4.5-18 12-18s12 7 12 18" />
      <circle cx="24" cy="15" r="2.5" />
      <path d="M6 39h36" strokeWidth="1.5" />
    </svg>
  )
}

function CutleryDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Spoon */}
      <ellipse cx="32" cy="15" rx="5" ry="7" />
      <path d="M32 22v18" />
      {/* Fork */}
      <path d="M14 12v9c0 3 3 4 5 4v15" />
      <path d="M19 12v9" />
      <path d="M24 12v9c0 3-3 4-5 4" />
    </svg>
  )
}

function GraduationCapDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 10l18 8-18 8-18-8 18-8z" />
      <path d="M12 21.5v9c0 5 6 8.5 12 8.5s12-3.5 12-8.5v-9" />
      <path d="M39 21v14" />
      <circle cx="39" cy="36" r="1.5" fill="#F59E0B" />
    </svg>
  )
}

function BookDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 54 44" className={className} fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M27 12c-5-4-13-4-23-1v26c10-3 18-3 23 1 5-4 13-4 23-1V11c-10-3-18-3-23 1z" />
      <path d="M27 12v26" />
      <path d="M9 19c6-2 11-2 15 0M9 25c6-2 11-2 15 0M9 31c6-2 11-2 15 0" strokeWidth="1.2" opacity="0.6" />
      <path d="M45 19c-6-2-11-2-15 0M45 25c-6-2-11-2-15 0M45 31c-6-2-11-2-15 0" strokeWidth="1.2" opacity="0.6" />
    </svg>
  )
}

function WheatSprigDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 48" className={className} fill="none" stroke="#F59E0B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 42V8" />
      <path d="M20 12c-4-4-9-2-9 2 0 4 5 5 9 3" />
      <path d="M20 12c4-4 9-2 9 2 0 4-5 5-9 3" />
      <path d="M20 20c-4-4-9-2-9 2 0 4 5 5 9 3" />
      <path d="M20 20c4-4 9-2 9 2 0 4-5 5-9 3" />
      <path d="M20 28c-4-4-9-2-9 2 0 4 5 5 9 3" />
      <path d="M20 28c4-4 9-2 9 2 0 4-5 5-9 3" />
    </svg>
  )
}

export const AuthPageBackground = memo(function AuthPageBackground({
  variant = "login",
}: AuthPageBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none bg-[#FAF5F0]"
      style={{ contain: "strict" }}
    >
      {/* 1. TOP FLUID WAVES - Compact graceful curve matching the mockup */}
      <div className="absolute top-0 inset-x-0 h-24 sm:h-32 overflow-hidden">
        <svg
          viewBox="0 0 1440 140"
          className="w-full h-full object-cover"
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            {/* Deep rich top layer */}
            <linearGradient id="topWave1" x1="0%" y1="0%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#EA580C" />
              <stop offset="45%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#FB923C" />
            </linearGradient>

            {/* Middle soft amber wave */}
            <linearGradient id="topWave2" x1="0%" y1="0%" x2="100%" y2="80%">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#FB923C" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#FDBA74" stopOpacity="0.35" />
            </linearGradient>

            {/* Subtle peach transition wave */}
            <linearGradient id="topWave3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FED7AA" stopOpacity="0.55" />
              <stop offset="60%" stopColor="#FFEDD5" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#FAF5F0" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Layer 3 - Light peach outer ripple */}
          <path
            d="M0 0 L1440 0 L1440 105 C1200 135, 950 85, 720 115 C480 140, 240 105, 0 120 Z"
            fill="url(#topWave3)"
          />

          {/* Layer 2 - Mid amber wave */}
          <path
            d="M0 0 L1440 0 L1440 85 C1220 110, 960 70, 720 95 C460 120, 240 80, 0 100 Z"
            fill="url(#topWave2)"
          />

          {/* Layer 1 - Deep vibrant orange curve */}
          <path
            d="M0 0 L1440 0 L1440 60 C1240 85, 980 50, 740 75 C480 100, 250 55, 0 75 Z"
            fill="url(#topWave1)"
          />
        </svg>
      </div>

      {/* 2. BOTTOM FLUID WAVES */}
      <div className="absolute bottom-0 inset-x-0 h-24 sm:h-32 overflow-hidden">
        <svg
          viewBox="0 0 1440 160"
          className="w-full h-full object-cover"
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            <linearGradient id="bottomWave1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EA580C" />
              <stop offset="50%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#FB923C" />
            </linearGradient>

            <linearGradient id="bottomWave2" x1="0%" y1="100%" x2="100%" y2="20%">
              <stop offset="0%" stopColor="#FDBA74" stopOpacity="0.7" />
              <stop offset="60%" stopColor="#FED7AA" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#FAF5F0" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Soft peach backdrop wave */}
          <path
            d="M0 160 L1440 160 L1440 70 C1220 30, 980 90, 720 50 C460 10, 240 80, 0 40 Z"
            fill="url(#bottomWave2)"
          />

          {/* Warm orange base wave */}
          <path
            d="M0 160 L1440 160 L1440 105 C1240 75, 960 120, 720 85 C480 50, 240 110, 0 85 Z"
            fill="url(#bottomWave1)"
          />
        </svg>
      </div>

      {/* 3. FLOATING DECORATIVE ELEMENTS (matched to exact mockup positions) */}

      {/* Top Left Dot Grid */}
      <DotGrid className="absolute top-10 sm:top-12 left-4 sm:left-14 opacity-75" />

      {/* Additional Dot Grid on right side */}
      <DotGrid className="absolute top-36 sm:top-40 right-3 sm:right-14 opacity-50 scale-75" />

      {/* Leaf 1 - Top Left Floating */}
      <Leaf className="absolute top-14 sm:top-16 left-16 sm:left-28 w-6 h-6 sm:w-8 sm:h-8 rotate-[25deg]" />

      {/* Leaf 2 - Mid Left near card */}
      <Leaf className="absolute top-28 sm:top-32 left-2 sm:left-8 w-6 h-6 sm:w-7 sm:h-7 -rotate-[35deg]" />

      {/* Leaf 3 - Right of Logo */}
      <Leaf className="absolute top-20 sm:top-24 right-5 sm:right-20 w-6 h-6 sm:w-8 sm:h-8 rotate-[65deg]" />

      {/* Leaf 4 - Far Left Floating */}
      <Leaf className="absolute top-[48%] left-2 sm:left-6 w-6 h-6 sm:w-7 sm:h-7 -rotate-[15deg]" />

      {/* Leaf 5 - Bottom Left */}
      <Leaf className="absolute bottom-6 sm:bottom-8 left-6 sm:left-16 w-7 h-7 sm:w-9 sm:h-9 rotate-[35deg]" />

      {/* Leaf 6 - Bottom Right */}
      <Leaf className="absolute bottom-8 sm:bottom-10 right-8 sm:right-24 w-6 h-6 sm:w-8 sm:h-8 -rotate-[60deg]" />

      {/* Variant-specific Doodles */}
      {variant === "login" && (
        <>
          {/* Chef Hat - Top Right */}
          <ChefHatDoodle className="absolute top-10 sm:top-12 right-6 sm:right-20 w-10 h-10 sm:w-12 sm:h-12 opacity-75 drop-shadow-xs" />

          {/* Cloche - Top Left */}
          <ClocheDoodle className="absolute top-24 sm:top-28 left-4 sm:left-16 w-9 h-9 sm:w-11 sm:h-11 opacity-70 drop-shadow-xs -rotate-6" />

          {/* Wheat / Herb Sprig - Top Right Edge */}
          <WheatSprigDoodle className="absolute top-20 sm:top-24 right-3 sm:right-12 w-6 h-8 sm:w-7 sm:h-9 opacity-70 rotate-12" />

          {/* Cutlery (Fork & Spoon) - Bottom Right */}
          <CutleryDoodle className="absolute bottom-4 sm:bottom-6 right-8 sm:right-24 w-10 h-10 sm:w-12 sm:h-12 opacity-75 drop-shadow-xs rotate-12" />

          {/* Cloche - Bottom Left */}
          <ClocheDoodle className="absolute bottom-5 sm:bottom-8 left-14 sm:left-28 w-8 h-8 sm:w-10 sm:h-10 opacity-60 drop-shadow-xs" />
        </>
      )}

      {variant === "forgot" && (
        <>
          {/* Cloche - Top Right */}
          <ClocheDoodle className="absolute top-10 sm:top-12 right-6 sm:right-20 w-10 h-10 sm:w-12 sm:h-12 opacity-75 drop-shadow-xs" />

          {/* Chef Hat - Top Left */}
          <ChefHatDoodle className="absolute top-22 sm:top-26 left-4 sm:left-16 w-9 h-9 sm:w-11 sm:h-11 opacity-65 drop-shadow-xs" />

          {/* Cloche - Bottom Right */}
          <ClocheDoodle className="absolute bottom-5 sm:bottom-7 right-8 sm:right-24 w-9 h-9 sm:w-11 sm:h-11 opacity-70 drop-shadow-xs" />

          {/* Cutlery - Bottom Left */}
          <CutleryDoodle className="absolute bottom-5 sm:bottom-7 left-14 sm:left-28 w-9 h-9 sm:w-11 sm:h-11 opacity-65 drop-shadow-xs -rotate-12" />
        </>
      )}

      {variant === "signup" && (
        <>
          {/* Graduation Cap - Top Right */}
          <GraduationCapDoodle className="absolute top-8 sm:top-10 right-6 sm:right-20 w-12 h-12 sm:w-14 sm:h-14 opacity-75 drop-shadow-xs -rotate-6" />

          {/* Open Book - Bottom Right */}
          <BookDoodle className="absolute bottom-4 sm:bottom-6 right-8 sm:right-24 w-12 h-10 sm:w-14 sm:h-12 opacity-75 drop-shadow-xs rotate-6" />

          {/* Chef Hat - Top Left */}
          <ChefHatDoodle className="absolute top-22 sm:top-26 left-4 sm:left-16 w-8 h-8 sm:w-10 sm:h-10 opacity-55 drop-shadow-xs" />

          {/* Cloche - Bottom Left */}
          <ClocheDoodle className="absolute bottom-5 sm:bottom-8 left-14 sm:left-28 w-8 h-8 sm:w-10 sm:h-10 opacity-55 drop-shadow-xs" />
        </>
      )}
    </div>
  )
})
