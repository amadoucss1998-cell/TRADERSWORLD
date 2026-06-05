import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-green-600/20 text-green-400 border border-green-600/30',
        success: 'bg-green-600/20 text-green-400 border border-green-600/30',
        warning: 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30',
        danger: 'bg-red-600/20 text-red-400 border border-red-600/30',
        secondary: 'bg-[#1f1f1f] text-[#a1a1aa] border border-[#2a2a2a]',
        outline: 'border border-[#1f1f1f] text-[#a1a1aa]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
