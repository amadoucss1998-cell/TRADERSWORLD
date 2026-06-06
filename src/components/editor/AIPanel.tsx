'use client'

import React, { useState } from 'react'
import { Sparkles, Wand2, Heart, CheckCircle, Scissors, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface AIPanelProps {
  profile: Record<string, unknown>
  scholarshipName: string
  provider: string
  scholarshipDescription: string
  essayPrompt: string
  wordLimit: number
  currentEssay: string
  onUseEssay: (essay: string) => void
}

const QUICK_ACTIONS = [
  { label: '✨ Generate Full Essay', instruction: 'generate', icon: Sparkles },
  { label: '🔧 Improve Writing', instruction: 'Improve the overall writing quality, clarity, and flow', icon: Wand2 },
  { label: '💬 Make More Personal', instruction: 'Make the essay more personal and authentic, using first-person voice', icon: Heart },
  { label: '✅ Fix Grammar', instruction: 'Fix all grammar, punctuation, and spelling errors', icon: CheckCircle },
  { label: '📝 Shorten Essay', instruction: 'Shorten the essay to be more concise while keeping key points', icon: Scissors },
]

export function AIPanel({
  profile, scholarshipName, provider, scholarshipDescription, essayPrompt, wordLimit, currentEssay, onUseEssay
}: AIPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [customInstruction, setCustomInstruction] = useState('')

  async function runGenerate() {
    setStreaming(true)
    setOutput('')
    setError('')
    try {
      const res = await fetch('/api/applications/generate-essay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, scholarshipName, provider, scholarshipDescription, essayPrompt, wordLimit }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || `Error ${res.status}: generation failed`)
        return
      }
      if (!res.body) return
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setOutput(text)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.')
    } finally {
      setStreaming(false)
    }
  }

  async function runImprove(instruction: string) {
    if (!currentEssay) { setError('Write or generate an essay first.'); return }
    setStreaming(true)
    setOutput('')
    setError('')
    try {
      const res = await fetch('/api/applications/improve-essay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentEssay, instruction, wordLimit }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || `Error ${res.status}: improvement failed`)
        return
      }
      if (!res.body) return
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setOutput(text)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.')
    } finally {
      setStreaming(false)
    }
  }

  function handleAction(instruction: string) {
    if (instruction === 'generate') runGenerate()
    else runImprove(instruction)
  }

  return (
    <div className="border border-[#1f1f1f] rounded-lg bg-[#111111] overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-[#1a1a1a] transition-colors"
      >
        <div className="flex items-center gap-2 text-white font-medium text-sm">
          <Sparkles className="h-4 w-4 text-green-500" />
          AI Writing Assistant
          {streaming && <Loader2 className="h-3.5 w-3.5 animate-spin text-green-500" />}
        </div>
        {collapsed ? <ChevronDown className="h-4 w-4 text-[#a1a1aa]" /> : <ChevronUp className="h-4 w-4 text-[#a1a1aa]" />}
      </button>

      {!collapsed && (
        <div className="p-4 pt-0 space-y-4">
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-2">
            {QUICK_ACTIONS.map(action => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                className="justify-start text-left"
                disabled={streaming}
                onClick={() => handleAction(action.instruction)}
              >
                {action.label}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder="Custom instruction (e.g. 'Focus more on leadership experience')"
              value={customInstruction}
              onChange={e => setCustomInstruction(e.target.value)}
              className="min-h-[60px] text-xs"
            />
            <Button
              size="sm"
              className="w-full"
              disabled={streaming || !customInstruction}
              onClick={() => { handleAction(customInstruction); setCustomInstruction('') }}
            >
              {streaming ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...</> : 'Apply Instruction'}
            </Button>
          </div>

          {output && (
            <div className="space-y-2">
              <div className="text-xs text-[#a1a1aa] font-medium">
                {streaming ? 'Streaming...' : 'Generated Essay'}
              </div>
              <div className="bg-[#0a0a0a] rounded-md p-3 text-xs text-white font-mono leading-relaxed max-h-48 overflow-y-auto border border-[#1f1f1f] whitespace-pre-wrap">
                {output}
              </div>
              {!streaming && (
                <Button size="sm" className="w-full" onClick={() => onUseEssay(output)}>
                  Use This Essay
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
