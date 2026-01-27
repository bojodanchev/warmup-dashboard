import { NextResponse } from 'next/server'
import { getTodayStats, getRecentEvents } from '@/lib/db'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET() {
  try {
    const [stats, events] = await Promise.all([
      getTodayStats(),
      getRecentEvents(50),
    ])

    const today = new Date().toISOString().split('T')[0]

    return NextResponse.json(
      { date: today, profiles: stats, recentEvents: events },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500, headers: corsHeaders }
    )
  }
}
