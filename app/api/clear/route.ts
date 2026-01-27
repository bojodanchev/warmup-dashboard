import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export async function POST() {
  try {
    const today = new Date().toISOString().split('T')[0]

    // Clear today's stats
    const statsPattern = `warmup:stats:${today}:*`
    const statsKeys = await redis.keys(statsPattern)

    if (statsKeys.length > 0) {
      await redis.del(...statsKeys)
    }

    // Clear events list
    await redis.del('warmup:events')

    return NextResponse.json({
      success: true,
      cleared: {
        statsKeys: statsKeys.length,
        events: true
      }
    })
  } catch (error) {
    console.error('Clear error:', error)
    return NextResponse.json(
      { error: 'Failed to clear data' },
      { status: 500 }
    )
  }
}
