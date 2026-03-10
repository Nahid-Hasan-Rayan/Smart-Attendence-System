// components/AdvancedFilter.tsx
'use client'

import { useState, useEffect } from 'react'
import { CalendarIcon, X } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils' // if you have a utils file for classnames
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface FilterOptions {
  dateRange?: { start: Date; end: Date }
  minPercentage?: number
  maxPercentage?: number
  statuses?: string[]
}

interface AdvancedFilterProps {
  onFilterChange: (filters: FilterOptions) => void
  initialFilters?: FilterOptions
}

const statusOptions = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'excused', label: 'Excused' },
]

export default function AdvancedFilter({ onFilterChange, initialFilters = {} }: AdvancedFilterProps) {
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({
    start: initialFilters.dateRange?.start,
    end: initialFilters.dateRange?.end,
  })
  const [percentageRange, setPercentageRange] = useState<[number, number]>([
    initialFilters.minPercentage ?? 0,
    initialFilters.maxPercentage ?? 100,
  ])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
    initialFilters.statuses ?? []
  )
  const [isOpen, setIsOpen] = useState(false)

  // Debounce filter changes to avoid too many requests
  useEffect(() => {
    const timer = setTimeout(() => {
      const filters: FilterOptions = {}
      if (dateRange.start && dateRange.end) {
        filters.dateRange = { start: dateRange.start, end: dateRange.end }
      }
      if (percentageRange[0] > 0 || percentageRange[1] < 100) {
        filters.minPercentage = percentageRange[0]
        filters.maxPercentage = percentageRange[1]
      }
      if (selectedStatuses.length > 0) {
        filters.statuses = selectedStatuses
      }
      onFilterChange(filters)
    }, 300) // debounce 300ms

    return () => clearTimeout(timer)
  }, [dateRange, percentageRange, selectedStatuses, onFilterChange])

  const clearFilters = () => {
    setDateRange({})
    setPercentageRange([0, 100])
    setSelectedStatuses([])
  }

  const hasActiveFilters = !!(dateRange.start || dateRange.end || percentageRange[0] > 0 || percentageRange[1] < 100 || selectedStatuses.length > 0)

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Date Range Picker */}
        <div>
          <Label className="text-sm font-medium">Date Range</Label>
          <div className="flex items-center gap-2 mt-1">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dateRange.start && !dateRange.end && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.start && dateRange.end ? (
                    `${format(dateRange.start, 'LLL dd, y')} - ${format(dateRange.end, 'LLL dd, y')}`
                  ) : (
                    'Select range'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{
                    from: dateRange.start,
                    to: dateRange.end,
                  }}
                  onSelect={(range) => {
                    setDateRange({ start: range?.from, end: range?.to })
                    if (range?.from && range?.to) setIsOpen(false)
                  }}
                  numberOfMonths={2}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Percentage Range Slider */}
        <div>
          <Label className="text-sm font-medium">Attendance % Range</Label>
          <div className="mt-2 px-2">
            <Slider
              min={0}
              max={100}
              step={1}
              value={percentageRange}
              onValueChange={(value) => setPercentageRange(value as [number, number])}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{percentageRange[0]}%</span>
              <span>{percentageRange[1]}%</span>
            </div>
          </div>
        </div>

        {/* Status Multi-select */}
        <div>
          <Label className="text-sm font-medium">Status</Label>
          <div className="mt-2 space-y-2">
            {statusOptions.map((status) => (
              <div key={status.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${status.value}`}
                  checked={selectedStatuses.includes(status.value)}
                  onCheckedChange={(checked) => {
                    setSelectedStatuses(prev =>
                      checked
                        ? [...prev, status.value]
                        : prev.filter(s => s !== status.value)
                    )
                  }}
                />
                <Label htmlFor={`status-${status.value}`} className="text-sm cursor-pointer">
                  {status.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}