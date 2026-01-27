import { NextResponse } from 'next/server'
import { addEvent, type ActivityEvent } from '@/lib/db'

// Enable CORS for extension
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: Request) {
  try {
    const event: ActivityEvent = await request.json()

    if (!event.profileId || !event.action) {
      return NextResponse.json(
        { error: 'Missing profileId or action' },
        { status: 400, headers: corsHeaders }
      )
    }

    await addEvent(event)

    return NextResponse.json(
      { success: true },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error logging event:', error)
    return NextResponse.json(
      { error: 'Failed to log event' },
      { status: 500, headers: corsHeaders }
    )
  }
}
