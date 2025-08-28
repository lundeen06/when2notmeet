'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

interface ScheduleGridProps {
  sessionId: string
  userName: string
  selectedDays: string[]
  startTime: number
  endTime: number
  editScheduleId?: string | null
}

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2)
  const minute = (i % 2) * 30
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  const period = hour < 12 ? 'AM' : 'PM'
  const minuteStr = minute === 0 ? '00' : '30'
  
  return {
    hour,
    minute,
    label: `${displayHour}:${minuteStr} ${period}`,
    value: i
  }
})

const DAY_LABELS: { [key: string]: string } = {
  monday: 'Mon',
  tuesday: 'Tue', 
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun'
}

export function ScheduleGrid({ sessionId, userName, selectedDays, startTime, endTime, editScheduleId }: ScheduleGridProps) {
  const [busySlots, setBusySlots] = useState<Set<string>>(new Set())
  const [isDragging, setIsDragging] = useState(false)
  const [dragMode, setDragMode] = useState<'add' | 'remove'>('add')
  const [dragStart, setDragStart] = useState<{day: string, hour: number, minute: number} | null>(null)
  const [dragEnd, setDragEnd] = useState<{day: string, hour: number, minute: number} | null>(null)
  const [previewSlots, setPreviewSlots] = useState<Set<string>>(new Set())
  const gridRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const filteredTimeSlots = TIME_SLOTS.slice(startTime, endTime + 1)

  useEffect(() => {
    // Load existing schedule data if editing
    if (editScheduleId) {
      const fetchScheduleData = async () => {
        try {
          const response = await fetch(`/api/session/${sessionId}`)
          const sessionData = await response.json()
          const existingSchedule = sessionData.schedules.find((s: any) => s.id === editScheduleId)
          
          if (existingSchedule) {
            const existingSlots = new Set<string>()
            existingSchedule.busySlots.forEach((slot: any) => {
              existingSlots.add(getSlotKey(slot.day, slot.hour, slot.minute))
            })
            setBusySlots(existingSlots)
          }
        } catch (error) {
          console.error('Error loading existing schedule:', error)
        }
      }
      
      fetchScheduleData()
    }
  }, [editScheduleId, sessionId])

  const getSlotKey = (day: string, hour: number, minute: number) => `${day}-${hour}-${minute}`

  const getDayIndex = (day: string) => selectedDays.indexOf(day)
  const getTimeIndex = (hour: number, minute: number) => filteredTimeSlots.findIndex(slot => slot.hour === hour && slot.minute === minute)

  const calculateBoxSelection = (start: {day: string, hour: number, minute: number}, end: {day: string, hour: number, minute: number}) => {
    const startDayIndex = getDayIndex(start.day)
    const endDayIndex = getDayIndex(end.day)
    const startTimeIndex = getTimeIndex(start.hour, start.minute)
    const endTimeIndex = getTimeIndex(end.hour, end.minute)

    const minDayIndex = Math.min(startDayIndex, endDayIndex)
    const maxDayIndex = Math.max(startDayIndex, endDayIndex)
    const minTimeIndex = Math.min(startTimeIndex, endTimeIndex)
    const maxTimeIndex = Math.max(startTimeIndex, endTimeIndex)

    const slots = new Set<string>()
    for (let dayIndex = minDayIndex; dayIndex <= maxDayIndex; dayIndex++) {
      for (let timeIndex = minTimeIndex; timeIndex <= maxTimeIndex; timeIndex++) {
        if (dayIndex >= 0 && dayIndex < selectedDays.length && timeIndex >= 0 && timeIndex < filteredTimeSlots.length) {
          const dayName = selectedDays[dayIndex]
          const timeSlot = filteredTimeSlots[timeIndex]
          slots.add(getSlotKey(dayName, timeSlot.hour, timeSlot.minute))
        }
      }
    }
    return slots
  }

  const handleMouseDown = (day: string, hour: number, minute: number) => {
    const slotKey = getSlotKey(day, hour, minute)
    const isCurrentlyBusy = busySlots.has(slotKey)
    
    setIsDragging(true)
    setDragMode(isCurrentlyBusy ? 'remove' : 'add')
    setDragStart({ day, hour, minute })
    setDragEnd({ day, hour, minute })
    
    // Set initial preview
    const initialBox = calculateBoxSelection({ day, hour, minute }, { day, hour, minute })
    setPreviewSlots(initialBox)
  }

  const handleMouseEnter = (day: string, hour: number, minute: number) => {
    if (!isDragging || !dragStart) return
    
    setDragEnd({ day, hour, minute })
    
    // Calculate box selection for preview
    const boxSlots = calculateBoxSelection(dragStart, { day, hour, minute })
    setPreviewSlots(boxSlots)
  }

  const handleMouseUp = useCallback(() => {
    if (isDragging && dragStart && dragEnd && previewSlots.size > 0) {
      // Apply the box selection
      setBusySlots(prev => {
        const newSet = new Set(prev)
        previewSlots.forEach(slotKey => {
          if (dragMode === 'add') {
            newSet.add(slotKey)
          } else {
            newSet.delete(slotKey)
          }
        })
        return newSet
      })
    }
    
    setIsDragging(false)
    setDragStart(null)
    setDragEnd(null)
    setPreviewSlots(new Set())
  }, [isDragging, dragStart, dragEnd, previewSlots, dragMode])

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseUp])

  const handleSave = async () => {
    try {
      const busySlotsArray = Array.from(busySlots).map(slotKey => {
        const [day, hour, minute] = slotKey.split('-')
        return { day, hour: parseInt(hour), minute: parseInt(minute) }
      })

      // Get event title from URL params if available
      const urlParams = new URLSearchParams(window.location.search)
      const eventTitle = urlParams.get('eventTitle')
      
      const response = await fetch('/api/schedules', {
        method: editScheduleId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduleId: editScheduleId,
          sessionId,
          name: userName,
          eventTitle,
          selectedDays,
          busySlots: busySlotsArray,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save schedule')
      }

      setTimeout(() => {
        router.push(`/session/${sessionId}`)
      }, 50)
    } catch (error) {
      console.error('Error saving schedule:', error)
      alert('Failed to save schedule. Please try again.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl text-black">
          Select Your Unavailable Times
        </CardTitle>
        <p className="text-sm text-gray-600">
          Click and drag to mark times when you are busy (red = not available)
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div 
            ref={gridRef}
            className="grid gap-0.5 select-none mx-auto"
            style={{
              gridTemplateColumns: `60px repeat(${selectedDays.length}, minmax(80px, 1fr))`,
              minWidth: selectedDays.length <= 5 ? '300px' : '500px',
              maxWidth: `${Math.min(1200, 60 + selectedDays.length * 320)}px`
            }}
          >
            <div className="h-6"></div>
            {selectedDays.map((day) => (
              <div key={day} className="h-6 flex items-center justify-center font-medium text-black text-xs sm:text-sm">
                {DAY_LABELS[day]}
              </div>
            ))}
            
            {filteredTimeSlots.map((timeSlot) => (
              <div key={timeSlot.value} className="contents">
                <div className="h-5 flex items-center text-xs text-gray-600 pr-1">
                  <span className="hidden sm:inline">{timeSlot.label}</span>
                  <span className="sm:hidden text-xs">
                    {timeSlot.hour === 0 ? '12' : timeSlot.hour > 12 ? timeSlot.hour - 12 : timeSlot.hour}
                    {timeSlot.hour < 12 ? 'a' : 'p'}
                  </span>
                </div>
                {selectedDays.map((day) => {
                  const slotKey = getSlotKey(day, timeSlot.hour, timeSlot.minute)
                  const isBusy = busySlots.has(slotKey)
                  const isInPreview = previewSlots.has(slotKey) && isDragging
                  
                  let className = 'h-5 border border-gray-200 cursor-pointer transition-colors '
                  
                  if (isInPreview) {
                    // Show preview - different state than current
                    const willBeAdded = dragMode === 'add' && !isBusy
                    const willBeRemoved = dragMode === 'remove' && isBusy
                    
                    if (willBeAdded) {
                      className += 'bg-red-400 border-red-600 border-2' 
                    } else if (willBeRemoved) {
                      className += 'bg-gray-300 border-gray-500 border-2'
                    } else if (isBusy) {
                      className += 'bg-red-500'
                    } else {
                      className += 'bg-white'
                    }
                  } else if (isBusy) {
                    className += 'bg-red-500 hover:bg-red-600'
                  } else {
                    className += 'bg-white hover:bg-gray-50'
                  }
                  
                  return (
                    <div
                      key={slotKey}
                      className={className}
                      onMouseDown={() => handleMouseDown(day, timeSlot.hour, timeSlot.minute)}
                      onMouseEnter={() => handleMouseEnter(day, timeSlot.hour, timeSlot.minute)}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-between">
          <Button
            variant="outline"
            onClick={() => setBusySlots(new Set())}
            className="border-black text-black hover:bg-gray-50 cursor-pointer"
          >
            Clear All
          </Button>
          
          <Button
            onClick={handleSave}
            className="bg-black text-white hover:bg-gray-800 cursor-pointer"
          >
            Save Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}