'use client'

import React, { useState, useRef } from 'react'
import { Upload, FileText, Trash2, Download, CheckCircle, Sparkles, X, Copy, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface UploadedFile {
  id: string
  name: string
  type: 'cv' | 'transcript' | 'recommendation' | 'other'
  size: string
  uploaded_at: string
  url: string
  objectUrl?: string
}

const TYPE_COLORS: Record<string, 'success' | 'warning' | 'secondary' | 'default'> = {
  cv: 'success',
  transcript: 'warning',
  recommendation: 'default',
  other: 'secondary',
}

const DOCUMENT_TYPES = [
  { key: 'cv', label: 'CV / Resume', desc: 'Your academic and professional CV' },
  { key: 'transcript', label: 'Transcripts', desc: 'Official academic transcripts' },
  { key: 'recommendation', label: 'Recommendation Letters', desc: 'Letters from professors or employers' },
  { key: 'other', label: 'Other Documents', desc: 'Personal statement, certificates, etc.' },
]

export default function DocumentsPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)

  // CV Generator state
  const [cvGenerating, setCvGenerating] = useState(false)
  const [cvText, setCvText] = useState('')
  const [showCvModal, setShowCvModal] = useState(false)
  const [copied, setCopied] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleGenerateCV() {
    setCvGenerating(true)
    setShowCvModal(true)
    setCvText('')
    try {
      const profileRes = await fetch('/api/profile')
      const profileData = await profileRes.json()
      const res = await fetch('/api/cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: profileData.profile || {}, target_field: 'scholarship' }),
      })
      if (!res.ok || !res.body) throw new Error('Failed to generate CV')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      while (!done) {
        const { value, done: d } = await reader.read()
        done = d
        if (value) setCvText(prev => prev + decoder.decode(value))
      }
    } catch {
      setCvText('Failed to generate CV. Please ensure your profile is complete and try again.')
    } finally {
      setCvGenerating(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(cvText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleDownloadCV() {
    const blob = new Blob([cvText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ScholarPath_CV.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave() {
    setDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    handleFileUpload(e.dataTransfer.files)
  }

  function handleFileUpload(fileList: FileList) {
    setUploading(true)
    const newFiles: UploadedFile[] = Array.from(fileList).map(f => ({
      id: crypto.randomUUID(),
      name: f.name,
      type: f.name.toLowerCase().includes('cv') || f.name.toLowerCase().includes('resume') ? 'cv' :
            f.name.toLowerCase().includes('transcript') ? 'transcript' :
            f.name.toLowerCase().includes('rec') || f.name.toLowerCase().includes('letter') ? 'recommendation' : 'other',
      size: `${(f.size / 1024).toFixed(0)} KB`,
      uploaded_at: new Date().toISOString().split('T')[0],
      url: '',
      objectUrl: URL.createObjectURL(f),
    }))
    setTimeout(() => {
      setFiles(prev => [...prev, ...newFiles])
      setUploading(false)
    }, 500)
  }

  function handleDelete(id: string) {
    setFiles(prev => {
      const f = prev.find(x => x.id === id)
      if (f?.objectUrl) URL.revokeObjectURL(f.objectUrl)
      return prev.filter(x => x.id !== id)
    })
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Documents</h1>
        <p className="text-[#a1a1aa] text-sm">Generate your CV with AI and manage your application documents</p>
      </div>

      {/* CV Generator Section */}
      <div className="mb-8 p-6 rounded-xl bg-[#111111] border border-[#1f1f1f]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-white font-semibold mb-1">AI CV Generator</h2>
            <p className="text-sm text-[#a1a1aa]">Generate a professional scholarship CV based on your profile.</p>
          </div>
          <Button onClick={handleGenerateCV} disabled={cvGenerating} className="gap-2">
            {cvGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate CV with AI
          </Button>
        </div>
      </div>

      {/* CV Modal */}
      {showCvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCvModal(false)} />
          <div className="relative w-full max-w-2xl bg-[#111111] border border-[#2a2a2a] rounded-2xl p-6 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Generated CV</h3>
              <button onClick={() => setShowCvModal(false)} className="text-[#71717a] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-[#0a0a0a] rounded-lg p-4 mb-4 border border-[#1f1f1f]">
              {cvGenerating && !cvText && (
                <div className="flex items-center gap-2 text-[#71717a]">
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating your CV...
                </div>
              )}
              <pre className="text-sm text-[#a1a1aa] whitespace-pre-wrap font-mono">{cvText}</pre>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCopy} disabled={!cvText} className="gap-2">
                <Copy className="h-4 w-4" /> {copied ? 'Copied!' : 'Copy to Clipboard'}
              </Button>
              <Button onClick={handleDownloadCV} disabled={!cvText || cvGenerating} className="gap-2">
                <Download className="h-4 w-4" /> Download as .txt
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-10 text-center mb-8 transition-colors ${
          dragOver ? 'border-green-500 bg-green-600/5' : 'border-[#1f1f1f] hover:border-[#2a2a2a]'
        }`}
      >
        <Upload className="h-10 w-10 text-[#71717a] mx-auto mb-4" />
        <p className="text-white font-medium mb-1">Drag & drop files here</p>
        <p className="text-sm text-[#a1a1aa] mb-4">Supports PDF, DOCX, JPG, PNG up to 10MB</p>
        <Button variant="outline" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
          {uploading ? 'Uploading...' : 'Browse Files'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.docx,.jpg,.png"
          onChange={e => e.target.files && handleFileUpload(e.target.files)}
        />
        <p className="text-xs text-[#71717a] mt-3">
          Files stored locally in your browser session. For permanent storage, connect Supabase Storage.
        </p>
      </div>

      {/* Document type checklist */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {DOCUMENT_TYPES.map(dt => {
          const hasFile = files.some(f => f.type === dt.key)
          return (
            <Card key={dt.key} className={hasFile ? 'border-green-600/30' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {hasFile ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-[#1f1f1f]" />
                  )}
                  <span className="text-sm font-medium text-white">{dt.label}</span>
                </div>
                <p className="text-xs text-[#71717a]">{dt.desc}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Files list */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-4">Uploaded Files ({files.length})</h2>
        <div className="space-y-2">
          {files.map(file => (
            <div key={file.id} className="flex items-center gap-4 p-4 rounded-lg bg-[#111111] border border-[#1f1f1f]">
              <FileText className="h-8 w-8 text-[#71717a] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{file.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant={TYPE_COLORS[file.type] || 'secondary'} className="text-xs">{file.type}</Badge>
                  <span className="text-xs text-[#71717a]">{file.size}</span>
                  <span className="text-xs text-[#71717a]">Added {file.uploaded_at}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {file.objectUrl && (
                  <Button variant="ghost" size="icon" asChild>
                    <a href={file.objectUrl} download={file.name}>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => handleDelete(file.id)}>
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            </div>
          ))}
          {files.length === 0 && (
            <div className="text-center py-10 text-[#71717a]">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No documents uploaded yet</p>
              <p className="text-xs mt-1">Files added this session will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
