"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import api from "@/lib/axios"
import { API_ROUTES, createApiUrl } from "@/lib/api"

interface FoodCategory {
  id: number
  name: string
}

interface CategoryFilterProps {
  onCategoryChange: (categoryId: number | null) => void
  selectedCategoryId: number | null
}

export function CategoryFilter({ onCategoryChange, selectedCategoryId }: CategoryFilterProps) {
  const [categories, setCategories] = useState<FoodCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true)
        const response = await api.get(createApiUrl(API_ROUTES.GET_FOOD_CATEGORIES))
        setCategories(response.data)
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

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
    <ScrollArea className="w-full whitespace-nowrap">
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
