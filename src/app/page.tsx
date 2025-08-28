import { Suspense } from 'react'
import { ScheduleSetup } from '@/components/schedule-setup'

export default function Home() {
  return (
    <div className="bg-white h-full flex items-center justify-center">
      <div className="w-full max-w-md mx-auto px-4">
        <Suspense fallback={<div>Loading...</div>}>
          <ScheduleSetup />
        </Suspense>
      </div>
    </div>
  );
}
