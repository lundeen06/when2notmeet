'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
  const [currentMobileDay, setCurrentMobileDay] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  
  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const filteredTimeSlots = TIME_SLOTS.slice(startTime, endTime)
  const timeLabels = TIME_SLOTS.slice(startTime, endTime + 1)

  useEffect(() => {
    // Load existing schedule data if editing
    if (editScheduleId) {
      const fetchScheduleData = async () => {
        try {
          const response = await fetch(`/api/session/${sessionId}`)
          const sessionData = await response.json()
          const existingSchedule = sessionData.schedules.find((s: { id: string }) => s.id === editScheduleId)
          
          if (existingSchedule) {
            const existingSlots = new Set<string>()
            existingSchedule.busySlots.forEach((slot: { day: string; hour: number; minute: number }) => {
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

  const getDayIndex = useCallback((day: string) => selectedDays.indexOf(day), [selectedDays])
  const getTimeIndex = useCallback((hour: number, minute: number) => filteredTimeSlots.findIndex(slot => slot.hour === hour && slot.minute === minute), [filteredTimeSlots])

  const calculateBoxSelection = useCallback((start: {day: string, hour: number, minute: number}, end: {day: string, hour: number, minute: number}) => {
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
  }, [getDayIndex, getTimeIndex])

  const handleMouseDown = useCallback((day: string, hour: number, minute: number) => {
    const slotKey = getSlotKey(day, hour, minute)
    const isCurrentlyBusy = busySlots.has(slotKey)
    
    setIsDragging(true)
    setDragMode(isCurrentlyBusy ? 'remove' : 'add')
    setDragStart({ day, hour, minute })
    setDragEnd({ day, hour, minute })
    
    // Set initial preview
    const initialBox = calculateBoxSelection({ day, hour, minute }, { day, hour, minute })
    setPreviewSlots(initialBox)
  }, [busySlots, calculateBoxSelection])

  const handleMouseEnter = useCallback((day: string, hour: number, minute: number) => {
    if (!isDragging || !dragStart) return
    
    setDragEnd({ day, hour, minute })
    
    // Calculate box selection for preview
    const boxSlots = calculateBoxSelection(dragStart, { day, hour, minute })
    setPreviewSlots(boxSlots)
  }, [isDragging, dragStart, calculateBoxSelection])

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
          startTime,
          endTime,
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

  // Handle touch events for mobile
  const handleTouchStart = useCallback((day: string, hour: number, minute: number) => {
    if (!isMobile) return
    handleMouseDown(day, hour, minute)
  }, [isMobile, handleMouseDown])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !isDragging) return
    
    e.preventDefault()
    const touch = e.touches[0]
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement
    
    if (element && element.dataset && element.dataset.day && element.dataset.hour && element.dataset.minute) {
      const day = element.dataset.day
      const hour = parseInt(element.dataset.hour)
      const minute = parseInt(element.dataset.minute)
      handleMouseEnter(day, hour, minute)
    }
  }, [isMobile, isDragging, handleMouseEnter])

  if (isMobile) {
    const canGoPrev = currentMobileDay > 0
    const canGoNext = currentMobileDay < selectedDays.length - 1
    
    // Show only current day on mobile with navigation
    const mobileSelectedDays = [selectedDays[currentMobileDay]]
    
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-primary">
            Select Your Unavailable Times
          </CardTitle>
          <p className="text-xs text-gray-600">
            Tap and drag to mark times when you are busy (red = not available)
          </p>
          
          {/* Mobile Day Navigation */}
          <div className="flex items-center justify-between pt-2 border-t mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMobileDay(currentMobileDay - 1)}
              disabled={!canGoPrev}
              className="p-1"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-center">
              <div className="font-medium text-primary text-sm">
                {DAY_LABELS[selectedDays[currentMobileDay]]}
              </div>
              <div className="text-xs text-gray-500">
                {currentMobileDay + 1} of {selectedDays.length}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMobileDay(currentMobileDay + 1)}
              disabled={!canGoNext}
              className="p-1"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-2 overflow-visible">
          <div className="overflow-visible">
            <div className="flex overflow-visible">
              {/* Time labels column */}
              <div className="flex flex-col w-12 mr-1 relative overflow-visible">
                <div className="h-4"></div>
                <div className="relative overflow-visible" style={{ height: `${filteredTimeSlots.length * 20}px` }}>
                  {timeLabels.map((timeLabel, index) => (
                    <div
                      key={timeLabel.value}
                      className="absolute text-xs text-gray-600 -translate-y-1/2 z-20"
                      style={{ top: `${(index / (timeLabels.length - 1)) * 100}%` }}
                    >
                      <span className="text-xs leading-none bg-white px-1">
                        {timeLabel.hour === 0 ? '12' : timeLabel.hour > 12 ? timeLabel.hour - 12 : timeLabel.hour}
                        :{timeLabel.minute === 0 ? '00' : '30'}
                        {timeLabel.hour < 12 ? 'a' : 'p'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Schedule grid */}
              <div 
                ref={gridRef}
                className="grid gap-px select-none flex-1"
                style={{
                  gridTemplateColumns: '1fr',
                  minWidth: '200px',
                  maxWidth: '280px'
                }}
                onTouchMove={handleTouchMove}
              >
                <div className="h-4 flex items-center justify-center font-medium text-primary text-sm">
                  {DAY_LABELS[selectedDays[currentMobileDay]]}
                </div>
                
                {filteredTimeSlots.map((timeSlot) => {
                  const day = mobileSelectedDays[0]
                  const slotKey = getSlotKey(day, timeSlot.hour, timeSlot.minute)
                  const isBusy = busySlots.has(slotKey)
                  const isInPreview = previewSlots.has(slotKey) && isDragging
                  
                  let className = 'h-5 border border-gray-200 cursor-pointer transition-colors touch-manipulation '
                  
                  if (isInPreview) {
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
                    className += 'bg-red-500 active:bg-red-600'
                  } else {
                    className += 'bg-white active:bg-gray-100'
                  }
                  
                  return (
                    <div
                      key={slotKey}
                      className={className}
                      data-day={day}
                      data-hour={timeSlot.hour}
                      data-minute={timeSlot.minute}
                      onTouchStart={() => handleTouchStart(day, timeSlot.hour, timeSlot.minute)}
                      onMouseDown={() => handleMouseDown(day, timeSlot.hour, timeSlot.minute)}
                      onMouseEnter={() => handleMouseEnter(day, timeSlot.hour, timeSlot.minute)}
                    />
                  )
                })}
              </div>
            </div>
          </div>
          
          <div className="mt-12 flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => setBusySlots(new Set())}
              className="border-primary text-primary hover:bg-gray-50 text-sm py-1.5"
            >
              Clear All
            </Button>
            
            <Button
              onClick={handleSave}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm py-1.5"
            >
              Save Schedule
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Desktop version
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl text-primary">
          Select Your Unavailable Times
        </CardTitle>
        <p className="text-sm text-gray-600">
          Click and drag to mark times when you are busy (red = not available)
        </p>
      </CardHeader>
      <CardContent className="overflow-visible pb-12">
        <div className="overflow-visible">
          <div className="flex overflow-visible">
            {/* Time labels column */}
            <div className="flex flex-col w-16 mr-2 relative overflow-visible">
              <div className="h-6"></div>
              <div className="relative overflow-visible" style={{ height: `${filteredTimeSlots.length * 22}px` }}>
                {timeLabels.map((timeLabel, index) => (
                  <div
                    key={timeLabel.value}
                    className="absolute text-xs text-gray-600 -translate-y-1/2 z-20"
                    style={{ top: `${(index / (timeLabels.length - 1)) * 100}%` }}
                  >
                    <span className="text-xs leading-none bg-white px-1">{timeLabel.label}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Schedule grid */}
            <div 
              ref={gridRef}
              className="grid gap-0.5 select-none flex-1"
              style={{
                gridTemplateColumns: `repeat(${selectedDays.length}, minmax(80px, 1fr))`,
                minWidth: selectedDays.length <= 5 ? '300px' : '500px',
                maxWidth: `${Math.min(1200, selectedDays.length * 320)}px`
              }}
            >
              {selectedDays.map((day) => (
                <div key={day} className="h-6 flex items-center justify-center font-medium text-primary text-xs sm:text-sm">
                  {DAY_LABELS[day]}
                </div>
              ))}

              {filteredTimeSlots.map((timeSlot) => (
                <div key={timeSlot.value} className="contents">
                  {selectedDays.map((day) => {
                    const slotKey = getSlotKey(day, timeSlot.hour, timeSlot.minute)
                    const isBusy = busySlots.has(slotKey)
                    const isInPreview = previewSlots.has(slotKey) && isDragging
                    
                    let className = 'h-5 border border-gray-200 cursor-pointer transition-colors '
                    
                    if (isInPreview) {
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
        </div>
        
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between">
          <Button
            variant="outline"
            onClick={() => setBusySlots(new Set())}
            className="border-primary text-primary hover:bg-gray-50 cursor-pointer"
          >
            Clear All
          </Button>
          
          <Button
            onClick={handleSave}
            className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
          >
            Save Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}