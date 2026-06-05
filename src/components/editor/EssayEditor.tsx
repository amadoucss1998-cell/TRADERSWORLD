'use client'

import React, { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'

interface EssayEditorProps {
  content: string
  onChange: (content: string) => void
  wordLimit?: number
  autoSave?: boolean
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

export function EssayEditor({ content, onChange, wordLimit = 500, autoSave = true }: EssayEditorProps) {
  const [saving, setSaving] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wordCount = countWords(content)
  const overLimit = wordCount > wordLimit

  useEffect(() => {
    if (!autoSave) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaving(false)
    saveTimer.current = setTimeout(() => {
      setSaving(true)
      setTimeout(() => setSaving(false), 1000)
    }, 2000)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [content, autoSave])

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center justify-between text-xs text-[#71717a]">
        <span className={cn('font-mono', overLimit ? 'text-red-400' : '')}>
          {wordCount} / {wordLimit} words
          {overLimit && ' (over limit)'}
        </span>
        {autoSave && (
          <span className={cn('transition-opacity', saving ? 'opacity-100 text-green-500' : 'opacity-0')}>
            ✓ Saved
          </span>
        )}
      </div>
      <Textarea
        value={content}
        onChange={e => onChange(e.target.value)}
        placeholder="Your essay will appear here. Use the AI panel to generate or improve it, or write directly..."
        className={cn(
          'flex-1 min-h-[400px] font-mono text-sm leading-relaxed resize-none',
          overLimit && 'border-red-500/50 focus-visible:ring-red-500'
        )}
      />
    </div>
  )
}
