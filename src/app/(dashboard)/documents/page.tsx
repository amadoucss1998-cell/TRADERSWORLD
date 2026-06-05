'use client'

import React, { useState } from 'react'
import { Upload, FileText, Trash2, Download, CheckCircle } from 'lucide-react'
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
}

const MOCK_FILES: UploadedFile[] = [
  { id: '1', name: 'John_Doe_CV.pdf', type: 'cv', size: '245 KB', uploaded_at: '2025-12-01', url: '#' },
  { id: '2', name: 'University_Transcript.pdf', type: 'transcript', size: '1.2 MB', uploaded_at: '2025-12-01', url: '#' },
  { id: '3', name: 'Recommendation_Prof_Williams.pdf', type: 'recommendation', size: '180 KB', uploaded_at: '2025-12-05', url: '#' },
]

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
  const [files, setFiles] = useState<UploadedFile[]>(MOCK_FILES)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)

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
    // Simulate upload
    const newFiles: UploadedFile[] = Array.from(fileList).map(f => ({
      id: crypto.randomUUID(),
      name: f.name,
      type: f.name.toLowerCase().includes('cv') || f.name.toLowerCase().includes('resume') ? 'cv' :
            f.name.toLowerCase().includes('transcript') ? 'transcript' :
            f.name.toLowerCase().includes('rec') || f.name.toLowerCase().includes('letter') ? 'recommendation' : 'other',
      size: `${(f.size / 1024).toFixed(0)} KB`,
      uploaded_at: new Date().toISOString().split('T')[0],
      url: '#',
    }))
    setTimeout(() => {
      setFiles(prev => [...prev, ...newFiles])
      setUploading(false)
    }, 1500)
  }

  function handleDelete(id: string) {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Documents</h1>
        <p className="text-[#a1a1aa] text-sm">Upload and manage your application documents</p>
      </div>

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
        <label>
          <Button variant="outline" disabled={uploading} asChild>
            <span>
              {uploading ? 'Uploading...' : 'Browse Files'}
            </span>
          </Button>
          <input
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.docx,.jpg,.png"
            onChange={e => e.target.files && handleFileUpload(e.target.files)}
          />
        </label>
        <p className="text-xs text-[#71717a] mt-3">
          Note: File storage requires Supabase Storage. Currently showing mock uploaded files.
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
                  <span className="text-xs text-[#71717a]">Uploaded {file.uploaded_at}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => window.open(file.url, '_blank')}>
                  <Download className="h-4 w-4" />
                </Button>
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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
