'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { v4 as uuidv4 } from 'uuid'

const DAYS = [
  { id: 'monday', label: 'Monday', default: true },
  { id: 'tuesday', label: 'Tuesday', default: true },
  { id: 'wednesday', label: 'Wednesday', default: true },
  { id: 'thursday', label: 'Thursday', default: true },
  { id: 'friday', label: 'Friday', default: true },
  { id: 'saturday', label: 'Saturday', default: false },
  { id: 'sunday', label: 'Sunday', default: false },
]

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  const period = hour < 12 ? 'AM' : 'PM'
  
  return {
    value: i * 2, // Convert to 30-minute slot index for compatibility
    label: `${displayHour}:00 ${period}`,
    hour,
    minute: 0
  }
})

export function ScheduleSetup() {
  const [eventTitle, setEventTitle] = useState('')
  const [name, setName] = useState('')
  const [selectedDays, setSelectedDays] = useState<string[]>(
    DAYS.filter(day => day.default).map(day => day.id)
  )
  const [sessionDays, setSessionDays] = useState<string[] | null>(null)
  const [sessionEventTitle, setSessionEventTitle] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<number>(16) // 8:00 AM (8 * 2 = 16)
  const [endTime, setEndTime] = useState<number>(36) // 6:00 PM (18 * 2 = 36)
  const [sessionTimeRange, setSessionTimeRange] = useState<{start: number, end: number} | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const joinSessionId = searchParams.get('join')
  const prefilledName = searchParams.get('name')

  useEffect(() => {
    const fetchSessionData = async () => {
      if (!joinSessionId) return
      
      setError(null)
      
      try {
        const response = await fetch(`/api/session/${joinSessionId}`)
        if (!response.ok) {
          throw new Error('Session not found')
        }
        
        const sessionData = await response.json()
        if (sessionData.schedules && sessionData.schedules.length > 0) {
          // Get event title from the first schedule (all should have the same title for the session)
          const firstSchedule = sessionData.schedules[0]
          if (firstSchedule.eventTitle) {
            setSessionEventTitle(firstSchedule.eventTitle)
            setEventTitle(firstSchedule.eventTitle)
          }
          
          // Get all unique days from existing schedules
          const allDaysSet = new Set<string>()
          sessionData.schedules.forEach((schedule: { selectedDays: string[] }) => {
            schedule.selectedDays.forEach((day: string) => allDaysSet.add(day))
          })
          const existingDays = Array.from(allDaysSet)
          setSessionDays(existingDays)
          setSelectedDays(existingDays)
          
          // For now, use default time range - we can enhance this later to store time range in session
          setSessionTimeRange({ start: 16, end: 36 })
          setStartTime(16)
          setEndTime(36)
        } else {
          // If no schedules exist yet, allow day selection
          setSessionDays(null)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch session')
        setSessionDays(null)
      }
    }

    fetchSessionData()
  }, [joinSessionId])

  useEffect(() => {
    // Pre-fill name if provided in URL (from sign-in flow)
    if (prefilledName) {
      setName(prefilledName)
    }
  }, [prefilledName])

  const handleDayToggle = (dayId: string) => {
    setSelectedDays(prev =>
      prev.includes(dayId)
        ? prev.filter(id => id !== dayId)
        : [...prev, dayId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || selectedDays.length === 0 || (!eventTitle.trim() && !joinSessionId)) return

    const sessionId = joinSessionId || uuidv4()
    
    setTimeout(() => {
      router.push(`/schedule/${sessionId}?name=${encodeURIComponent(name)}&days=${selectedDays.join(',')}&startTime=${startTime}&endTime=${endTime}&eventTitle=${encodeURIComponent(eventTitle)}`)
    }, 50)
  }

  return (
    <Card className="py-2">
      <CardHeader>
        <CardTitle className="text-xl text-primary pt-4">
          {joinSessionId ? 'Join Schedule' : 'Create Your Event'} 
        </CardTitle>
        {joinSessionId && (
          <p className="text-sm text-gray-600">
            You&apos;re joining an existing scheduling session
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}
      </CardHeader>
      <CardContent className="pb-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {!joinSessionId && (
            <div>
              <label htmlFor="eventTitle" className="block text-sm font-medium text-primary mb-2">
                Event Title
              </label>
              <Input
                id="eventTitle"
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="e.g., Weekly Team Meeting, Birthday Party Planning"
                className="bg-white border-gray-300 text-primary"
                required
              />
            </div>
          )}
          
          {joinSessionId && sessionEventTitle && (
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Event
              </label>
              <div className="p-3 bg-gray-50 border border-gray-300 rounded-md">
                <span className="text-primary font-medium">{sessionEventTitle}</span>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-primary mb-2">
              Your Name
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="bg-white border-gray-300" style={{ color: 'hsl(var(--foreground))' }}
              required
            />
          </div>
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'hsl(var(--foreground))' }}>
                {joinSessionId && sessionDays ? 'Session Days' : 'Select Days'}
              </label>
              <div className="space-y-2">
                {DAYS.map((day) => {
                  const isSelected = selectedDays.includes(day.id)
                  const isDisabled = joinSessionId && sessionDays !== null
                  
                  return (
                    <div key={day.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={day.id}
                        checked={isSelected}
                        onCheckedChange={() => !isDisabled && handleDayToggle(day.id)}
                        disabled={isDisabled || undefined}
                      />
                      <label
                        htmlFor={day.id}
                        className={`text-sm font-medium leading-none ${
                          isDisabled 
                            ? 'cursor-not-allowed opacity-70' 
                            : 'peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                        } text-primary`}
                      >
                        {day.label}
                      </label>
                    </div>
                  )
                })}
              </div>
              {joinSessionId && sessionDays && (
                <p className="text-xs text-gray-500 mt-2">
                  Days are set by the existing session
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Start Time
                </label>
                <Select
                  value={startTime.toString()}
                  onValueChange={(value) => setStartTime(parseInt(value))}
                  disabled={!!(joinSessionId && sessionTimeRange)}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.filter(time => time.value < endTime).map((time) => (
                      <SelectItem key={time.value} value={time.value.toString()}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  End Time
                </label>
                <Select
                  value={endTime.toString()}
                  onValueChange={(value) => setEndTime(parseInt(value))}
                  disabled={!!(joinSessionId && sessionTimeRange)}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.filter(time => time.value > startTime).map((time) => (
                      <SelectItem key={time.value} value={time.value.toString()}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {joinSessionId && sessionTimeRange && (
                <p className="text-xs text-gray-500 col-span-2">
                  Time range is set by the existing session
                </p>
              )}
            </div>

          <Button
            type="submit"
            disabled={false}
            // disabled={!name.trim() || selectedDays.length === 0 || (!eventTitle.trim() && !joinSessionId)}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Create Event
          </Button>
            
        </form>
      </CardContent>
    </Card>
  )
}