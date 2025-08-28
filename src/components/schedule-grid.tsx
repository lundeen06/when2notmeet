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
  const [isLoading, setIsLoading] = useState(false)
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

  const handleMouseDown = (day: string, hour: number, minute: number) => {
    const slotKey = getSlotKey(day, hour, minute)
    const isCurrentlyBusy = busySlots.has(slotKey)
    
    setIsDragging(true)
    setDragMode(isCurrentlyBusy ? 'remove' : 'add')
    
    setBusySlots(prev => {
      const newSet = new Set(prev)
      if (isCurrentlyBusy) {
        newSet.delete(slotKey)
      } else {
        newSet.add(slotKey)
      }
      return newSet
    })
  }

  const handleMouseEnter = (day: string, hour: number, minute: number) => {
    if (!isDragging) return
    
    const slotKey = getSlotKey(day, hour, minute)
    setBusySlots(prev => {
      const newSet = new Set(prev)
      if (dragMode === 'add') {
        newSet.add(slotKey)
      } else {
        newSet.delete(slotKey)
      }
      return newSet
    })
  }

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseUp])

  const handleSave = async () => {
    setIsLoading(true)
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

      router.push(`/session/${sessionId}`)
    } catch (error) {
      console.error('Error saving schedule:', error)
      alert('Failed to save schedule. Please try again.')
    } finally {
      setIsLoading(false)
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
              gridTemplateColumns: `80px repeat(${selectedDays.length}, 1fr)`,
              minWidth: '600px',
              maxWidth: '1000px'
            }}
          >
            <div className="h-6"></div>
            {selectedDays.map((day) => (
              <div key={day} className="h-6 flex items-center justify-center font-medium text-black text-sm">
                {DAY_LABELS[day]}
              </div>
            ))}
            
            {filteredTimeSlots.map((timeSlot) => (
              <div key={timeSlot.value} className="contents">
                <div className="h-5 flex items-center text-xs text-gray-600 pr-1">
                  {timeSlot.label}
                </div>
                {selectedDays.map((day) => {
                  const slotKey = getSlotKey(day, timeSlot.hour, timeSlot.minute)
                  const isBusy = busySlots.has(slotKey)
                  
                  return (
                    <div
                      key={slotKey}
                      className={`h-5 border border-gray-200 cursor-pointer transition-colors ${
                        isBusy 
                          ? 'bg-red-500 hover:bg-red-600' 
                          : 'bg-white hover:bg-gray-50'
                      }`}
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
            className="border-black text-black hover:bg-gray-50"
          >
            Clear All
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-black text-white hover:bg-gray-800"
          >
            {isLoading ? 'Saving...' : 'Save Schedule'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}