'use client'

import React, { useState } from 'react'
import { cn, daysUntil, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { Application } from '@/types/application'

const COLUMNS: { key: Application['status']; label: string; color: string }[] = [
  { key: 'drafting', label: 'Drafting', color: 'border-t-blue-500' },
  { key: 'submitted', label: 'Submitted', color: 'border-t-yellow-500' },
  { key: 'interview', label: 'Interview', color: 'border-t-purple-500' },
  { key: 'accepted', label: 'Accepted', color: 'border-t-green-500' },
  { key: 'rejected', label: 'Rejected', color: 'border-t-red-500' },
]

interface KanbanBoardProps {
  applications: Application[]
  onStatusChange?: (id: string, status: Application['status']) => void
  onCardClick?: (id: string) => void
}

export function KanbanBoard({ applications, onStatusChange, onCardClick }: KanbanBoardProps) {
  const [dragging, setDragging] = useState<string | null>(null)

  function handleDragOver(e: React.DragEvent, status: Application['status']) {
    e.preventDefault()
  }

  function handleDrop(e: React.DragEvent, status: Application['status']) {
    e.preventDefault()
    if (dragging) {
      onStatusChange?.(dragging, status)
      setDragging(null)
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
      {COLUMNS.map(col => {
        const cards = applications.filter(a => a.status === col.key)
        return (
          <div
            key={col.key}
            className="flex-1 min-w-[200px]"
            onDragOver={e => handleDragOver(e, col.key)}
            onDrop={e => handleDrop(e, col.key)}
          >
            <div className={cn('bg-[#111111] rounded-lg border border-[#1f1f1f] border-t-4 p-3 min-h-[500px]', col.color)}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">{col.label}</h3>
                <span className="text-xs text-[#71717a] bg-[#1f1f1f] rounded-full px-2 py-0.5">{cards.length}</span>
              </div>

              <div className="space-y-2">
                {cards.map(app => {
                  const days = daysUntil(app.deadline)
                  const wordCount = app.essay_draft ? app.essay_draft.trim().split(/\s+/).length : 0
                  const wordProgress = Math.min(100, (wordCount / app.word_limit) * 100)

                  return (
                    <div
                      key={app.id}
                      draggable
                      onDragStart={() => setDragging(app.id)}
                      onClick={() => onCardClick?.(app.id)}
                      className="bg-[#0a0a0a] rounded-md p-3 border border-[#1f1f1f] cursor-pointer hover:border-green-600/40 transition-colors"
                    >
                      <p className="text-xs text-white font-medium line-clamp-2 mb-2">
                        {app.scholarship?.title || 'Unnamed Scholarship'}
                      </p>
                      <Badge
                        variant={days < 14 ? 'danger' : days < 30 ? 'warning' : 'success'}
                        className="text-xs mb-2"
                      >
                        {days > 0 ? `${days}d left` : 'Expired'} · {formatDate(app.deadline)}
                      </Badge>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-[#71717a] mb-1">
                          <span>Essay</span>
                          <span>{Math.round(wordProgress)}%</span>
                        </div>
                        <div className="h-1 bg-[#1f1f1f] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-600 rounded-full transition-all"
                            style={{ width: `${wordProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
