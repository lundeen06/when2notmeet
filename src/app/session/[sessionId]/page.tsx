'use client'

import { useParams } from 'next/navigation'
import { SessionView } from '@/components/session-view'

export default function SessionPage() {
  const params = useParams()
  const sessionId = params.sessionId as string

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-black mb-2">WhenNot2Meet</h1>
            <p className="text-gray-600">Group Availability Overview</p>
          </div>
          
          <SessionView sessionId={sessionId} />
        </div>
      </div>
    </div>
  )
}