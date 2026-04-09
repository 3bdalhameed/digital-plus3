import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function getProductName(product: any, locale: 'ar' | 'en' = 'ar'): string {
  if (locale === 'ar') return product?.name_ar || product?.name_en || ''
  return product?.name_en || product?.name_ar || ''
}

export function getCategoryName(category: any, locale: 'ar' | 'en' = 'ar'): string {
  if (locale === 'ar') return category?.name_ar || category?.name_en || ''
  return category?.name_en || category?.name_ar || ''
}
