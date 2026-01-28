'use client'

import { useEffect, useState, useRef } from 'react'

// ============ TYPES ============

interface ProfileStats {
  likes: number
  bookmarks: number
  searches: number
  explores: number
  videos: number
  sessions: number
  lastActivity: number | null
  username?: string
}

interface ActivityEvent {
  timestamp: number
  profileId: string
  username?: string
  action: string
  details?: Record<string, any>
}

interface WarmupData {
  date: string
  profiles: Record<string, ProfileStats>
  recentEvents: ActivityEvent[]
}

interface PostEvent {
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

type TabType = 'warmup' | 'posts'

// ============ SHARED COMPONENTS ============

function AnimatedNumber({ value, duration = 500 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0)
  const prevValue = useRef(0)

  useEffect(() => {
    const startValue = prevValue.current
    const startTime = Date.now()
    const diff = value - startValue

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(startValue + diff * eased))

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        prevValue.current = value
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return <>{displayValue}</>
}

function LivePulse() {
  return (
    <span className="live-pulse">
      <span className="pulse-dot" />
      <span className="pulse-text">LIVE</span>
    </span>
  )
}

function ActionIcon({ action }: { action: string }) {
  const iconMap: Record<string, { icon: string; color: string }> = {
    like: { icon: '♥', color: '#ff3366' },
    bookmark: { icon: '◆', color: '#00f0ff' },
    scroll: { icon: '↕', color: '#8899a6' },
    video_watch: { icon: '▶', color: '#a855f7' },
    search: { icon: '◎', color: '#ffcc00' },
    explore: { icon: '✦', color: '#00ff88' },
    profile_visit: { icon: '◉', color: '#ff8800' },
    session_start: { icon: '●', color: '#00ff88' },
    session_end: { icon: '■', color: '#ff3366' },
    error: { icon: '✕', color: '#ff3366' },
  }

  const { icon, color } = iconMap[action] || { icon: '•', color: '#8899a6' }

  return (
    <span className="action-icon" style={{ color, textShadow: `0 0 10px ${color}` }}>
      {icon}
    </span>
  )
}

// ============ WARMUP TAB ============

function WarmupTab({ data, loading, lastUpdate, fetchData, clearData, clearing }: {
  data: WarmupData | null
  loading: boolean
  lastUpdate: Date | null
  fetchData: () => void
  clearData: () => void
  clearing: boolean
}) {
  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ')
  }

  const getRelativeTime = (ts: number) => {
    const diff = Date.now() - ts
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    return `${Math.floor(mins / 60)}h ago`
  }

  const getTotals = () => {
    if (!data?.profiles) return { likes: 0, bookmarks: 0, sessions: 0, videos: 0, searches: 0, explores: 0 }
    return Object.values(data.profiles).reduce(
      (acc, p) => ({
        likes: acc.likes + p.likes,
        bookmarks: acc.bookmarks + p.bookmarks,
        sessions: acc.sessions + p.sessions,
        videos: acc.videos + p.videos,
        searches: acc.searches + p.searches,
        explores: acc.explores + p.explores,
      }),
      { likes: 0, bookmarks: 0, sessions: 0, videos: 0, searches: 0, explores: 0 }
    )
  }

  const totals = getTotals()
  const profileCount = Object.keys(data?.profiles || {}).length
  const activeProfiles = Object.values(data?.profiles || {}).filter(
    p => p.lastActivity && Date.now() - p.lastActivity < 300000
  ).length

  return (
    <>
      {/* Stats Grid */}
      <section className="stats-grid">
        <div className="stat-card stat-card-large">
          <div className="stat-icon" style={{ color: '#ff3366' }}>♥</div>
          <div className="stat-content">
            <div className="stat-value">
              <AnimatedNumber value={totals.likes} />
            </div>
            <div className="stat-label">Total Likes</div>
          </div>
          <div className="stat-glow" style={{ background: 'radial-gradient(circle at center, rgba(255,51,102,0.15) 0%, transparent 70%)' }} />
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#00f0ff' }}>◆</div>
          <div className="stat-content">
            <div className="stat-value">
              <AnimatedNumber value={totals.bookmarks} />
            </div>
            <div className="stat-label">Bookmarks</div>
          </div>
          <div className="stat-glow" style={{ background: 'radial-gradient(circle at center, rgba(0,240,255,0.1) 0%, transparent 70%)' }} />
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#a855f7' }}>▶</div>
          <div className="stat-content">
            <div className="stat-value">
              <AnimatedNumber value={totals.videos} />
            </div>
            <div className="stat-label">Videos</div>
          </div>
          <div className="stat-glow" style={{ background: 'radial-gradient(circle at center, rgba(168,85,247,0.1) 0%, transparent 70%)' }} />
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#00ff88' }}>●</div>
          <div className="stat-content">
            <div className="stat-value">
              <AnimatedNumber value={totals.sessions} />
            </div>
            <div className="stat-label">Sessions</div>
          </div>
          <div className="stat-glow" style={{ background: 'radial-gradient(circle at center, rgba(0,255,136,0.1) 0%, transparent 70%)' }} />
        </div>

        <div className="stat-card stat-card-small">
          <div className="stat-icon" style={{ color: '#ffcc00' }}>◎</div>
          <div className="stat-content">
            <div className="stat-value">
              <AnimatedNumber value={totals.searches} />
            </div>
            <div className="stat-label">Searches</div>
          </div>
        </div>

        <div className="stat-card stat-card-small">
          <div className="stat-icon" style={{ color: '#00ff88' }}>✦</div>
          <div className="stat-content">
            <div className="stat-value">
              <AnimatedNumber value={totals.explores} />
            </div>
            <div className="stat-label">Explores</div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="main-grid">
        {/* Profiles Panel */}
        <section className="panel profiles-panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <span className="panel-title-icon">◈</span>
              PROFILES
            </h2>
            <span className="panel-count">{profileCount}</span>
          </div>
          <div className="profiles-list">
            {data?.profiles && Object.entries(data.profiles)
              .sort((a, b) => (b[1].lastActivity || 0) - (a[1].lastActivity || 0))
              .map(([id, stats], index) => {
                const isActive = stats.lastActivity && Date.now() - stats.lastActivity < 300000
                return (
                  <div
                    key={id}
                    className={`profile-card ${isActive ? 'active' : ''}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="profile-header">
                      <div className="profile-id">
                        <span className={`profile-status ${isActive ? 'online' : 'offline'}`} />
                        {stats.username || id}
                      </div>
                      {stats.lastActivity && (
                        <span className="profile-time">{getRelativeTime(stats.lastActivity)}</span>
                      )}
                    </div>
                    <div className="profile-stats">
                      <span className="profile-stat">
                        <span style={{ color: '#ff3366' }}>♥</span> {stats.likes}
                      </span>
                      <span className="profile-stat">
                        <span style={{ color: '#00f0ff' }}>◆</span> {stats.bookmarks}
                      </span>
                      <span className="profile-stat">
                        <span style={{ color: '#a855f7' }}>▶</span> {stats.videos}
                      </span>
                      <span className="profile-stat">
                        <span style={{ color: '#ffcc00' }}>◎</span> {stats.searches}
                      </span>
                    </div>
                    <div className="profile-sessions">
                      {stats.sessions} session{stats.sessions !== 1 ? 's' : ''} today
                    </div>
                    {isActive && <div className="profile-active-glow" />}
                  </div>
                )
              })}
            {(!data?.profiles || profileCount === 0) && (
              <div className="empty-state">
                <span className="empty-icon">◇</span>
                <span>Waiting for activity...</span>
              </div>
            )}
          </div>
        </section>

        {/* Activity Feed */}
        <section className="panel activity-panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <span className="panel-title-icon">◈</span>
              ACTIVITY FEED
            </h2>
            {lastUpdate && (
              <span className="panel-update">
                Updated {formatTime(lastUpdate.getTime())}
              </span>
            )}
          </div>
          <div className="activity-list">
            {data?.recentEvents?.map((event, i) => (
              <div
                key={`${event.timestamp}-${i}`}
                className="activity-item"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <span className="activity-time">{formatTime(event.timestamp)}</span>
                <span className="activity-profile">{event.username || event.profileId}</span>
                <ActionIcon action={event.action} />
                <span className="activity-action">
                  {formatAction(event.action)}
                  {event.details?.keyword && (
                    <span className="activity-detail">"{event.details.keyword}"</span>
                  )}
                  {event.details?.duration && (
                    <span className="activity-detail">{event.details.duration}</span>
                  )}
                </span>
              </div>
            ))}
            {(!data?.recentEvents || data.recentEvents.length === 0) && (
              <div className="empty-state">
                <span className="empty-icon">◇</span>
                <span>No recent activity</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  )
}

// ============ POSTS TAB ============

function PostsTab({ data, loading, lastUpdate }: {
  data: PostsData | null
  loading: boolean
  lastUpdate: Date | null
}) {
  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const getRelativeTime = (ts: number) => {
    const diff = Date.now() - ts
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
    return `${Math.floor(mins / 1440)}d ago`
  }

  const truncateText = (text: string, maxLen: number) => {
    if (!text) return ''
    if (text.length <= maxLen) return text
    return text.slice(0, maxLen) + '...'
  }

  const getActionDisplay = (action: string) => {
    switch (action) {
      case 'post_scheduled': return { label: 'scheduled', icon: '⏱', color: '#ffcc00' }
      case 'post_published': return { label: 'posted', icon: '✓', color: '#00ff88' }
      case 'post_failed': return { label: 'failed', icon: '✕', color: '#ff3366' }
      default: return { label: action, icon: '•', color: '#8899a6' }
    }
  }

  const totals = data?.totals || { scheduled: 0, posted: 0, failed: 0 }

  return (
    <>
      {/* Stats Grid */}
      <section className="stats-grid stats-grid-posts">
        <div className="stat-card stat-card-posts">
          <div className="stat-icon" style={{ color: '#ffcc00' }}>⏱</div>
          <div className="stat-content">
            <div className="stat-value">
              <AnimatedNumber value={totals.scheduled} />
            </div>
            <div className="stat-label">Scheduled</div>
          </div>
          <div className="stat-glow" style={{ background: 'radial-gradient(circle at center, rgba(255,204,0,0.15) 0%, transparent 70%)' }} />
        </div>

        <div className="stat-card stat-card-posts">
          <div className="stat-icon" style={{ color: '#00ff88' }}>✓</div>
          <div className="stat-content">
            <div className="stat-value">
              <AnimatedNumber value={totals.posted} />
            </div>
            <div className="stat-label">Posted</div>
          </div>
          <div className="stat-glow" style={{ background: 'radial-gradient(circle at center, rgba(0,255,136,0.15) 0%, transparent 70%)' }} />
        </div>

        <div className="stat-card stat-card-posts">
          <div className="stat-icon" style={{ color: '#ff3366' }}>✕</div>
          <div className="stat-content">
            <div className="stat-value">
              <AnimatedNumber value={totals.failed} />
            </div>
            <div className="stat-label">Failed</div>
          </div>
          <div className="stat-glow" style={{ background: 'radial-gradient(circle at center, rgba(255,51,102,0.15) 0%, transparent 70%)' }} />
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="main-grid">
        {/* Accounts Panel */}
        <section className="panel profiles-panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <span className="panel-title-icon">◈</span>
              ACCOUNTS
            </h2>
            <span className="panel-count">{data?.personas?.length || 0}</span>
          </div>
          <div className="profiles-list">
            {data?.personas?.map((persona, index) => {
              const total = persona.posted + persona.scheduled + persona.failed
              const hasActivity = persona.lastActivity !== null
              return (
                <div
                  key={persona.personaId}
                  className="profile-card"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="profile-header">
                    <div className="profile-id">
                      <span className="persona-emoji">{persona.emoji}</span>
                      {persona.handle}
                    </div>
                    {hasActivity && (
                      <span className="profile-time">{getRelativeTime(persona.lastActivity!)}</span>
                    )}
                  </div>
                  <div className="profile-stats">
                    <span className="profile-stat">
                      <span style={{ color: '#ffcc00' }}>⏱</span> {persona.scheduled}
                    </span>
                    <span className="profile-stat">
                      <span style={{ color: '#00ff88' }}>✓</span> {persona.posted}
                    </span>
                    <span className="profile-stat">
                      <span style={{ color: '#ff3366' }}>✕</span> {persona.failed}
                    </span>
                  </div>
                  <div className="profile-sessions">
                    {total} total post{total !== 1 ? 's' : ''} today
                  </div>
                </div>
              )
            })}
            {(!data?.personas || data.personas.length === 0) && (
              <div className="empty-state">
                <span className="empty-icon">◇</span>
                <span>No posting activity yet</span>
              </div>
            )}
          </div>
        </section>

        {/* Posts Activity Feed */}
        <section className="panel activity-panel posts-panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <span className="panel-title-icon">◈</span>
              POST ACTIVITY
            </h2>
            {lastUpdate && (
              <span className="panel-update">
                Updated {formatTime(lastUpdate.getTime())}
              </span>
            )}
          </div>
          <div className="activity-list">
            {data?.recentEvents?.map((event, i) => {
              const meta = data.personas.find(p => p.personaId === event.personaId)
              const actionInfo = getActionDisplay(event.action)
              return (
                <div
                  key={`${event.timestamp}-${i}`}
                  className={`activity-item post-event-${event.action.replace('post_', '')}`}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <span className="activity-time">{formatTime(event.timestamp)}</span>
                  <span className="post-emoji">{meta?.emoji || '•'}</span>
                  <span className="activity-profile">{event.handle || meta?.handle || event.personaId}</span>
                  <span className="action-icon" style={{ color: actionInfo.color, textShadow: `0 0 10px ${actionInfo.color}` }}>
                    {actionInfo.icon}
                  </span>
                  <span className="activity-action">
                    {actionInfo.label}
                    {event.details?.content && (
                      <span className="activity-detail post-content-preview">
                        {truncateText(event.details.content, 60)}
                      </span>
                    )}
                  </span>
                  {event.details?.error && (
                    <span className="post-error-inline">{truncateText(event.details.error, 40)}</span>
                  )}
                  {event.details?.mediaIncluded && (
                    <span className="post-media-badge">+ media</span>
                  )}
                </div>
              )
            })}
            {(!data?.recentEvents || data.recentEvents.length === 0) && (
              <div className="empty-state">
                <span className="empty-icon">◇</span>
                <span>No post activity yet</span>
                <span className="empty-hint">Events will appear here when posts are scheduled or published</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  )
}

// ============ MAIN DASHBOARD ============

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('warmup')
  const [warmupData, setWarmupData] = useState<WarmupData | null>(null)
  const [postsData, setPostsData] = useState<PostsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [clearing, setClearing] = useState(false)

  const clearData = async () => {
    if (!confirm('Clear all data for today? This cannot be undone.')) return
    setClearing(true)
    try {
      const res = await fetch('/api/clear', { method: 'POST' })
      if (res.ok) {
        await fetchWarmupData()
      }
    } catch (err) {
      console.error('Failed to clear:', err)
    } finally {
      setClearing(false)
    }
  }

  const fetchWarmupData = async () => {
    try {
      const res = await fetch('/api/stats')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setWarmupData(json)
      setError(null)
      setLastUpdate(new Date())
    } catch (err) {
      setError('Connection lost')
    } finally {
      setLoading(false)
    }
  }

  const fetchPostsData = async () => {
    try {
      const res = await fetch('/api/posts')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setPostsData(json)
      setError(null)
      setLastUpdate(new Date())
    } catch (err) {
      setError('Connection lost')
    } finally {
      setLoading(false)
    }
  }

  const fetchData = () => {
    if (activeTab === 'warmup') {
      fetchWarmupData()
    } else {
      fetchPostsData()
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [activeTab])

  const profileCount = Object.keys(warmupData?.profiles || {}).length
  const activeProfiles = Object.values(warmupData?.profiles || {}).filter(
    p => p.lastActivity && Date.now() - p.lastActivity < 300000
  ).length

  return (
    <>
      <style>{globalStyles}</style>

      <div className="dashboard">
        {/* Ambient background effects */}
        <div className="bg-grid" />
        <div className="bg-glow bg-glow-1" />
        <div className="bg-glow bg-glow-2" />

        {/* Header */}
        <header className="header">
          <div className="header-left">
            <div className="logo">
              <span className="logo-icon">⬡</span>
              <span className="logo-text">X CONTROL</span>
              <span className="logo-badge">v2</span>
            </div>
            <LivePulse />
          </div>

          {/* Tabs */}
          <div className="header-tabs">
            <button
              className={`tab-btn ${activeTab === 'warmup' ? 'active' : ''}`}
              onClick={() => setActiveTab('warmup')}
            >
              <span className="tab-icon">♥</span>
              Warmup
            </button>
            <button
              className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              <span className="tab-icon">✎</span>
              Posts
            </button>
          </div>

          <div className="header-right">
            {activeTab === 'warmup' && (
              <>
                <div className="header-stat">
                  <span className="header-stat-value">{profileCount}</span>
                  <span className="header-stat-label">PROFILES</span>
                </div>
                <div className="header-stat active">
                  <span className="header-stat-value">{activeProfiles}</span>
                  <span className="header-stat-label">ACTIVE</span>
                </div>
              </>
            )}
            {activeTab === 'posts' && (
              <>
                <div className="header-stat">
                  <span className="header-stat-value">{postsData?.totals.scheduled || 0}</span>
                  <span className="header-stat-label">QUEUED</span>
                </div>
                <div className="header-stat active">
                  <span className="header-stat-value">{postsData?.totals.posted || 0}</span>
                  <span className="header-stat-label">POSTED</span>
                </div>
              </>
            )}
            <div className="header-date">
              {warmupData?.date || postsData?.date || '—'}
            </div>
            {activeTab === 'warmup' && (
              <button
                className="clear-btn"
                onClick={clearData}
                disabled={clearing}
              >
                {clearing ? 'Clearing...' : 'Clear Data'}
              </button>
            )}
          </div>
        </header>

        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠</span>
            {error}
            <span className="error-retry" onClick={fetchData}>Retry</span>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'warmup' ? (
          <WarmupTab
            data={warmupData}
            loading={loading}
            lastUpdate={lastUpdate}
            fetchData={fetchWarmupData}
            clearData={clearData}
            clearing={clearing}
          />
        ) : (
          <PostsTab
            data={postsData}
            loading={loading}
            lastUpdate={lastUpdate}
          />
        )}

        {/* Footer */}
        <footer className="footer">
          <div className="footer-left">
            <span className="footer-brand">X CONTROL DASHBOARD v2.0</span>
          </div>
          <div className="footer-right">
            <span className="footer-status">
              {loading ? 'Syncing...' : error ? 'Disconnected' : 'Connected'}
            </span>
          </div>
        </footer>
      </div>
    </>
  )
}

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap');

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :root {
    --bg-primary: #06060a;
    --bg-secondary: rgba(12, 12, 18, 0.8);
    --bg-card: rgba(18, 18, 28, 0.6);
    --border: rgba(255, 255, 255, 0.06);
    --text-primary: #ffffff;
    --text-secondary: #6b7280;
    --text-muted: #4b5563;
    --accent-cyan: #00f0ff;
    --accent-pink: #ff3366;
    --accent-purple: #a855f7;
    --accent-green: #00ff88;
    --accent-yellow: #ffcc00;
    --accent-orange: #ff8800;
  }

  html, body {
    background: var(--bg-primary);
    color: var(--text-primary);
    font-family: 'Outfit', -apple-system, sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
  }

  .dashboard {
    position: relative;
    min-height: 100vh;
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
  }

  /* Background effects */
  .bg-grid {
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
  }

  .bg-glow {
    position: fixed;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    filter: blur(120px);
    opacity: 0.3;
    pointer-events: none;
  }

  .bg-glow-1 {
    top: -200px;
    left: -200px;
    background: var(--accent-cyan);
    opacity: 0.08;
  }

  .bg-glow-2 {
    bottom: -200px;
    right: -200px;
    background: var(--accent-pink);
    opacity: 0.06;
  }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0 32px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 32px;
    gap: 24px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .logo-icon {
    font-size: 28px;
    color: var(--accent-cyan);
    text-shadow: 0 0 20px var(--accent-cyan);
  }

  .logo-text {
    font-family: 'Outfit', sans-serif;
    font-size: 24px;
    font-weight: 800;
    letter-spacing: 2px;
    background: linear-gradient(135deg, #fff 0%, #8899a6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .logo-badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 600;
    padding: 4px 8px;
    background: var(--accent-cyan);
    color: var(--bg-primary);
    border-radius: 4px;
    letter-spacing: 1px;
  }

  /* Tabs */
  .header-tabs {
    display: flex;
    gap: 8px;
    background: var(--bg-card);
    padding: 4px;
    border-radius: 12px;
    border: 1px solid var(--border);
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    font-weight: 600;
    padding: 10px 20px;
    background: transparent;
    color: var(--text-secondary);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tab-btn:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.05);
  }

  .tab-btn.active {
    color: var(--text-primary);
    background: rgba(0, 240, 255, 0.1);
    box-shadow: 0 0 20px rgba(0, 240, 255, 0.1);
  }

  .tab-btn.active .tab-icon {
    color: var(--accent-cyan);
  }

  .tab-icon {
    font-size: 14px;
  }

  .live-pulse {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .pulse-dot {
    width: 8px;
    height: 8px;
    background: var(--accent-green);
    border-radius: 50%;
    box-shadow: 0 0 10px var(--accent-green);
    animation: pulse 2s ease-in-out infinite;
  }

  .pulse-text {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    color: var(--accent-green);
    letter-spacing: 1px;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.9); }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .header-stat {
    text-align: center;
  }

  .header-stat-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
    display: block;
  }

  .header-stat-label {
    font-size: 10px;
    font-weight: 600;
    color: var(--text-muted);
    letter-spacing: 1px;
  }

  .header-stat.active .header-stat-value {
    color: var(--accent-green);
    text-shadow: 0 0 10px var(--accent-green);
  }

  .header-date {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    color: var(--text-secondary);
    padding: 8px 16px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  .clear-btn {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    padding: 8px 16px;
    background: rgba(255, 51, 102, 0.1);
    color: var(--accent-pink);
    border: 1px solid rgba(255, 51, 102, 0.3);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.5px;
  }

  .clear-btn:hover:not(:disabled) {
    background: rgba(255, 51, 102, 0.2);
    border-color: rgba(255, 51, 102, 0.5);
  }

  .clear-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Error banner */
  .error-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    background: rgba(255, 51, 102, 0.1);
    border: 1px solid rgba(255, 51, 102, 0.3);
    border-radius: 8px;
    margin-bottom: 24px;
    font-size: 14px;
    color: var(--accent-pink);
  }

  .error-icon {
    font-size: 16px;
  }

  .error-retry {
    margin-left: auto;
    cursor: pointer;
    font-weight: 600;
    opacity: 0.8;
    transition: opacity 0.2s;
  }

  .error-retry:hover {
    opacity: 1;
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 16px;
    margin-bottom: 32px;
  }

  .stats-grid-posts {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .stat-card {
    position: relative;
    background: var(--bg-card);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    overflow: hidden;
    transition: transform 0.2s, border-color 0.2s;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .stat-card-large {
    grid-row: span 2;
    flex-direction: column;
    justify-content: center;
    text-align: center;
  }

  .stat-card-large .stat-icon {
    font-size: 48px;
    margin-bottom: 8px;
  }

  .stat-card-large .stat-value {
    font-size: 64px;
  }

  .stat-card-small {
    grid-column: span 1;
  }

  .stat-card-posts {
    flex-direction: column;
    justify-content: center;
    text-align: center;
  }

  .stat-card-posts .stat-icon {
    font-size: 36px;
    margin-bottom: 8px;
  }

  .stat-card-posts .stat-value {
    font-size: 48px;
  }

  .stat-icon {
    font-size: 24px;
    flex-shrink: 0;
  }

  .stat-content {
    flex: 1;
  }

  .stat-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 32px;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .stat-glow {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  /* Main Grid */
  .main-grid {
    display: grid;
    grid-template-columns: 1fr 1.5fr;
    gap: 24px;
    margin-bottom: 32px;
  }

  /* Panels */
  .panel {
    background: var(--bg-card);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
  }

  .panel-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--text-secondary);
  }

  .panel-title-icon {
    color: var(--accent-cyan);
  }

  .panel-count {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 600;
    padding: 4px 10px;
    background: rgba(0, 240, 255, 0.1);
    color: var(--accent-cyan);
    border-radius: 20px;
  }

  .panel-update {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--text-muted);
  }

  /* Profiles Panel */
  .profiles-list {
    padding: 16px;
    max-height: 500px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .profiles-list::-webkit-scrollbar {
    width: 6px;
  }

  .profiles-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .profiles-list::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 3px;
  }

  .profile-card {
    position: relative;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    transition: all 0.2s;
    animation: fadeIn 0.3s ease-out backwards;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .profile-card:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .profile-card.active {
    border-color: rgba(0, 255, 136, 0.3);
  }

  .profile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .profile-id {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    font-weight: 600;
    color: var(--accent-cyan);
  }

  .profile-status {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--text-muted);
  }

  .profile-status.online {
    background: var(--accent-green);
    box-shadow: 0 0 8px var(--accent-green);
    animation: pulse 2s ease-in-out infinite;
  }

  .persona-emoji {
    font-size: 16px;
  }

  .profile-time {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--text-muted);
  }

  .profile-stats {
    display: flex;
    gap: 16px;
    margin-bottom: 8px;
  }

  .profile-stat {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .profile-sessions {
    font-size: 12px;
    color: var(--text-muted);
  }

  .profile-active-glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 50%, rgba(0, 255, 136, 0.05) 0%, transparent 70%);
    pointer-events: none;
  }

  /* Activity Panel */
  .activity-panel {
    max-height: 600px;
    display: flex;
    flex-direction: column;
  }

  .activity-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }

  .activity-list::-webkit-scrollbar {
    width: 6px;
  }

  .activity-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .activity-list::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 3px;
  }

  .activity-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 24px;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
    transition: background 0.2s;
    animation: slideIn 0.2s ease-out backwards;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .activity-item:hover {
    background: rgba(255, 255, 255, 0.02);
  }

  .activity-time {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--text-muted);
    min-width: 70px;
  }

  .activity-profile {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 600;
    color: var(--accent-cyan);
    min-width: 80px;
  }

  .action-icon {
    font-size: 14px;
    width: 20px;
    text-align: center;
  }

  .activity-action {
    color: var(--text-primary);
    text-transform: capitalize;
  }

  .activity-detail {
    color: var(--text-secondary);
    margin-left: 6px;
  }

  /* Posts Panel */
  .posts-panel {
    max-height: 700px;
  }

  .posts-section {
    border-bottom: 1px solid var(--border);
  }

  .posts-section:last-child {
    border-bottom: none;
  }

  .posts-section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 24px;
    background: rgba(255, 255, 255, 0.02);
    border-bottom: 1px solid var(--border);
  }

  .posts-section-icon {
    font-size: 14px;
  }

  .posts-section-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1px;
    color: var(--text-secondary);
  }

  .posts-section-count {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-muted);
    border-radius: 10px;
    margin-left: auto;
  }

  .posts-list {
    max-height: 280px;
    overflow-y: auto;
  }

  .posts-list::-webkit-scrollbar {
    width: 6px;
  }

  .posts-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .posts-list::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 3px;
  }

  .post-item {
    padding: 14px 24px;
    border-bottom: 1px solid var(--border);
    transition: background 0.2s;
    animation: slideIn 0.2s ease-out backwards;
  }

  .post-item:last-child {
    border-bottom: none;
  }

  .post-item:hover {
    background: rgba(255, 255, 255, 0.02);
  }

  .post-item.scheduled {
    border-left: 3px solid var(--accent-yellow);
  }

  .post-item.posted {
    border-left: 3px solid var(--accent-green);
  }

  .post-item.failed {
    border-left: 3px solid var(--accent-pink);
  }

  .post-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .post-emoji {
    font-size: 14px;
  }

  .post-handle {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 600;
    color: var(--accent-cyan);
  }

  .post-status {
    font-size: 12px;
    margin-left: 4px;
  }

  .post-status.posted {
    color: var(--accent-green);
  }

  .post-status.failed {
    color: var(--accent-pink);
  }

  .post-time {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--text-muted);
    margin-left: auto;
  }

  .post-time.scheduled {
    color: var(--accent-yellow);
  }

  .post-content {
    font-size: 13px;
    color: var(--text-primary);
    line-height: 1.5;
    margin-bottom: 6px;
  }

  .post-error {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--accent-pink);
    margin-top: 6px;
    padding: 6px 10px;
    background: rgba(255, 51, 102, 0.1);
    border-radius: 6px;
  }

  .post-media-badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--accent-purple);
    padding: 2px 6px;
    background: rgba(168, 85, 247, 0.1);
    border-radius: 4px;
    margin-left: 8px;
  }

  /* Post Event Activity Items */
  .post-event-scheduled {
    border-left: 3px solid var(--accent-yellow);
  }

  .post-event-published {
    border-left: 3px solid var(--accent-green);
  }

  .post-event-failed {
    border-left: 3px solid var(--accent-pink);
  }

  .post-content-preview {
    display: block;
    margin-top: 4px;
    font-size: 12px;
    color: var(--text-secondary);
    font-style: normal;
  }

  .post-error-inline {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--accent-pink);
    padding: 2px 8px;
    background: rgba(255, 51, 102, 0.1);
    border-radius: 4px;
    margin-left: auto;
  }

  .empty-hint {
    font-size: 12px;
    color: var(--text-muted);
    opacity: 0.7;
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 48px 24px;
    color: var(--text-muted);
    font-size: 14px;
  }

  .empty-icon {
    font-size: 32px;
    opacity: 0.3;
  }

  /* Footer */
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-top: 1px solid var(--border);
  }

  .footer-brand {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--text-muted);
    letter-spacing: 1px;
  }

  .footer-status {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--accent-green);
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .stats-grid {
      grid-template-columns: 1fr 1fr;
    }

    .stats-grid-posts {
      grid-template-columns: 1fr 1fr 1fr;
    }

    .stat-card-large {
      grid-column: span 2;
      grid-row: span 1;
      flex-direction: row;
      text-align: left;
    }

    .stat-card-large .stat-icon {
      font-size: 32px;
      margin-bottom: 0;
    }

    .stat-card-large .stat-value {
      font-size: 40px;
    }

    .main-grid {
      grid-template-columns: 1fr;
    }

    .header {
      flex-wrap: wrap;
    }

    .header-tabs {
      order: 3;
      width: 100%;
      justify-content: center;
      margin-top: 16px;
    }
  }

  @media (max-width: 640px) {
    .dashboard {
      padding: 16px;
    }

    .header {
      flex-direction: column;
      gap: 20px;
      align-items: flex-start;
    }

    .header-tabs {
      width: 100%;
    }

    .tab-btn {
      flex: 1;
      justify-content: center;
    }

    .header-right {
      width: 100%;
      justify-content: space-between;
    }

    .stats-grid {
      grid-template-columns: 1fr 1fr;
    }

    .stats-grid-posts {
      grid-template-columns: 1fr;
    }

    .stat-card {
      padding: 16px;
    }

    .stat-value {
      font-size: 24px;
    }

    .stat-card-large .stat-value {
      font-size: 32px;
    }

    .stat-card-posts .stat-value {
      font-size: 36px;
    }
  }
`
