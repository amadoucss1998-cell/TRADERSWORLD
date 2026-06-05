'use client'

import React from 'react'
import { Bookmark, ExternalLink, Calendar, DollarSign } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, daysUntil, formatDate } from '@/lib/utils'
import type { Scholarship } from '@/types/scholarship'

interface ScholarshipCardProps {
  scholarship: Scholarship
  onSave?: (id: string) => void
  onView?: (id: string) => void
  saved?: boolean
}

export function ScholarshipCard({ scholarship, onSave, onView, saved = false }: ScholarshipCardProps) {
  const days = daysUntil(scholarship.deadline)
  const deadlineVariant = days < 14 ? 'danger' : days < 30 ? 'warning' : 'success'
  const scoreVariant = scholarship.match_score >= 70 ? 'success' : scholarship.match_score >= 50 ? 'warning' : 'danger'

  return (
    <Card className="flex flex-col h-full hover:border-green-600/50 transition-colors">
      <CardContent className="flex-1 p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2 flex-1">
            {scholarship.title}
          </h3>
          <Badge variant={scoreVariant} className="shrink-0">
            {scholarship.match_score}%
          </Badge>
        </div>

        <div className="space-y-2 text-xs text-[#a1a1aa]">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-white">{scholarship.provider}</span>
            <span>·</span>
            <span>🌍 {scholarship.country}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3 w-3 text-green-500" />
            <span className="text-green-400 font-medium">{scholarship.amount}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            <span className={cn(
              deadlineVariant === 'danger' ? 'text-red-400' :
              deadlineVariant === 'warning' ? 'text-yellow-400' : 'text-[#a1a1aa]'
            )}>
              Due {formatDate(scholarship.deadline)} ({days > 0 ? `${days} days` : 'Expired'})
            </span>
          </div>
        </div>

        {scholarship.match_reason && (
          <p className="mt-3 text-xs text-[#71717a] line-clamp-2">{scholarship.match_reason}</p>
        )}

        <div className="flex flex-wrap gap-1 mt-3">
          {scholarship.degree_levels.slice(0, 2).map(level => (
            <Badge key={level} variant="secondary" className="text-xs py-0">{level}</Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onSave?.(scholarship.id)}
        >
          <Bookmark className={cn('h-3.5 w-3.5', saved ? 'fill-green-500 text-green-500' : '')} />
          {saved ? 'Saved' : 'Save'}
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={() => onView?.(scholarship.id)}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View
        </Button>
      </CardFooter>
    </Card>
  )
}
