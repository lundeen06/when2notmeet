import { Suspense } from 'react'
import { ScheduleSetup } from '@/components/schedule-setup'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-black text-center mb-8">
            WhenNot2Meet
          </h1>
          <Suspense fallback={<div>Loading...</div>}>
            <ScheduleSetup />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
