import { Redis } from '@upstash/redis'

// Initialize Redis client from Vercel KV environment variables
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export interface ActivityEvent {
  timestamp: number
  profileId: string
  username?: string // X username like @username
  action: string
  details?: Record<string, any>
  receivedAt?: number
}

export interface ProfileStats {
  likes: number
  bookmarks: number
  searches: number
  explores: number
  videos: number
  sessions: number
  lastActivity: number | null
  username?: string // X username for display
}

const EVENTS_KEY = 'warmup:events'
const STATS_PREFIX = 'warmup:stats:'
const POST_EVENTS_KEY = 'posts:events'
const POST_STATS_PREFIX = 'posts:stats:'
const MAX_EVENTS = 500
const MAX_POST_EVENTS = 200

/**
 * Add an activity event
 */
export async function addEvent(event: ActivityEvent): Promise<void> {
  event.receivedAt = Date.now()

  // Add to events list (keep last 500)
  await redis.lpush(EVENTS_KEY, JSON.stringify(event))
  await redis.ltrim(EVENTS_KEY, 0, MAX_EVENTS - 1)

  // Update profile stats for today
  const today = new Date().toISOString().split('T')[0]
  const statsKey = `${STATS_PREFIX}${today}:${event.profileId}`

  const existing = await redis.get<ProfileStats>(statsKey)
  const stats: ProfileStats = existing || {
    likes: 0,
    bookmarks: 0,
    searches: 0,
    explores: 0,
    videos: 0,
    sessions: 0,
    lastActivity: null,
    username: undefined,
  }

  stats.lastActivity = event.timestamp
  // Update username if provided (keeps latest username)
  if (event.username) {
    stats.username = event.username
  }

  switch (event.action) {
    case 'like': stats.likes++; break
    case 'bookmark': stats.bookmarks++; break
    case 'search': stats.searches++; break
    case 'explore': stats.explores++; break
    case 'video_watch': stats.videos++; break
    case 'session_start': stats.sessions++; break
  }

  await redis.set(statsKey, stats, { ex: 86400 * 7 }) // Expire after 7 days
}

/**
 * Get recent events
 */
export async function getRecentEvents(limit = 100): Promise<ActivityEvent[]> {
  const events = await redis.lrange(EVENTS_KEY, 0, limit - 1)
  return events.map(e => typeof e === 'string' ? JSON.parse(e) : e as ActivityEvent)
}

/**
 * Get stats for all profiles for a given date
 */
export async function getStatsForDate(date: string): Promise<Record<string, ProfileStats>> {
  const pattern = `${STATS_PREFIX}${date}:*`
  const keys = await redis.keys(pattern)

  const stats: Record<string, ProfileStats> = {}

  for (const key of keys) {
    const profileId = key.replace(`${STATS_PREFIX}${date}:`, '')
    const profileStats = await redis.get<ProfileStats>(key)
    if (profileStats) {
      stats[profileId] = profileStats
    }
  }

  return stats
}

/**
 * Get today's stats
 */
export async function getTodayStats(): Promise<Record<string, ProfileStats>> {
  const today = new Date().toISOString().split('T')[0]
  return getStatsForDate(today)
}

// ============ POST TRACKING ============

export interface PostEvent {
  timestamp: number
  personaId: string
  handle?: string
  action: 'post_scheduled' | 'post_published' | 'post_failed'
  details?: {
    repostId?: string
    content?: string
    tweetId?: string
    originalAuthor?: string
    scheduledFor?: string
    error?: string
    mediaIncluded?: boolean
  }
  receivedAt?: number
}

export interface PostStats {
  scheduled: number
  posted: number
  failed: number
  lastActivity: number | null
  handle?: string
}

/**
 * Add a post event
 */
export async function addPostEvent(event: PostEvent): Promise<void> {
  event.receivedAt = Date.now()

  // Add to post events list (keep last 200)
  await redis.lpush(POST_EVENTS_KEY, JSON.stringify(event))
  await redis.ltrim(POST_EVENTS_KEY, 0, MAX_POST_EVENTS - 1)

  // Update post stats for today
  const today = new Date().toISOString().split('T')[0]
  const statsKey = `${POST_STATS_PREFIX}${today}:${event.personaId}`

  const existing = await redis.get<PostStats>(statsKey)
  const stats: PostStats = existing || {
    scheduled: 0,
    posted: 0,
    failed: 0,
    lastActivity: null,
    handle: undefined,
  }

  stats.lastActivity = event.timestamp
  if (event.handle) {
    stats.handle = event.handle
  }

  switch (event.action) {
    case 'post_scheduled': stats.scheduled++; break
    case 'post_published':
      stats.posted++
      // Decrement scheduled when published
      if (stats.scheduled > 0) stats.scheduled--
      break
    case 'post_failed':
      stats.failed++
      // Decrement scheduled when failed
      if (stats.scheduled > 0) stats.scheduled--
      break
  }

  await redis.set(statsKey, stats, { ex: 86400 * 7 }) // Expire after 7 days
}

/**
 * Get recent post events
 */
export async function getRecentPostEvents(limit = 100): Promise<PostEvent[]> {
  const events = await redis.lrange(POST_EVENTS_KEY, 0, limit - 1)
  return events.map(e => typeof e === 'string' ? JSON.parse(e) : e as PostEvent)
}

/**
 * Get post stats for all personas for a given date
 */
export async function getPostStatsForDate(date: string): Promise<Record<string, PostStats>> {
  const pattern = `${POST_STATS_PREFIX}${date}:*`
  const keys = await redis.keys(pattern)

  const stats: Record<string, PostStats> = {}

  for (const key of keys) {
    const personaId = key.replace(`${POST_STATS_PREFIX}${date}:`, '')
    const postStats = await redis.get<PostStats>(key)
    if (postStats) {
      stats[personaId] = postStats
    }
  }

  return stats
}

/**
 * Get today's post stats
 */
export async function getTodayPostStats(): Promise<Record<string, PostStats>> {
  const today = new Date().toISOString().split('T')[0]
  return getPostStatsForDate(today)
}
