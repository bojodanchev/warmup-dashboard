'use client'

import { useEffect, useState, useRef } from 'react'

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

interface DashboardData {
  date: string
  profiles: Record<string, ProfileStats>
  recentEvents: ActivityEvent[]
}

// Animated counter component
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
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
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

// Live pulse indicator
function LivePulse() {
  return (
    <span className="live-pulse">
      <span className="pulse-dot" />
      <span className="pulse-text">LIVE</span>
    </span>
  )
}

// Action icon component with glow
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

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchData = async () => {
    try {
      const res = await fetch('/api/stats')
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
              <span className="logo-text">WARMUP</span>
              <span className="logo-badge">CTRL</span>
            </div>
            <LivePulse />
          </div>
          <div className="header-right">
            <div className="header-stat">
              <span className="header-stat-value">{profileCount}</span>
              <span className="header-stat-label">PROFILES</span>
            </div>
            <div className="header-stat active">
              <span className="header-stat-value">{activeProfiles}</span>
              <span className="header-stat-label">ACTIVE</span>
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

        {/* Footer */}
        <footer className="footer">
          <div className="footer-left">
            <span className="footer-brand">WARMUP CONTROL v1.0</span>
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

    .header-right {
      width: 100%;
      justify-content: space-between;
    }

    .stats-grid {
      grid-template-columns: 1fr 1fr;
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
  }
`
