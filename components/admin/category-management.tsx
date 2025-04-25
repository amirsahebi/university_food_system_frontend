"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface MenuItem {
  food: {
    category_id: number
    category_name: string
  }
}

interface FoodCategory {
  id: number
  name: string
}

interface CategoryFilterProps {
  onCategoryChange: (categoryId: number | null) => void
  selectedCategoryId: number | null
  dailyMenuItems: MenuItem[]
}

export function CategoryFilter({ onCategoryChange, selectedCategoryId, dailyMenuItems }: CategoryFilterProps) {
  const [categories, setCategories] = useState<FoodCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!Array.isArray(dailyMenuItems)) return

    const uniqueCategories = Array.from(new Set(dailyMenuItems.map((item: MenuItem) => item.food.category_id))).map(
      (categoryId: number) => ({
        id: categoryId,
        name:
          dailyMenuItems.find((item: MenuItem) => item.food.category_id === categoryId)?.food.category_name || "نامشخص",
      }),
    )

    setCategories(uniqueCategories)
    setIsLoading(false)
  }, [dailyMenuItems])

  useEffect(() => {
    const checkScroll = () => {
      if (!scrollContainerRef.current) return

      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current

      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }

    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", checkScroll)
      // Initial check
      checkScroll()

      return () => scrollContainer.removeEventListener("scroll", checkScroll)
    }
  }, [categories])

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" })
    }
  }

  if (isLoading) {
    return (
      <div className="flex overflow-x-auto py-2 px-1 space-x-2 rtl:space-x-reverse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-24 bg-gray-200 animate-pulse rounded-full"></div>
        ))}
      </div>
    )
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <div className="relative w-full">
      <ScrollArea className="w-full">
        <div
          className="flex space-x-2 rtl:space-x-reverse p-1 px-2 whitespace-nowrap overflow-x-auto"
          ref={scrollContainerRef}
        >
          <Button
            variant={selectedCategoryId === null ? "default" : "outline"}
            size="sm"
            className={`rounded-full ${
              selectedCategoryId === null ? "bg-[#F47B20] text-white" : "bg-[#F4EDE7] text-gray-700"
            }`}
            onClick={() => onCategoryChange(null)}
          >
            همه
          </Button>

          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategoryId === category.id ? "default" : "outline"}
              size="sm"
              className={`rounded-full ${
                selectedCategoryId === category.id ? "bg-[#F47B20] text-white" : "bg-[#F4EDE7] text-gray-700"
              }`}
              onClick={() => onCategoryChange(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="absolute left-0 top-0 h-full w-12 bg-gradient-to-r pointer-events-none" />
      <div className="absolute right-0 top-0 h-full w-12 bg-gradient-to-l pointer-events-none" />

      {canScrollLeft && (
        <Button
          size="icon"
          variant="outline"
          className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 shadow-md hidden md:flex"
          onClick={scrollLeft}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {canScrollRight && (
        <Button
          size="icon"
          variant="outline"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 shadow-md hidden md:flex"
          onClick={scrollRight}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
