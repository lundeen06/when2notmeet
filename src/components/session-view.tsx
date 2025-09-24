'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'

interface BusySlot {
  day: string
  hour: number
  minute?: number
}

interface Schedule {
  id: string
  name: string
  selectedDays: string[]
  busySlots: BusySlot[]
  createdAt: string
  startTime?: number
  endTime?: number
  eventTitle?: string
}

interface SessionData {
  sessionId: string
  schedules: Schedule[]
}

interface SessionViewProps {
  sessionId: string
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

export function SessionView({ sessionId }: SessionViewProps) {
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hoveredSlot, setHoveredSlot] = useState<{day: string, hour: number, minute: number} | null>(null)
  const [eventTitle, setEventTitle] = useState<string | null>(null)
  const [signInName, setSignInName] = useState('')
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [isLinkCopied, setIsLinkCopied] = useState(false)
  const router = useRouter()

  // Get time range from first schedule, fallback to defaults
  const firstSchedule = sessionData?.schedules?.[0]
  const startTime = firstSchedule?.startTime ?? 16 // 8:00 AM
  const endTime = firstSchedule?.endTime ?? 36 // 6:00 PM
  const filteredTimeSlots = TIME_SLOTS.slice(startTime, endTime)
  const timeLabels = TIME_SLOTS.slice(startTime, endTime + 1)

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const response = await fetch(`/api/session/${sessionId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch session data')
        }
        const data = await response.json()
        setSessionData(data)
        
        // Set event title from first schedule if available
        if (data.schedules && data.schedules.length > 0 && data.schedules[0].eventTitle) {
          setEventTitle(data.schedules[0].eventTitle)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    fetchSessionData()
  }, [sessionId])

  const joinSchedule = () => {
    setTimeout(() => {
      router.push(`/?join=${sessionId}`)
    }, 50)
  }

  const handleSignIn = () => {
    if (!signInName.trim()) return
    
    // Check if user already has a schedule in this session
    const existingSchedule = sessionData?.schedules.find(
      schedule => schedule.name.toLowerCase() === signInName.trim().toLowerCase()
    )
    
    
    setTimeout(() => {
      if (existingSchedule) {
        // Navigate to edit existing schedule
        router.push(`/schedule/${sessionId}?name=${encodeURIComponent(signInName)}&edit=${existingSchedule.id}&days=${existingSchedule.selectedDays.join(',')}&startTime=${startTime}&endTime=${endTime}&eventTitle=${encodeURIComponent(eventTitle || '')}`)
      } else {
        // Get session data to create new schedule with existing session settings
        const allDaysSet = new Set<string>()
        sessionData?.schedules.forEach(schedule => {
          schedule.selectedDays.forEach(day => allDaysSet.add(day))
        })
        const sessionDays = Array.from(allDaysSet).sort((a, b) => {
          const order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
          return order.indexOf(a) - order.indexOf(b)
        })
        
        // Navigate directly to scheduling page for new user
        router.push(`/schedule/${sessionId}?name=${encodeURIComponent(signInName)}&days=${sessionDays.join(',')}&startTime=${startTime}&endTime=${endTime}&eventTitle=${encodeURIComponent(eventTitle || '')}`)
      }
    }, 50)
    
    setIsSignInOpen(false)
  }

  const getOverlapIntensity = (day: string, hour: number, minute: number) => {
    if (!sessionData || sessionData.schedules.length === 0) return 0
    
    const totalParticipants = sessionData.schedules.length
    const busyCount = sessionData.schedules.filter(schedule => 
      schedule.busySlots.some(slot => 
        slot.day === day && 
        slot.hour === hour && 
        (slot.minute === minute || (slot.minute === undefined && minute === 0))
      )
    ).length

    return busyCount / totalParticipants
  }

  const getAvailablePeople = (day: string, hour: number, minute: number) => {
    if (!sessionData || sessionData.schedules.length === 0) return []
    
    return sessionData.schedules.filter(schedule => 
      !schedule.busySlots.some(slot => 
        slot.day === day && 
        slot.hour === hour && 
        (slot.minute === minute || (slot.minute === undefined && minute === 0))
      )
    ).map(schedule => schedule.name)
  }

  const getOverlapColor = (intensity: number) => {
    // Intensity represents how many people are busy (0 = nobody busy, 1 = everyone busy)
    // We want to show availability, so invert the logic
    if (intensity === 0) return 'bg-green-500'    // Everyone available - dark green
    if (intensity <= 0.3) return 'bg-green-400'   // Most available - medium green  
    if (intensity <= 0.6) return 'bg-green-300'   // Some available - lighter green
    if (intensity <= 0.8) return 'bg-green-200'   // Few available - light green
    return 'white'  // Nobody available - very light green
  }

  const getAllDays = () => {
    if (!sessionData) return []
    const allDaysSet = new Set<string>()
    sessionData.schedules.forEach(schedule => {
      schedule.selectedDays.forEach(day => allDaysSet.add(day))
    })
    return Array.from(allDaysSet).sort((a, b) => {
      const order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      return order.indexOf(a) - order.indexOf(b)
    })
  }

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/session/${sessionId}` : ''

  const copyToClipboard = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl)
        setIsLinkCopied(true)
        setTimeout(() => {
          setIsLinkCopied(false)
        }, 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-4">Error: {error}</div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!sessionData || sessionData.schedules.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg text-gray-600 mb-4">No schedules found for this session</div>
          <Button onClick={joinSchedule} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Join This Schedule
          </Button>
        </div>
      </div>
    )
  }

  const allDays = getAllDays()

  return (
    <div className="space-y-6">
      {eventTitle && (
        <div className="text-center pt-6">
          <h2 className="text-2xl font-bold text-primary mb-2">{eventTitle}</h2>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-primary">
            {sessionData.schedules.length} Participant{sessionData.schedules.length !== 1 ? 's' : ''}
          </h3>
          <div className="text-sm text-gray-600 mt-1">
            {sessionData.schedules.map(schedule => schedule.name).join(', ')}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={copyToClipboard}
            variant={isLinkCopied ? "default" : "outline"}
            className={isLinkCopied
              ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer min-w-[140px]"
              : "border-primary text-primary hover:bg-gray-50 cursor-pointer min-w-[140px]"
            }
          >
            {isLinkCopied ? "Link Copied! ✓" : "Copy Share Link"}
          </Button>
          
          <Dialog open={isSignInOpen} onOpenChange={setIsSignInOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
                Join / Edit Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Join / Edit Schedule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label htmlFor="signin-name" className="block text-sm font-medium text-primary mb-2">
                    Your Name
                  </label>
                  <Input
                    id="signin-name"
                    type="text"
                    value={signInName}
                    onChange={(e) => setSignInName(e.target.value)}
                    placeholder="Enter your name"
                    className="bg-white border-gray-300 text-primary"
                    onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsSignInOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSignIn}
                    disabled={!signInName.trim()}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-primary">Group Availability  t(-_-t)</CardTitle>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500"></div>
              <span>Everyone available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-300"></div>
              <span>Most available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-200"></div>
              <span>Few available</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-visible pb-8">
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
                className="grid gap-0.5 select-none flex-1"
                style={{
                  gridTemplateColumns: `repeat(${allDays.length}, minmax(80px, 1fr))`,
                  minWidth: allDays.length <= 5 ? '300px' : '500px',
                  maxWidth: `${Math.min(1200, allDays.length * 320)}px`
                }}
              >
                {allDays.map((day) => (
                  <div key={day} className="h-6 flex items-center justify-center font-medium text-primary text-xs sm:text-sm">
                    {DAY_LABELS[day]}
                  </div>
                ))}

                {filteredTimeSlots.map((timeSlot) => (
                  <div key={timeSlot.value} className="contents">
                    {allDays.map((day) => {
                      const intensity = getOverlapIntensity(day, timeSlot.hour, timeSlot.minute)
                      const colorClass = getOverlapColor(intensity)
                      
                      return (
                        <div
                          key={`${day}-${timeSlot.hour}-${timeSlot.minute}`}
                          className={`h-5 border border-gray-200 ${colorClass} cursor-pointer transition-opacity hover:opacity-80`}
                          onMouseEnter={() => setHoveredSlot({day, hour: timeSlot.hour, minute: timeSlot.minute})}
                          onMouseLeave={() => setHoveredSlot(null)}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {hoveredSlot && (
        <Card className="mt-2 bg-gray-50 py-2">
          <CardContent className="pt-2 pb-2">
            <div className="text-sm">
              <div className="font-medium text-primary mb-2">
                {DAY_LABELS[hoveredSlot.day]} at {
                  (() => {
                    const displayHour = hoveredSlot.hour === 0 ? 12 : hoveredSlot.hour > 12 ? hoveredSlot.hour - 12 : hoveredSlot.hour
                    const period = hoveredSlot.hour < 12 ? 'AM' : 'PM'
                    const minuteStr = hoveredSlot.minute === 0 ? '00' : '30'
                    return `${displayHour}:${minuteStr} ${period}`
                  })()
                }
              </div>
              {(() => {
                const availablePeople = getAvailablePeople(hoveredSlot.day, hoveredSlot.hour, hoveredSlot.minute)
                const totalPeople = sessionData?.schedules.length || 0
                const busyPeople = totalPeople - availablePeople.length
                
                return (
                  <div className="flex items-center gap-4 flex-wrap">
                    {availablePeople.length > 0 ? (
                      <span>
                        <span className="text-green-700 font-medium">Available ({availablePeople.length}):</span>
                        <span className="ml-1 text-gray-700">{availablePeople.join(', ')}</span>
                      </span>
                    ) : (
                      <span className="text-red-700 font-medium">No one available</span>
                    )}
                    
                    {busyPeople > 0 && (
                      <span className="text-red-700 font-medium">Busy: {busyPeople}</span>
                    )}
                  </div>
                )
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}