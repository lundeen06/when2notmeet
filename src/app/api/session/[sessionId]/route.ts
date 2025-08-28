import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const schedules = await prisma.schedule.findMany({
      where: {
        sessionId,
      },
      include: {
        busySlots: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    const sessionData = {
      sessionId,
      schedules: schedules.map(schedule => ({
        ...schedule,
        selectedDays: JSON.parse(schedule.selectedDays),
      })),
    }

    return NextResponse.json(sessionData)
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}