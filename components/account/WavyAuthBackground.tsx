"use client"

import React, { memo } from "react"

interface WavyAuthBackgroundProps {
  variant?: "login" | "forgot-password" | "signup"
}

// Leaf Vector Component with dual-tone green gradient & central vein
function FreshLeaf({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`pointer-events-none drop-shadow-sm transition-transform ${className}`} style={style}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="leafGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="60%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>
        </defs>
        {/* Leaf blade */}
        <path
          d="M6 26C6 26 8 16 16 9C24 2 28 4 28 4C28 4 28 9 22 17C16 25 6 26 6 26Z"
          fill="url(#leafGrad)"
        />
        {/* Leaf central vein */}
        <path
          d="M6 26C12 21 18 14 24 6"
          stroke="#166534"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeOpacity="0.45"
        />
      </svg>
    </div>
  )
}

// Dot Matrix (5 columns x 4 rows)
function DotMatrix({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none opacity-60 select-none ${className}`}>
      <svg width="56" height="42" viewBox="0 0 56 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2, 3, 4].map((col) => (
            <circle
              key={`${row}-${col}`}
              cx={6 + col * 11}
              cy={6 + row * 10}
              r="2"
              fill="#FDBA74"
            />
          ))
        )}
      </svg>
    </div>
  )
}

// Chef's Hat Outline Icon
function ChefHatIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none drop-shadow-xs ${className}`}
    >
      <path
        d="M12 36H36M14 36V40H34V36M12 36C9 36 7 33.5 7 30C7 26.5 9.5 24 13 24C12.5 22 12.5 19 14.5 17C17 14.5 20 15 21 16C22.5 13 25.5 13 27 16C28 15 31 14.5 33.5 17C35.5 19 35.5 22 35 24C38.5 24 41 26.5 41 30C41 33.5 39 36 36 36H12Z"
        stroke="#D97706"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M18 36V40" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M24 36V40" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M30 36V40" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

// Food Serving Cloche Dome Icon
function ClocheIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="46"
      height="46"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none drop-shadow-xs ${className}`}
    >
      {/* Top Handle Knob */}
      <circle cx="24" cy="14" r="3" stroke="#D97706" strokeWidth="2.4" />
      {/* Cloche Dome */}
      <path
        d="M8 32C8 23 15 17 24 17C33 17 40 23 40 32H8Z"
        stroke="#D97706"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Platter Base */}
      <path
        d="M5 34H43"
        stroke="#D97706"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

// Fork & Spoon Pair Outline
function ForkSpoonIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="46"
      height="46"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none drop-shadow-xs ${className}`}
    >
      {/* Fork */}
      <path
        d="M17 10V18C17 20 18.5 21.5 20.5 21.5V38M14 10V16M20 10V16"
        stroke="#D97706"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Spoon */}
      <path
        d="M31 10C28.5 10 27 12.5 27 15.5C27 18.5 28.5 21 31 21C33.5 21 35 18.5 35 15.5C35 12.5 33.5 10 31 10ZM31 21V38"
        stroke="#D97706"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Wheat / Herb Sprig
function WheatIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 42 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none drop-shadow-xs ${className}`}
    >
      <path d="M10 34C16 28 24 18 32 8" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M26 12C28 10 31 10 33 12C33 14 31 17 29 17C27 17 26 14 26 12Z" stroke="#D97706" strokeWidth="2" />
      <path d="M21 16C20 14 20 11 22 10C24 10 26 12 25 15C24 17 22 17 21 16Z" stroke="#D97706" strokeWidth="2" />
      <path d="M21 21C23 19 26 19 28 21C28 23 26 26 24 26C22 26 21 23 21 21Z" stroke="#D97706" strokeWidth="2" />
      <path d="M16 25C15 23 15 20 17 19C19 19 21 21 20 24C19 26 17 26 16 25Z" stroke="#D97706" strokeWidth="2" />
    </svg>
  )
}

// Graduation Academic Mortarboard Cap (for Student Registration)
function GraduationCapIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="54"
      height="54"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none drop-shadow-xs ${className}`}
    >
      {/* Top Diamond */}
      <path
        d="M24 10L42 19L24 28L6 19L24 10Z"
        stroke="#D97706"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Skull Cap Base */}
      <path
        d="M13 23V31C13 34 18 37 24 37C30 37 35 34 35 31V23"
        stroke="#D97706"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Hanging Tassel */}
      <path
        d="M40 20V32C40 33 39 34 38 34"
        stroke="#D97706"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

// Open Book Icon (for Student Registration)
function OpenBookIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none drop-shadow-xs ${className}`}
    >
      {/* Spine and Left Page */}
      <path
        d="M26 16C21 13 14 13 8 16V36C14 33 21 33 26 36M26 16C31 13 38 13 44 16V36C38 33 31 33 26 36M26 16V36"
        stroke="#D97706"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Page lines */}
      <path d="M12 22C16 20.5 20 20.5 23 22" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 27C16 25.5 20 25.5 23 27" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M29 22C32 20.5 36 20.5 40 22" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M29 27C32 25.5 36 25.5 40 27" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export const WavyAuthBackground = memo(function WavyAuthBackground({
  variant = "login",
}: WavyAuthBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none bg-[#FFF8F2]"
    >
      {/* 1. TOP FLUID ORGANIC WAVES (Matching exact reference curves) */}
      <div className="absolute top-0 left-0 right-0 h-44 sm:h-52 w-full overflow-hidden">
        <svg
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          className="absolute -top-1 left-0 w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Layer 1: Warm Peach Soft Wave */}
          <path
            d="M0 0H1440V180C1320 230 1180 250 1020 220C840 185 710 130 520 160C330 190 180 260 0 210V0Z"
            fill="#FED7AA"
            fillOpacity="0.55"
          />
          {/* Layer 2: Sunset Saffron Mid Wave */}
          <path
            d="M0 0H1440V130C1310 180 1190 160 1060 135C910 105 790 140 640 170C460 205 310 160 0 110V0Z"
            fill="#FB923C"
            fillOpacity="0.75"
          />
          {/* Layer 3: Vibrant Orange Primary Accent Wave */}
          <path
            d="M0 0H1440V80C1350 120 1250 130 1140 105C990 70 880 110 740 135C580 160 410 120 0 60V0Z"
            fill="#F97316"
            fillOpacity="0.95"
          />
        </svg>
      </div>

      {/* 2. BOTTOM FLUID ORGANIC WAVES (Matching exact reference curves) */}
      <div className="absolute bottom-0 left-0 right-0 h-40 sm:h-48 w-full overflow-hidden">
        <svg
          viewBox="0 0 1440 280"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Layer 1: Peach Soft Wave */}
          <path
            d="M0 120C180 60 340 110 520 140C720 170 880 110 1060 80C1210 55 1330 90 1440 130V280H0V120Z"
            fill="#FED7AA"
            fillOpacity="0.55"
          />
          {/* Layer 2: Sunset Saffron Mid Wave */}
          <path
            d="M0 160C220 110 390 155 580 185C770 215 920 165 1110 130C1250 105 1360 135 1440 170V280H0V160Z"
            fill="#FB923C"
            fillOpacity="0.75"
          />
          {/* Layer 3: Vibrant Orange Primary Accent Wave */}
          <path
            d="M0 210C240 170 410 200 620 225C810 250 960 210 1160 185C1300 165 1390 185 1440 210V280H0V210Z"
            fill="#F97316"
            fillOpacity="0.95"
          />
        </svg>
      </div>

      {/* 3. FLOATING ILLUSTRATIONS & LEAVES (Matching each page's exact reference) */}
      <div className="absolute inset-0 max-w-4xl mx-auto overflow-hidden pointer-events-none">
        {/* COMMON ELEMENTS */}
        {/* Top-Left Dot Matrix */}
        <DotMatrix className="absolute top-10 sm:top-14 left-4 sm:left-12" />

        {/* Top-Left Fresh Leaf */}
        <FreshLeaf className="absolute top-8 sm:top-12 left-16 sm:left-28 -rotate-45" />

        {/* Mid-Left Leaf */}
        <FreshLeaf className="absolute top-1/3 left-3 sm:left-8 rotate-12 scale-90" />

        {/* Bottom-Left Leaf */}
        <FreshLeaf className="absolute bottom-10 sm:bottom-16 left-6 sm:left-14 -rotate-12" />

        {/* PAGE SPECIFIC ILLUSTRATIONS */}
        {variant === "login" && (
          <>
            {/* Top-Right: Chef Hat */}
            <div className="absolute top-8 sm:top-12 right-6 sm:right-16">
              <ChefHatIcon />
            </div>

            {/* Top-Right: Wheat Sprig */}
            <div className="absolute top-24 sm:top-28 right-4 sm:right-12 rotate-12">
              <WheatIcon />
            </div>

            {/* Mid-Left: Food Cloche */}
            <div className="absolute top-28 sm:top-32 left-4 sm:left-10 -rotate-6">
              <ClocheIcon />
            </div>

            {/* Mid-Right: Green Leaf */}
            <FreshLeaf className="absolute top-36 sm:top-40 right-8 sm:right-20 rotate-45" />

            {/* Bottom-Right: Spoon & Fork */}
            <div className="absolute bottom-8 sm:bottom-12 right-12 sm:right-24 rotate-12">
              <ForkSpoonIcon />
            </div>

            {/* Bottom-Right: Leaf */}
            <FreshLeaf className="absolute bottom-16 sm:bottom-20 right-28 sm:right-44 -rotate-45 scale-95" />
          </>
        )}

        {variant === "forgot-password" && (
          <>
            {/* Top-Right: Serving Cloche */}
            <div className="absolute top-10 sm:top-14 right-8 sm:right-20 rotate-12">
              <ClocheIcon />
            </div>

            {/* Top-Right: Green Leaf */}
            <FreshLeaf className="absolute top-24 sm:top-28 right-5 sm:right-12 45 rotate-45" />

            {/* Mid-Right: Green Leaf */}
            <FreshLeaf className="absolute top-40 sm:top-44 right-10 sm:right-24 -rotate-30" />

            {/* Bottom-Right: Serving Cloche */}
            <div className="absolute bottom-10 sm:bottom-14 right-8 sm:right-20 -rotate-6">
              <ClocheIcon />
            </div>

            {/* Bottom-Center-Right: Green Leaf */}
            <FreshLeaf className="absolute bottom-16 sm:bottom-20 right-28 sm:right-48 rotate-45 scale-95" />
          </>
        )}

        {variant === "signup" && (
          <>
            {/* Top-Right: Graduation Academic Cap */}
            <div className="absolute top-8 sm:top-12 right-6 sm:right-16 -rotate-6">
              <GraduationCapIcon />
            </div>

            {/* Top-Right: Green Leaf */}
            <FreshLeaf className="absolute top-28 sm:top-32 right-5 sm:right-12 rotate-45" />

            {/* Mid-Right: Dot Matrix */}
            <DotMatrix className="absolute top-36 sm:top-40 right-6 sm:right-14 scale-90" />

            {/* Bottom-Right: Open Study Book */}
            <div className="absolute bottom-6 sm:bottom-10 right-8 sm:right-20 rotate-6">
              <OpenBookIcon />
            </div>

            {/* Bottom-Right: Green Leaf */}
            <FreshLeaf className="absolute bottom-20 sm:bottom-24 right-32 sm:right-52 -rotate-45 scale-95" />
          </>
        )}
      </div>
    </div>
  )
})
