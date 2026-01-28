import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface StoredRepost {
  id: string
  detectedPostId: string
  personaId: string
  originalTweetId: string
  originalAuthor: string
  spunContent: string
  postedTweetId?: string
  mediaIncluded: boolean
  scheduledFor: string
  postedAt?: string
  status: 'scheduled' | 'posted' | 'failed'
  error?: string
}

interface PersonaPostStats {
  personaId: string
  handle: string
  displayName: string
  emoji: string
  scheduled: number
  posted: number
  failed: number
  lastActivity: string | null
}

interface PostsData {
  date: string
  totals: {
    scheduled: number
    posted: number
    failed: number
  }
  personas: PersonaPostStats[]
  recentPosts: StoredRepost[]
  upcomingPosts: StoredRepost[]
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
    // Path to reposts.json relative to the dashboard
    const repostsPath = join(process.cwd(), '..', 'data', 'reposts.json')

    let reposts: StoredRepost[] = []

    if (existsSync(repostsPath)) {
      const content = readFileSync(repostsPath, 'utf-8')
      reposts = JSON.parse(content)
    }

    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // Calculate totals
    const totals = {
      scheduled: reposts.filter(r => r.status === 'scheduled').length,
      posted: reposts.filter(r => r.status === 'posted').length,
      failed: reposts.filter(r => r.status === 'failed').length,
    }

    // Calculate per-persona stats
    const personaStats: Record<string, PersonaPostStats> = {}

    for (const repost of reposts) {
      if (!personaStats[repost.personaId]) {
        const meta = PERSONA_META[repost.personaId] || {
          handle: `@${repost.personaId}`,
          displayName: repost.personaId,
          emoji: '•'
        }
        personaStats[repost.personaId] = {
          personaId: repost.personaId,
          handle: meta.handle,
          displayName: meta.displayName,
          emoji: meta.emoji,
          scheduled: 0,
          posted: 0,
          failed: 0,
          lastActivity: null,
        }
      }

      const stats = personaStats[repost.personaId]

      switch (repost.status) {
        case 'scheduled': stats.scheduled++; break
        case 'posted': stats.posted++; break
        case 'failed': stats.failed++; break
      }

      // Track last activity (posted time or scheduled time)
      const activityTime = repost.postedAt || repost.scheduledFor
      if (!stats.lastActivity || activityTime > stats.lastActivity) {
        stats.lastActivity = activityTime
      }
    }

    // Get upcoming scheduled posts (sorted by scheduledFor)
    const upcomingPosts = reposts
      .filter(r => r.status === 'scheduled')
      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
      .slice(0, 20)

    // Get recent posts (posted or failed, sorted by most recent)
    const recentPosts = reposts
      .filter(r => r.status === 'posted' || r.status === 'failed')
      .sort((a, b) => {
        const timeA = a.postedAt || a.scheduledFor
        const timeB = b.postedAt || b.scheduledFor
        return new Date(timeB).getTime() - new Date(timeA).getTime()
      })
      .slice(0, 30)

    const data: PostsData = {
      date: today,
      totals,
      personas: Object.values(personaStats).sort((a, b) =>
        (b.posted + b.scheduled) - (a.posted + a.scheduled)
      ),
      recentPosts,
      upcomingPosts,
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
