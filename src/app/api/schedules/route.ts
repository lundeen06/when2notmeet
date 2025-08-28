import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { scheduleId, sessionId, name, eventTitle, selectedDays, busySlots } = body

    if (!scheduleId || !sessionId || !name || !selectedDays || !Array.isArray(busySlots)) {
      return NextResponse.json(
        { error: 'Missing required fields for update' },
        { status: 400 }
      )
    }

    // Delete existing busy slots
    await prisma.busySlot.deleteMany({
      where: { scheduleId }
    })

    // Update schedule with new data
    const schedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        name,
        eventTitle,
        selectedDays: JSON.stringify(selectedDays),
        busySlots: {
          create: busySlots.map((slot: any) => ({
            day: slot.day,
            hour: slot.hour,
            minute: slot.minute || 0,
          })),
        },
      },
      include: {
        busySlots: true,
      },
    })

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Error updating schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, name, eventTitle, selectedDays, busySlots } = body

    if (!sessionId || !name || !selectedDays || !Array.isArray(busySlots)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const schedule = await prisma.schedule.create({
      data: {
        sessionId,
        name,
        eventTitle,
        selectedDays: JSON.stringify(selectedDays),
        busySlots: {
          create: busySlots.map((slot: { day: string; hour: number; minute?: number }) => ({
            day: slot.day,
            hour: slot.hour,
            minute: slot.minute || 0,
          })),
        },
      },
      include: {
        busySlots: true,
      },
    })

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Error creating schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}