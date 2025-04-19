"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Plus, Trash } from "lucide-react"
import { toast } from "react-hot-toast"
import api from "@/lib/axios"
import { API_ROUTES, createApiUrl } from "@/lib/api"

interface FoodCategory {
  id: number
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

interface CategoryFormData {
  name: string
  description: string | null
}

export function CategoryManagement() {
  const [categories, setCategories] = useState<FoodCategory[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<FoodCategory | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get(createApiUrl(API_ROUTES.GET_FOOD_CATEGORIES))
      setCategories(response.data)
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast.error("خطا در دریافت دسته‌بندی‌ها")
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleAddCategory = () => {
    setCurrentCategory(null)
    setFormData({ name: "", description: "" })
    setIsDialogOpen(true)
  }

  const handleEditCategory = (category: FoodCategory) => {
    setCurrentCategory(category)
    setFormData({
      name: category.name,
      description: category.description,
    })
    setIsDialogOpen(true)
  }

  const handleDeleteCategory = (category: FoodCategory) => {
    setCurrentCategory(category)
    setIsDeleteDialogOpen(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("لطفاً نام دسته‌بندی را وارد کنید")
      return
    }

    setIsSubmitting(true)

    try {
      if (currentCategory) {
        // Update existing category
        await api.put(createApiUrl(API_ROUTES.UPDATE_FOOD_CATEGORY(currentCategory.id.toString())), formData)
        toast.success("دسته‌بندی با موفقیت به‌روزرسانی شد")
      } else {
        // Create new category
        await api.post(createApiUrl(API_ROUTES.ADD_FOOD_CATEGORY), formData)
        toast.success("دسته‌بندی جدید با موفقیت ایجاد شد")
      }

      setIsDialogOpen(false)
      fetchCategories()
    } catch (error) {
      console.error("Error saving category:", error)
      toast.error(currentCategory ? "خطا در به‌روزرسانی دسته‌بندی" : "خطا در ایجاد دسته‌بندی")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!currentCategory) return

    setIsSubmitting(true)

    try {
      await api.delete(createApiUrl(API_ROUTES.DELETE_FOOD_CATEGORY(currentCategory.id.toString())))
      toast.success("دسته‌بندی با موفقیت حذف شد")
      setIsDeleteDialogOpen(false)
      fetchCategories()
    } catch (error: any) {
      console.error("Error deleting category:", error)
      if (error.response?.status === 400) {
        toast.error("این دسته‌بندی به یک یا چند غذا اختصاص داده شده است و قابل حذف نیست")
      } else {
        toast.error("خطا در حذف دسته‌بندی")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">مدیریت دسته‌بندی‌های غذا</h2>
        <Button onClick={handleAddCategory} className="bg-[#F47B20] hover:bg-[#E06A10]">
          <Plus className="w-4 h-4 ml-2" /> افزودن دسته‌بندی
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>نام دسته‌بندی</TableHead>
            <TableHead>توضیحات</TableHead>
            <TableHead>تاریخ ایجاد</TableHead>
            <TableHead>عملیات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell>{category.description || "-"}</TableCell>
              <TableCell>{new Date(category.created_at).toLocaleDateString("fa-IR")}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditCategory(category)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteCategory(category)}>
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {categories.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4">
                هیچ دسته‌بندی یافت نشد
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Add/Edit Category Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentCategory ? "ویرایش دسته‌بندی" : "افزودن دسته‌بندی جدید"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4" dir="rtl">
            <div className="space-y-2">
              <Label htmlFor="name">نام دسته‌بندی</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="نام دسته‌بندی را وارد کنید"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">توضیحات (اختیاری)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleInputChange}
                placeholder="توضیحات دسته‌بندی را وارد کنید"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              انصراف
            </Button>
            <Button onClick={handleSubmit} className="bg-[#F47B20] hover:bg-[#E06A10]" disabled={isSubmitting}>
              {isSubmitting ? "در حال ذخیره..." : currentCategory ? "به‌روزرسانی" : "افزودن"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>حذف دسته‌بندی</DialogTitle>
          </DialogHeader>
          <div className="py-4" dir="rtl">
            <p>آیا از حذف دسته‌بندی "{currentCategory?.name}" اطمینان دارید؟</p>
            <p className="text-sm text-red-500 mt-2">
              توجه: اگر این دسته‌بندی به غذایی اختصاص داده شده باشد، قابل حذف نخواهد بود.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>
              انصراف
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? "در حال حذف..." : "حذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
