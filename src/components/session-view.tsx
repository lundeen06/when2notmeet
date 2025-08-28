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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredSlot, setHoveredSlot] = useState<{day: string, hour: number, minute: number} | null>(null)
  const [eventTitle, setEventTitle] = useState<string | null>(null)
  const [signInName, setSignInName] = useState('')
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const router = useRouter()

  // For now, use default time range - can be enhanced later to get from session data
  const startTime = 16 // 8:00 AM
  const endTime = 36 // 6:00 PM
  const filteredTimeSlots = TIME_SLOTS.slice(startTime, endTime + 1)

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
      } finally {
        setLoading(false)
      }
    }

    fetchSessionData()
  }, [sessionId])

  const joinSchedule = () => {
    router.push(`/?join=${sessionId}`)
  }

  const handleSignIn = () => {
    if (!signInName.trim()) return
    
    // Check if user already has a schedule in this session
    const existingSchedule = sessionData?.schedules.find(
      schedule => schedule.name.toLowerCase() === signInName.trim().toLowerCase()
    )
    
    if (existingSchedule) {
      // Navigate to edit existing schedule
      router.push(`/schedule/${sessionId}?name=${encodeURIComponent(signInName)}&edit=${existingSchedule.id}&days=${existingSchedule.selectedDays.join(',')}&startTime=${startTime}&endTime=${endTime}&eventTitle=${encodeURIComponent(eventTitle || '')}`)
    } else {
      // Navigate to create new schedule with the name pre-filled
      router.push(`/?join=${sessionId}&name=${encodeURIComponent(signInName)}`)
    }
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
    if (intensity === 0) return 'bg-blue-500'    // Everyone available - dark blue
    if (intensity <= 0.3) return 'bg-blue-400'   // Most available - medium blue  
    if (intensity <= 0.6) return 'bg-blue-300'   // Some available - lighter blue
    if (intensity <= 0.8) return 'bg-blue-200'   // Few available - light blue
    return 'bg-blue-100'  // Nobody available - very light blue
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
        alert('Link copied to clipboard!')
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">Loading session data...</div>
      </div>
    )
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
          <Button onClick={joinSchedule} className="bg-black text-white hover:bg-gray-800">
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
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-2">{eventTitle}</h2>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-black">
            {sessionData.schedules.length} Participant{sessionData.schedules.length !== 1 ? 's' : ''}
          </h3>
          <div className="text-sm text-gray-600 mt-1">
            {sessionData.schedules.map(schedule => schedule.name).join(', ')}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={copyToClipboard}
            variant="outline" 
            className="border-black text-black hover:bg-gray-50"
          >
            Copy Share Link
          </Button>
          
          <Dialog open={isSignInOpen} onOpenChange={setIsSignInOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 text-white hover:bg-green-700">
                Sign In & Join
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Join This Schedule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label htmlFor="signin-name" className="block text-sm font-medium text-black mb-2">
                    Your Name
                  </label>
                  <Input
                    id="signin-name"
                    type="text"
                    value={signInName}
                    onChange={(e) => setSignInName(e.target.value)}
                    placeholder="Enter your name"
                    className="bg-white border-gray-300 text-black"
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
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    Join Schedule
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button
            onClick={joinSchedule}
            variant="outline"
            className="border-black text-black hover:bg-gray-50"
          >
            Join This Schedule
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-black">Availability Overview</CardTitle>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500"></div>
              <span>Everyone available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-300"></div>
              <span>Most available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-200"></div>
              <span>Few available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100"></div>
              <span>Nobody available</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div 
              className="grid gap-0.5 mx-auto"
              style={{
                gridTemplateColumns: `80px repeat(${allDays.length}, 1fr)`,
                minWidth: '600px',
                maxWidth: '1000px'
              }}
            >
              <div className="h-6"></div>
              {allDays.map((day) => (
                <div key={day} className="h-6 flex items-center justify-center font-medium text-black text-sm">
                  {DAY_LABELS[day]}
                </div>
              ))}
              
              {filteredTimeSlots.map((timeSlot) => (
                <div key={timeSlot.value} className="contents">
                  <div className="h-5 flex items-center text-xs text-gray-600 pr-1">
                    {timeSlot.label}
                  </div>
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
        </CardContent>
      </Card>

      {hoveredSlot && (
        <Card className="mt-4 bg-gray-50">
          <CardContent className="pt-4">
            <div className="text-sm">
              <div className="font-medium text-black mb-2">
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
                  <div className="space-y-2">
                    {availablePeople.length > 0 ? (
                      <div>
                        <span className="text-green-700 font-medium">Available ({availablePeople.length}):</span>
                        <span className="ml-2 text-gray-700">{availablePeople.join(', ')}</span>
                      </div>
                    ) : (
                      <div className="text-red-700 font-medium">No one is available</div>
                    )}
                    
                    {busyPeople > 0 && (
                      <div>
                        <span className="text-red-700 font-medium">Busy: {busyPeople} person{busyPeople !== 1 ? 's' : ''}</span>
                      </div>
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