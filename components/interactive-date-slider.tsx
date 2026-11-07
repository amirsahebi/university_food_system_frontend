'use client'

import React, { useRef, useMemo, useState, useCallback } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import DatePicker, { DateObject } from 'react-multi-date-picker'
import persian from 'react-date-object/calendars/persian'
import persian_fa from 'react-date-object/locales/persian_fa'
import { ChevronRight, ChevronLeft, CalendarDays } from 'lucide-react'
import { toPersianDigits } from '@/lib/formatters'

interface InteractiveDateSliderProps {
  selectedDate: Date
  onChange: (date: Date) => void
}

// Cubic bezier Apple deceleration curve (Monotonic: ZERO overshoot, ZERO bounce back)
const SMOOTH_EASE = [0.25, 1, 0.5, 1] as const

export function InteractiveDateSlider({
  selectedDate,
  onChange,
}: InteractiveDateSliderProps) {
  // 1 = moving to Next Day (sliding right), -1 = moving to Prev Day (sliding left)
  const [direction, setDirection] = useState<number>(1)
  const isDraggingRef = useRef(false)

  // Next and Previous dates
  const nextDate = useMemo(() => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + 1)
    return d
  }, [selectedDate])

  const prevDate = useMemo(() => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - 1)
    return d
  }, [selectedDate])

  const formatPersian = useCallback((d: Date) => {
    try {
      return toPersianDigits(
        new Intl.DateTimeFormat('fa-IR', {
          weekday: 'short',
          day: 'numeric',
          month: 'long',
        }).format(d)
      )
    } catch {
      return d.toDateString()
    }
  }, [])

  const currentDisplay = useMemo(() => formatPersian(selectedDate), [selectedDate, formatPersian])

  // Handlers for Next and Prev day
  const goToNextDay = useCallback(() => {
    setDirection(1)
    onChange(nextDate)
  }, [nextDate, onChange])

  const goToPrevDay = useCallback(() => {
    setDirection(-1)
    onChange(prevDate)
  }, [prevDate, onChange])

  // Interactive Drag End (Swipe)
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setTimeout(() => {
        isDraggingRef.current = false
      }, 50)

      const offset = info.offset.x
      const velocity = info.velocity.x

      // In RTL: Dragging to the RIGHT (positive offset) -> Next Day
      if (offset > 20 || velocity > 150) {
        setDirection(1)
        onChange(nextDate)
      }
      // In RTL: Dragging to the LEFT (negative offset) -> Previous Day
      else if (offset < -20 || velocity < -150) {
        setDirection(-1)
        onChange(prevDate)
      }
    },
    [nextDate, prevDate, onChange]
  )

  const handlePickerOpen = (openCalendar: () => void) => {
    if (isDraggingRef.current) return
    openCalendar()
  }

  // Animation variants: perfectly clipped inside box, smooth blur & fade, zero overshoot
  const variants = {
    enter: (dir: number) => ({
      // Next day (dir > 0) enters from left (-45px), Prev day enters from right (+45px)
      x: dir > 0 ? -45 : 45,
      opacity: 0,
      scale: 0.94,
      filter: 'blur(5px)',
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.28,
        ease: SMOOTH_EASE,
      },
    },
    exit: (dir: number) => ({
      // Next day exits to right (+45px), Prev day exits to left (-45px)
      x: dir > 0 ? 45 : -45,
      opacity: 0,
      scale: 0.94,
      filter: 'blur(5px)',
      transition: {
        duration: 0.22,
        ease: SMOOTH_EASE,
      },
    }),
  }

  const dateKey = useMemo(() => {
    return `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`
  }, [selectedDate])

  return (
    <div
      dir="rtl"
      className="glass flex items-center justify-between gap-1.5 rounded-full p-1.5 sm:min-w-80 select-none border border-glass-border shadow-xs"
    >
      {/* 1. Right Button (در زبان فارسی / RTL: دکمه راست = روز قبل / گذشته) */}
      <button
        type="button"
        aria-label="روز قبل"
        title="روز قبل (گذشته)"
        onClick={goToPrevDay}
        className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-glass-strong active:scale-95 transition cursor-pointer text-muted-foreground hover:text-foreground"
      >
        <ChevronRight className="size-4" />
      </button>

      {/* 2. Center: Draggable, Clipped, Soft-Masked Viewport */}
      <DatePicker
        value={selectedDate}
        onChange={(date) => {
          if (date instanceof DateObject) {
            const newDate = date.toDate()
            setDirection(newDate > selectedDate ? 1 : -1)
            onChange(newDate)
          }
        }}
        calendar={persian}
        locale={persian_fa}
        calendarPosition="bottom-right"
        render={(_value, openCalendar) => (
          <div className="relative flex-1 min-w-[165px] sm:min-w-[195px] h-10 overflow-hidden flex items-center justify-center [mask-image:linear-gradient(to_right,transparent,black_14%,black_86%,transparent)] select-none">
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.3}
              whileDrag={{ cursor: 'grabbing' }}
              onDragStart={() => {
                isDraggingRef.current = true
              }}
              onDragEnd={handleDragEnd}
              onClick={() => handlePickerOpen(openCalendar)}
              className="size-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-none relative"
            >
              <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                <motion.div
                  key={dateKey}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="flex items-center justify-center gap-2 whitespace-nowrap text-xs sm:text-sm font-semibold text-foreground"
                >
                  <CalendarDays className="size-4 text-primary shrink-0" />
                  <span>{currentDisplay}</span>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      />

      {/* 3. Left Button (در زبان فارسی / RTL: دکمه چپ = روز بعد / آینده) */}
      <button
        type="button"
        aria-label="روز بعد"
        title="روز بعد (آینده)"
        onClick={goToNextDay}
        className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-glass-strong active:scale-95 transition cursor-pointer text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
      </button>
    </div>
  )
}
