'use client'

import { useEffect, useState, useRef } from 'react'

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

export default function PostsPage() {
  const [data, setData] = useState<PostsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [activeSection, setActiveSection] = useState<'scheduled' | 'posted' | 'failed'>('scheduled')

  const fetchData = async () => {
    try {
      const res = await fetch('/api/posts')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setData(json)
      setError(null)
      setLastUpdate(new Date())
    } catch (err) {
      setError('Connection lost')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const formatDateTime = (ts: number | string) => {
    const date = typeof ts === 'string' ? new Date(ts) : new Date(ts)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const getTimeUntil = (scheduledFor: string) => {
    const diff = new Date(scheduledFor).getTime() - Date.now()
    if (diff < 0) return 'overdue'
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `in ${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `in ${hours}h ${mins % 60}m`
    return `in ${Math.floor(hours / 24)}d`
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

  const getTweetUrl = (handle: string, tweetId: string) => {
    const cleanHandle = handle.replace('@', '')
    return `https://x.com/${cleanHandle}/status/${tweetId}`
  }

  // Filter events by type
  const scheduledEvents = data?.recentEvents?.filter(e => e.action === 'post_scheduled') || []
  const postedEvents = data?.recentEvents?.filter(e => e.action === 'post_published') || []
  const failedEvents = data?.recentEvents?.filter(e => e.action === 'post_failed') || []

  // Sort scheduled by scheduledFor time
  const sortedScheduled = [...scheduledEvents].sort((a, b) => {
    const timeA = a.details?.scheduledFor ? new Date(a.details.scheduledFor).getTime() : 0
    const timeB = b.details?.scheduledFor ? new Date(b.details.scheduledFor).getTime() : 0
    return timeA - timeB
  })

  // Sort posted by timestamp (most recent first)
  const sortedPosted = [...postedEvents].sort((a, b) => b.timestamp - a.timestamp)

  // Sort failed by timestamp (most recent first)
  const sortedFailed = [...failedEvents].sort((a, b) => b.timestamp - a.timestamp)

  const totals = data?.totals || { scheduled: 0, posted: 0, failed: 0 }

  return (
    <>
      <style>{globalStyles}</style>

      <div className="dashboard">
        <div className="bg-grid" />
        <div className="bg-glow bg-glow-1" />
        <div className="bg-glow bg-glow-2" />

        <header className="header">
          <div className="header-left">
            <div className="logo">
              <span className="logo-icon">⬡</span>
              <span className="logo-text">X CONTROL</span>
              <span className="logo-badge">v2</span>
            </div>
            <LivePulse />
          </div>

          <div className="header-tabs">
            <a href="/warmup" className="tab-btn">
              <span className="tab-icon">♥</span>
              Warmup
            </a>
            <a href="/posts" className="tab-btn active">
              <span className="tab-icon">✎</span>
              Posts
            </a>
          </div>

          <div className="header-right">
            <div className="header-stat">
              <span className="header-stat-value">{totals.scheduled}</span>
              <span className="header-stat-label">QUEUED</span>
            </div>
            <div className="header-stat active">
              <span className="header-stat-value">{totals.posted}</span>
              <span className="header-stat-label">POSTED</span>
            </div>
            <div className="header-date">
              {data?.date || '—'}
            </div>
          </div>
        </header>

        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠</span>
            {error}
            <span className="error-retry" onClick={fetchData}>Retry</span>
          </div>
        )}

        {/* Stats Grid */}
        <section className="stats-grid stats-grid-posts">
          <button
            className={`stat-card stat-card-posts clickable ${activeSection === 'scheduled' ? 'selected' : ''}`}
            onClick={() => setActiveSection('scheduled')}
          >
            <div className="stat-icon" style={{ color: '#ffcc00' }}>⏱</div>
            <div className="stat-content">
              <div className="stat-value">
                <AnimatedNumber value={totals.scheduled} />
              </div>
              <div className="stat-label">Scheduled</div>
            </div>
            <div className="stat-glow" style={{ background: 'radial-gradient(circle at center, rgba(255,204,0,0.15) 0%, transparent 70%)' }} />
          </button>

          <button
            className={`stat-card stat-card-posts clickable ${activeSection === 'posted' ? 'selected' : ''}`}
            onClick={() => setActiveSection('posted')}
          >
            <div className="stat-icon" style={{ color: '#00ff88' }}>✓</div>
            <div className="stat-content">
              <div className="stat-value">
                <AnimatedNumber value={totals.posted} />
              </div>
              <div className="stat-label">Posted</div>
            </div>
            <div className="stat-glow" style={{ background: 'radial-gradient(circle at center, rgba(0,255,136,0.15) 0%, transparent 70%)' }} />
          </button>

          <button
            className={`stat-card stat-card-posts clickable ${activeSection === 'failed' ? 'selected' : ''}`}
            onClick={() => setActiveSection('failed')}
          >
            <div className="stat-icon" style={{ color: '#ff3366' }}>✕</div>
            <div className="stat-content">
              <div className="stat-value">
                <AnimatedNumber value={totals.failed} />
              </div>
              <div className="stat-label">Failed</div>
            </div>
            <div className="stat-glow" style={{ background: 'radial-gradient(circle at center, rgba(255,51,102,0.15) 0%, transparent 70%)' }} />
          </button>
        </section>

        {/* Main Content - Full Width Post List */}
        <div className="posts-container">
          {/* Section Header */}
          <div className="section-header">
            <h2 className="section-title">
              {activeSection === 'scheduled' && (
                <>
                  <span className="section-icon" style={{ color: '#ffcc00' }}>⏱</span>
                  SCHEDULED QUEUE
                  <span className="section-count">{sortedScheduled.length}</span>
                </>
              )}
              {activeSection === 'posted' && (
                <>
                  <span className="section-icon" style={{ color: '#00ff88' }}>✓</span>
                  POSTED (LAST 24H)
                  <span className="section-count">{sortedPosted.length}</span>
                </>
              )}
              {activeSection === 'failed' && (
                <>
                  <span className="section-icon" style={{ color: '#ff3366' }}>✕</span>
                  FAILED
                  <span className="section-count">{sortedFailed.length}</span>
                </>
              )}
            </h2>
            {lastUpdate && (
              <span className="section-update">
                Updated {formatTime(lastUpdate.getTime())}
              </span>
            )}
          </div>

          {/* Posts List */}
          <div className="posts-list">
            {/* Scheduled Section */}
            {activeSection === 'scheduled' && (
              <>
                {sortedScheduled.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">◇</span>
                    <span>No scheduled posts</span>
                    <span className="empty-hint">Posts will appear here when they're queued</span>
                  </div>
                ) : (
                  sortedScheduled.map((event, i) => {
                    const meta = data?.personas.find(p => p.personaId === event.personaId)
                    return (
                      <div key={`${event.timestamp}-${i}`} className="post-card scheduled">
                        <div className="post-card-header">
                          <div className="post-card-meta">
                            <span className="post-emoji">{meta?.emoji || '•'}</span>
                            <span className="post-handle">{event.handle || meta?.handle || event.personaId}</span>
                            {event.details?.originalAuthor && (
                              <span className="post-source">via {event.details.originalAuthor}</span>
                            )}
                          </div>
                          <div className="post-card-time">
                            {event.details?.scheduledFor && (
                              <>
                                <span className="time-label">{formatDateTime(event.details.scheduledFor)}</span>
                                <span className="time-countdown">{getTimeUntil(event.details.scheduledFor)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="post-card-content">
                          {event.details?.content || 'No content'}
                        </div>
                        {event.details?.mediaIncluded && (
                          <div className="post-card-badges">
                            <span className="badge badge-media">📎 Media attached</span>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </>
            )}

            {/* Posted Section */}
            {activeSection === 'posted' && (
              <>
                {sortedPosted.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">◇</span>
                    <span>No posts published yet</span>
                    <span className="empty-hint">Successful posts will appear here with links</span>
                  </div>
                ) : (
                  sortedPosted.map((event, i) => {
                    const meta = data?.personas.find(p => p.personaId === event.personaId)
                    const handle = event.handle || meta?.handle || event.personaId
                    const tweetUrl = event.details?.tweetId ? getTweetUrl(handle, event.details.tweetId) : null
                    return (
                      <div key={`${event.timestamp}-${i}`} className="post-card posted">
                        <div className="post-card-header">
                          <div className="post-card-meta">
                            <span className="post-emoji">{meta?.emoji || '•'}</span>
                            <span className="post-handle">{handle}</span>
                            {event.details?.originalAuthor && (
                              <span className="post-source">via {event.details.originalAuthor}</span>
                            )}
                          </div>
                          <div className="post-card-time">
                            <span className="time-label">{getRelativeTime(event.timestamp)}</span>
                            {tweetUrl && (
                              <a href={tweetUrl} target="_blank" rel="noopener noreferrer" className="tweet-link">
                                View Tweet →
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="post-card-content">
                          {event.details?.content || 'No content'}
                        </div>
                        {event.details?.mediaIncluded && (
                          <div className="post-card-badges">
                            <span className="badge badge-media">📎 Media attached</span>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </>
            )}

            {/* Failed Section */}
            {activeSection === 'failed' && (
              <>
                {sortedFailed.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">◇</span>
                    <span>No failed posts</span>
                    <span className="empty-hint">Failed posts will appear here with error details</span>
                  </div>
                ) : (
                  sortedFailed.map((event, i) => {
                    const meta = data?.personas.find(p => p.personaId === event.personaId)
                    return (
                      <div key={`${event.timestamp}-${i}`} className="post-card failed">
                        <div className="post-card-header">
                          <div className="post-card-meta">
                            <span className="post-emoji">{meta?.emoji || '•'}</span>
                            <span className="post-handle">{event.handle || meta?.handle || event.personaId}</span>
                            {event.details?.originalAuthor && (
                              <span className="post-source">via {event.details.originalAuthor}</span>
                            )}
                          </div>
                          <div className="post-card-time">
                            <span className="time-label">{getRelativeTime(event.timestamp)}</span>
                          </div>
                        </div>
                        <div className="post-card-content">
                          {event.details?.content || 'No content'}
                        </div>
                        {event.details?.error && (
                          <div className="post-card-error">
                            <span className="error-label">Error:</span> {event.details.error}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </>
            )}
          </div>
        </div>

        {/* Accounts Summary */}
        <div className="accounts-summary">
          <div className="accounts-header">
            <h3 className="accounts-title">ACCOUNTS OVERVIEW</h3>
          </div>
          <div className="accounts-grid">
            {data?.personas?.map((persona) => (
              <div key={persona.personaId} className="account-chip">
                <span className="account-emoji">{persona.emoji}</span>
                <span className="account-handle">{persona.handle}</span>
                <div className="account-stats">
                  <span className="chip-stat scheduled">{persona.scheduled}</span>
                  <span className="chip-stat posted">{persona.posted}</span>
                  <span className="chip-stat failed">{persona.failed}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

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
    text-decoration: none;
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

  .stat-card.clickable {
    cursor: pointer;
  }

  .stat-card.selected {
    border-color: var(--accent-cyan);
    box-shadow: 0 0 30px rgba(0, 240, 255, 0.15);
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

  /* Posts Container */
  .posts-container {
    background: var(--bg-card);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 24px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--text-primary);
  }

  .section-icon {
    font-size: 18px;
  }

  .section-count {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 600;
    padding: 4px 10px;
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-secondary);
    border-radius: 20px;
  }

  .section-update {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--text-muted);
  }

  .posts-list {
    max-height: 500px;
    overflow-y: auto;
    padding: 16px;
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

  /* Post Cards */
  .post-card {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    transition: all 0.2s;
    animation: fadeIn 0.3s ease-out backwards;
  }

  .post-card:last-child {
    margin-bottom: 0;
  }

  .post-card:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .post-card.scheduled {
    border-left: 3px solid var(--accent-yellow);
  }

  .post-card.posted {
    border-left: 3px solid var(--accent-green);
  }

  .post-card.failed {
    border-left: 3px solid var(--accent-pink);
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

  .post-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .post-card-meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .post-emoji {
    font-size: 18px;
  }

  .post-handle {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    font-weight: 600;
    color: var(--accent-cyan);
  }

  .post-source {
    font-size: 12px;
    color: var(--text-muted);
  }

  .post-card-time {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }

  .time-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--text-muted);
  }

  .time-countdown {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 600;
    color: var(--accent-yellow);
  }

  .tweet-link {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    color: var(--accent-cyan);
    text-decoration: none;
    padding: 4px 10px;
    background: rgba(0, 240, 255, 0.1);
    border-radius: 6px;
    transition: all 0.2s;
  }

  .tweet-link:hover {
    background: rgba(0, 240, 255, 0.2);
  }

  .post-card-content {
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-primary);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .post-card-badges {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }

  .badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 6px;
  }

  .badge-media {
    background: rgba(168, 85, 247, 0.1);
    color: var(--accent-purple);
  }

  .post-card-error {
    margin-top: 12px;
    padding: 10px 12px;
    background: rgba(255, 51, 102, 0.1);
    border-radius: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: var(--accent-pink);
  }

  .error-label {
    font-weight: 600;
  }

  /* Accounts Summary */
  .accounts-summary {
    background: var(--bg-card);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 32px;
  }

  .accounts-header {
    margin-bottom: 16px;
  }

  .accounts-title {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--text-secondary);
  }

  .accounts-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .account-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border);
    border-radius: 20px;
    transition: all 0.2s;
  }

  .account-chip:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .account-emoji {
    font-size: 14px;
  }

  .account-handle {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .account-stats {
    display: flex;
    gap: 6px;
  }

  .chip-stat {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .chip-stat.scheduled {
    background: rgba(255, 204, 0, 0.1);
    color: var(--accent-yellow);
  }

  .chip-stat.posted {
    background: rgba(0, 255, 136, 0.1);
    color: var(--accent-green);
  }

  .chip-stat.failed {
    background: rgba(255, 51, 102, 0.1);
    color: var(--accent-pink);
  }

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

  .empty-hint {
    font-size: 12px;
    color: var(--text-muted);
    opacity: 0.7;
  }

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

  @media (max-width: 1024px) {
    .stats-grid-posts {
      grid-template-columns: 1fr 1fr 1fr;
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

    .stats-grid-posts {
      grid-template-columns: 1fr;
    }

    .stat-card {
      padding: 16px;
    }

    .stat-value {
      font-size: 24px;
    }

    .stat-card-posts .stat-value {
      font-size: 36px;
    }

    .accounts-grid {
      flex-direction: column;
    }

    .account-chip {
      width: 100%;
      justify-content: space-between;
    }
  }
`
