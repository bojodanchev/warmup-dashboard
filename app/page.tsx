'use client'

import { useEffect, useState } from 'react'

interface ProfileStats {
  likes: number
  bookmarks: number
  searches: number
  explores: number
  videos: number
  sessions: number
  lastActivity: number | null
}

interface ActivityEvent {
  timestamp: number
  profileId: string
  action: string
  details?: Record<string, any>
}

interface DashboardData {
  date: string
  profiles: Record<string, ProfileStats>
  recentEvents: ActivityEvent[]
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const res = await fetch('/api/stats')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000) // Refresh every 5s
    return () => clearInterval(interval)
  }, [])

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString()
  }

  const formatAction = (event: ActivityEvent) => {
    const icons: Record<string, string> = {
      like: '❤️',
      bookmark: '🔖',
      scroll: '📜',
      video_watch: '🎬',
      search: '🔍',
      explore: '🧭',
      profile_visit: '👤',
      session_start: '▶️',
      session_end: '⏹️',
      error: '❌',
    }
    const icon = icons[event.action] || '📌'
    let text = event.action.replace('_', ' ')
    if (event.details?.keyword) text += `: ${event.details.keyword}`
    if (event.details?.duration) text += ` (${event.details.duration})`
    return `${icon} ${text}`
  }

  const getTotals = () => {
    if (!data?.profiles) return { likes: 0, bookmarks: 0, sessions: 0, videos: 0 }
    return Object.values(data.profiles).reduce(
      (acc, p) => ({
        likes: acc.likes + p.likes,
        bookmarks: acc.bookmarks + p.bookmarks,
        sessions: acc.sessions + p.sessions,
        videos: acc.videos + p.videos,
      }),
      { likes: 0, bookmarks: 0, sessions: 0, videos: 0 }
    )
  }

  const totals = getTotals()

  return (
    <div style={styles.container}>
      <style>{globalStyles}</style>

      <header style={styles.header}>
        <h1 style={styles.title}>🐦 X Warmup Dashboard</h1>
        <div style={styles.date}>{data?.date || 'Loading...'}</div>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      {/* Totals */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>TODAY'S TOTALS</h2>
        <div style={styles.totalsGrid}>
          <div style={styles.totalCard}>
            <div style={styles.totalValue}>{totals.likes}</div>
            <div style={styles.totalLabel}>Likes</div>
          </div>
          <div style={styles.totalCard}>
            <div style={styles.totalValue}>{totals.bookmarks}</div>
            <div style={styles.totalLabel}>Bookmarks</div>
          </div>
          <div style={styles.totalCard}>
            <div style={styles.totalValue}>{totals.videos}</div>
            <div style={styles.totalLabel}>Videos</div>
          </div>
          <div style={styles.totalCard}>
            <div style={styles.totalValue}>{totals.sessions}</div>
            <div style={styles.totalLabel}>Sessions</div>
          </div>
        </div>
      </section>

      {/* Profiles */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>PROFILES ({Object.keys(data?.profiles || {}).length})</h2>
        <div style={styles.profilesGrid}>
          {data?.profiles && Object.entries(data.profiles).map(([id, stats]) => (
            <div key={id} style={styles.profileCard}>
              <div style={styles.profileHeader}>
                <span style={styles.profileId}>{id}</span>
                {stats.lastActivity && (
                  <span style={styles.lastActive}>
                    {formatTime(stats.lastActivity)}
                  </span>
                )}
              </div>
              <div style={styles.profileStats}>
                <span>❤️ {stats.likes}</span>
                <span>🔖 {stats.bookmarks}</span>
                <span>🎬 {stats.videos}</span>
                <span>🔍 {stats.searches}</span>
              </div>
              <div style={styles.sessions}>{stats.sessions} sessions</div>
            </div>
          ))}
          {(!data?.profiles || Object.keys(data.profiles).length === 0) && (
            <div style={styles.empty}>No activity yet today</div>
          )}
        </div>
      </section>

      {/* Recent Activity */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>RECENT ACTIVITY</h2>
        <div style={styles.activityList}>
          {data?.recentEvents?.map((event, i) => (
            <div key={i} style={styles.activityItem}>
              <span style={styles.activityTime}>{formatTime(event.timestamp)}</span>
              <span style={styles.activityProfile}>[{event.profileId}]</span>
              <span style={styles.activityAction}>{formatAction(event)}</span>
            </div>
          ))}
          {(!data?.recentEvents || data.recentEvents.length === 0) && (
            <div style={styles.empty}>No recent activity</div>
          )}
        </div>
      </section>

      {/* Setup Instructions */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>SETUP</h2>
        <div style={styles.setup}>
          <p>Run this in browser console on each X profile to enable logging:</p>
          <code style={styles.code}>
            chrome.storage.local.set({'{'} centralLogEndpoint: '{typeof window !== 'undefined' ? window.location.origin : 'https://your-app.vercel.app'}/api/log' {'}'})
          </code>
        </div>
      </section>
    </div>
  )
}

const globalStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #15202b; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
`

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 1000,
    margin: '0 auto',
    padding: 24,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
  },
  date: {
    color: '#8899a6',
    fontSize: 14,
  },
  error: {
    background: 'rgba(244, 33, 46, 0.2)',
    color: '#f4212e',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  section: {
    background: '#192734',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    color: '#8899a6',
    marginBottom: 16,
  },
  totalsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
  },
  totalCard: {
    background: '#253341',
    borderRadius: 12,
    padding: 20,
    textAlign: 'center' as const,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: 700,
    color: '#1d9bf0',
  },
  totalLabel: {
    fontSize: 12,
    color: '#8899a6',
    marginTop: 4,
  },
  profilesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 12,
  },
  profileCard: {
    background: '#253341',
    borderRadius: 8,
    padding: 12,
  },
  profileHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileId: {
    fontWeight: 600,
    color: '#1d9bf0',
  },
  lastActive: {
    fontSize: 11,
    color: '#8899a6',
  },
  profileStats: {
    display: 'flex',
    gap: 12,
    fontSize: 13,
    marginBottom: 4,
  },
  sessions: {
    fontSize: 11,
    color: '#8899a6',
  },
  activityList: {
    maxHeight: 300,
    overflowY: 'auto' as const,
  },
  activityItem: {
    display: 'flex',
    gap: 12,
    padding: '8px 0',
    borderBottom: '1px solid #38444d',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  activityTime: {
    color: '#8899a6',
    minWidth: 80,
  },
  activityProfile: {
    color: '#1d9bf0',
    minWidth: 80,
  },
  activityAction: {
    color: '#fff',
  },
  empty: {
    color: '#657786',
    textAlign: 'center' as const,
    padding: 20,
    fontStyle: 'italic' as const,
  },
  setup: {
    fontSize: 13,
    color: '#8899a6',
  },
  code: {
    display: 'block',
    background: '#253341',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
    fontSize: 12,
    wordBreak: 'break-all' as const,
    color: '#00ba7c',
  },
}
