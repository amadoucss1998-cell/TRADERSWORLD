'use client'

import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Filters {
  degree_level: string
  field_of_study: string
  country: string
  deadline_range: string
}

interface FilterBarProps {
  filters: Filters
  onChange: (filters: Filters) => void
  onClear: () => void
}

export function FilterBar({ filters, onChange, onClear }: FilterBarProps) {
  const update = (key: keyof Filters, value: string) => {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <Select value={filters.degree_level} onValueChange={v => update('degree_level', v)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Degree Level" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Levels</SelectItem>
          <SelectItem value="high_school">High School</SelectItem>
          <SelectItem value="undergraduate">Undergraduate</SelectItem>
          <SelectItem value="masters">Masters</SelectItem>
          <SelectItem value="phd">PhD</SelectItem>
        </SelectContent>
      </Select>

      <Input
        placeholder="Field of study..."
        className="w-44"
        value={filters.field_of_study}
        onChange={e => update('field_of_study', e.target.value)}
      />

      <Input
        placeholder="Country..."
        className="w-36"
        value={filters.country}
        onChange={e => update('country', e.target.value)}
      />

      <Select value={filters.deadline_range} onValueChange={v => update('deadline_range', v)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Deadline" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any Deadline</SelectItem>
          <SelectItem value="30">Next 30 days</SelectItem>
          <SelectItem value="60">Next 60 days</SelectItem>
          <SelectItem value="90">Next 90 days</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="ghost" size="sm" onClick={onClear}>
        <X className="h-4 w-4" />
        Clear Filters
      </Button>
    </div>
  )
}
