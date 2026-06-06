import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function formatDate(date: string | Date): string {
  if (!date) return 'No deadline'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'No deadline'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
}

export function daysUntil(date: string | Date): number {
  if (!date) return 0
  const d = new Date(date)
  if (isNaN(d.getTime())) return 0
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}
