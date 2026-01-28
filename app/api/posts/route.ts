import { NextResponse } from 'next/server'
import { getTodayPostStats, getRecentPostEvents, type PostEvent, type PostStats } from '@/lib/db'

interface PersonaPostStats {
  personaId: string
  handle: string
  displayName: string
  emoji: string
  scheduled: number
  posted: number
  failed: number
  lastActivity: number | null
}

interface PostsData {
  date: string
  totals: {
    scheduled: number
    posted: number
    failed: number
  }
  personas: PersonaPostStats[]
  recentEvents: PostEvent[]
}

// Persona metadata for display
const PERSONA_META: Record<string, { handle: string; displayName: string; emoji: string }> = {
  green: { handle: '@PassikiAI', displayName: 'Passiki', emoji: '🟢' },
  orange: { handle: '@Builtforyou28', displayName: 'Built For You', emoji: '🟠' },
  purple: { handle: '@quit9to5life', displayName: 'Quit 9-5 Life', emoji: '🟣' },
  blue: { handle: '@automateprofit', displayName: 'Automate Profit', emoji: '🔵' },
  red: { handle: '@sidehustlecashh', displayName: 'Side Hustle Cash', emoji: '🔴' },
  yellow: { handle: '@wifilifestyle', displayName: 'Laptop Lifestyle', emoji: '🟡' },
  cyan: { handle: '@ecomtactics_', displayName: 'Ecom Tactics', emoji: '🩵' },
  pink: { handle: '@startingfrom0_', displayName: 'Starting From Zero', emoji: '💗' },
  black: { handle: '@aitoolstack_', displayName: 'AI Tool Stack', emoji: '⬛' },
  white: { handle: '@_wealthsystems_', displayName: 'Wealth Systems', emoji: '⬜' },
}

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]

    // Get stats from Redis
    const statsMap = await getTodayPostStats()
    const recentEvents = await getRecentPostEvents(50)

    // Calculate totals
    const totals = {
      scheduled: 0,
      posted: 0,
      failed: 0,
    }

    // Build persona stats array
    const personas: PersonaPostStats[] = []

    for (const [personaId, stats] of Object.entries(statsMap)) {
      const meta = PERSONA_META[personaId] || {
        handle: stats.handle || `@${personaId}`,
        displayName: personaId,
        emoji: '•'
      }

      personas.push({
        personaId,
        handle: stats.handle || meta.handle,
        displayName: meta.displayName,
        emoji: meta.emoji,
        scheduled: stats.scheduled,
        posted: stats.posted,
        failed: stats.failed,
        lastActivity: stats.lastActivity,
      })

      totals.scheduled += stats.scheduled
      totals.posted += stats.posted
      totals.failed += stats.failed
    }

    // Sort by total activity
    personas.sort((a, b) =>
      (b.posted + b.scheduled + b.failed) - (a.posted + a.scheduled + a.failed)
    )

    const data: PostsData = {
      date: today,
      totals,
      personas,
      recentEvents,
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching posts data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts data' },
      { status: 500 }
    )
  }
}
