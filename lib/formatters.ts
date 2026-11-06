/**
 * Utility functions for Persian number conversion, normalization, and formatting.
 * Handles both Persian and English keyboard inputs and outputs consistent Persian numerals.
 */

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"]

/**
 * Converts any number or string containing digits to Persian numerals (۰-۹).
 * Handles numbers, strings, and mixed text.
 * Example: 12345 -> "۱۲۳۴۵", "12:30" -> "۱۲:۳۰"
 */
export function toPersianDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return ""
  return String(input)
    .replace(/[0-9]/g, (w) => PERSIAN_DIGITS[+w])
    .replace(/[٠-٩]/g, (w) => PERSIAN_DIGITS[w.charCodeAt(0) - 1632])
}

/**
 * Converts Persian (۰-۹) and Arabic (٠-٩) digits to English digits (0-9).
 * Used for sanitizing user inputs before parsing (parseInt/parseFloat) or sending to APIs.
 * Example: "۵۰۰۰۰" -> "50000"
 */
export function toEnglishDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return ""
  return String(input)
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
}

/**
 * Safely parses an integer from input that may contain Persian, Arabic, or English digits.
 * Example: parsePersianInt("۵۰,۰۰۰") -> 50000, parsePersianInt("50000") -> 50000
 */
export function parsePersianInt(input: string | number | null | undefined, defaultValue = 0): number {
  if (input === null || input === undefined || input === "") return defaultValue
  const sanitized = toEnglishDigits(input).replace(/[^\d-]/g, "")
  const parsed = parseInt(sanitized, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * Safely parses a float from input that may contain Persian, Arabic, or English digits.
 */
export function parsePersianFloat(input: string | number | null | undefined, defaultValue = 0): number {
  if (input === null || input === undefined || input === "") return defaultValue
  const sanitized = toEnglishDigits(input).replace(/[^\d.-]/g, "")
  const parsed = parseFloat(sanitized)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * Formats a monetary amount or number with thousands separator (٬) and Persian numerals.
 * Example: 60000 -> "۶۰٬۰۰۰", "45000" -> "۴۵٬۰۰۰"
 */
export function formatPersianPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined || price === "") return "۰"
  const num = typeof price === "number" ? price : parsePersianFloat(price, 0)
  const parts = Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "٬")
  return toPersianDigits(parts)
}

/**
 * Normalizes a search query and target string for number-agnostic search.
 * Ensures typing "401" matches "۴۰۱۱۲۳۴۵" and vice versa.
 */
export function normalizeForSearch(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return ""
  return toEnglishDigits(text).toLowerCase().trim()
}
