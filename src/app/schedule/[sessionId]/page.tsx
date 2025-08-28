'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { ScheduleGrid } from '@/components/schedule-grid'
import { useEffect, useState } from 'react'

export default function SchedulePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [, setIsLoaded] = useState(false)
  
  const sessionId = params.sessionId as string
  const name = searchParams.get('name') || ''
  const daysParam = searchParams.get('days') || ''
  const selectedDays = daysParam ? daysParam.split(',') : []
  const startTime = parseInt(searchParams.get('startTime') || '16') // 8:00 AM
  const endTime = parseInt(searchParams.get('endTime') || '36') // 6:00 PM
  const eventTitle = searchParams.get('eventTitle') || ''
  const editScheduleId = searchParams.get('edit')

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  if (!name || selectedDays.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Invalid Session</h1>
          <p className="text-gray-600">Please go back and enter your information.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-0">
      <div className="container mx-auto py-4 px-4 max-h-[calc(100vh-80px)] overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 text-center pt-6">
            {eventTitle && (
              <h2 className="text-lg sm:text-xl font-semibold text-black mb-3">{eventTitle}</h2>
            )}
            <p className="text-sm sm:text-base text-gray-600">
              Mark the times when you are <span className="font-semibold text-red-600">NOT</span> available
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Session for: <span className="font-medium text-black">{name}</span>
            </p>
          </div>
          
          <ScheduleGrid 
            sessionId={sessionId}
            userName={name}
            selectedDays={selectedDays}
            startTime={startTime}
            endTime={endTime}
            editScheduleId={editScheduleId}
          />
        </div>
      </div>
    </div>
  )
}