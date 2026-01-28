import { NextResponse } from 'next/server'
import { addPostEvent, type PostEvent } from '@/lib/db'

// Enable CORS for x-automation worker
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
    const event: PostEvent = await request.json()

    if (!event.personaId || !event.action) {
      return NextResponse.json(
        { error: 'Missing personaId or action' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Validate action type
    const validActions = ['post_scheduled', 'post_published', 'post_failed']
    if (!validActions.includes(event.action)) {
      return NextResponse.json(
        { error: 'Invalid action type' },
        { status: 400, headers: corsHeaders }
      )
    }

    await addPostEvent(event)

    return NextResponse.json(
      { success: true },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error logging post event:', error)
    return NextResponse.json(
      { error: 'Failed to log post event' },
      { status: 500, headers: corsHeaders }
    )
  }
}
