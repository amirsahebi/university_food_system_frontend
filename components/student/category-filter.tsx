"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

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

  useEffect(() => {
    if (!Array.isArray(dailyMenuItems)) return

    const uniqueCategories = Array.from(
      new Set(dailyMenuItems.map((item: MenuItem) => item.food.category_id))
    ).map((categoryId: number) => ({
      id: categoryId,
      name: dailyMenuItems.find((item: MenuItem) => item.food.category_id === categoryId)?.food.category_name || 'نامشخص'
    }))

    setCategories(uniqueCategories)
    setIsLoading(false)
  }, [dailyMenuItems])

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
    <ScrollArea 
      className="w-full whitespace-nowrap touch-pan-x"
      type="auto"
    >
      <div className="flex space-x-2 rtl:space-x-reverse p-1">
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
    </ScrollArea>
  )
}
