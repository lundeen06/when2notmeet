'use client'

import { useParams } from 'next/navigation'
import { SessionView } from '@/components/session-view'

export default function SessionPage() {
  const params = useParams()
  const sessionId = params.sessionId as string

  return (
    <div className="bg-white min-h-0">
      <div className="container mx-auto py-4 px-4 max-h-[calc(100vh-80px)] overflow-auto">
        <div className="max-w-4xl mx-auto">
          <SessionView sessionId={sessionId} />
        </div>
      </div>
    </div>
  )
}