import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard, ScanLine, Shield, MessageCircle,
  TrendingUp, AlertTriangle, CheckCircle, Clock,
  Activity, RefreshCw, Scan, Link as LinkIcon,
} from 'lucide-react'
import SkeletonCard from '../components/SkeletonCard'

const API = 'http://localhost:8000'

function StatCard({ label, value, icon: Icon, colorClass, borderClass }) {
  return (
    <div className={`glass-card p-6 border-l-4 ${borderClass} flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}/10`}>
        <Icon className={`w-6 h-6 ${colorClass}`} />
      </div>
      <div>
        <p className="text-3xl font-outfit font-black text-clarion-text">{value ?? '—'}</p>
        <p className="text-sm text-clarion-muted font-medium mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function ThreatLevelGauge({ level, totalChecks }) {
  const config = {
    HIGH:   { color: 'text-clarion-danger', ring: 'border-clarion-danger', bg: 'bg-clarion-danger/10' },
    MEDIUM: { color: 'text-clarion-warning', ring: 'border-clarion-warning', bg: 'bg-clarion-warning/10' },
    LOW:    { color: 'text-clarion-success', ring: 'border-clarion-success', bg: 'bg-clarion-success/10' },
  }[level] || { color: 'text-clarion-muted', ring: 'border-clarion-border', bg: 'bg-clarion-surface2' }

  return (
    <div className="glass-card p-6 flex flex-col items-center justify-center text-center h-full">
      <p className="text-xs font-bold text-clarion-muted uppercase tracking-widest mb-4">
        Current Threat Level
      </p>
      <div className={`w-36 h-36 rounded-full border-8 ${config.ring} ${config.bg} flex items-center justify-center`}>
        <div>
          <p className={`text-2xl font-outfit font-black ${config.color}`}>{level}</p>
          <p className="text-xs text-clarion-muted">RISK</p>
        </div>
      </div>
      <p className="text-xs text-clarion-muted mt-4">
        Based on {totalChecks} scam checks this session
      </p>
    </div>
  )
}

function ScamDistribution({ distribution }) {
  const entries = Object.entries(distribution || {}).filter(([, v]) => v > 0)
  const total = entries.reduce((s, [, v]) => s + v, 0)

  const COLORS = [
    'bg-blue-500', 'bg-red-500', 'bg-amber-500', 'bg-green-500',
    'bg-purple-500', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500',
  ]

  if (entries.length === 0) {
    return (
      <div className="glass-card p-6 flex items-center justify-center h-full">
        <p className="text-clarion-muted text-sm text-center">
          No scam detections this session yet. Run a ScamRadar analysis to see data here.
        </p>
      </div>
    )
  }

  return (
    <div className="glass-card p-6 h-full">
      <p className="text-sm font-bold text-clarion-muted uppercase tracking-widest mb-4">Scam Type Distribution</p>
      <div className="space-y-3">
        {entries.map(([type, count], i) => {
          const pct = Math.round((count / total) * 100)
          return (
            <div key={type}>
              <div className="flex justify-between text-xs text-clarion-muted mb-1">
                <span className="capitalize font-medium">{type.replace(/_/g, ' ')}</span>
                <span>{count} ({pct}%)</span>
              </div>
              <div className="h-2 bg-clarion-surface2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${COLORS[i % COLORS.length]} rounded-full transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ActivityFeed({ items, loading }) {
  if (loading) return <SkeletonCard lines={5} />

  const verdictStyle = (verdict) => {
    if (['GENUINE', 'SAFE'].includes(verdict)) return 'text-clarion-success bg-clarion-success/10 border-clarion-success/20'
    if (['FAKE', 'SCAM_DETECTED'].includes(verdict)) return 'text-clarion-danger bg-clarion-danger/10 border-clarion-danger/20'
    return 'text-clarion-warning bg-clarion-warning/10 border-clarion-warning/20'
  }

  if (!items?.length) {
    return (
      <div className="glass-card p-8 text-center">
        <Activity className="w-10 h-10 text-clarion-muted mx-auto mb-3" />
        <p className="text-clarion-muted">No activity yet. Use any CLARION tool to see entries here.</p>
      </div>
    )
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-clarion-border bg-clarion-surface2">
              <th className="px-4 py-3 text-left text-xs font-bold text-clarion-muted uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-clarion-muted uppercase tracking-wider">Verdict</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-clarion-muted uppercase tracking-wider">Confidence</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-clarion-muted uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-clarion-border">
            {items.map((item, i) => (
              <tr key={i} className="hover:bg-clarion-surface2 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {item.type === 'currency_scan'
                      ? <ScanLine className="w-4 h-4 text-clarion-accent flex-shrink-0" />
                      : <Shield className="w-4 h-4 text-clarion-danger flex-shrink-0" />
                    }
                    <span className="text-clarion-muted capitalize text-xs">
                      {item.type === 'currency_scan' ? `₹${item.denomination} scan` : 'Scam check'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${verdictStyle(item.verdict)}`}>
                    {item.verdict}
                  </span>
                </td>
                <td className="px-4 py-3 text-clarion-muted text-xs font-mono">
                  {Math.round((item.confidence || 0) * 100)}%
                </td>
                <td className="px-4 py-3 text-clarion-muted text-xs">
                  {item.timestamp
                    ? new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                    : '—'
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, recentRes] = await Promise.all([
        fetch(`${API}/api/dashboard/stats`),
        fetch(`${API}/api/dashboard/recent`),
      ])
      if (!statsRes.ok || !recentRes.ok) throw new Error('Failed to fetch')
      const [statsData, recentData] = await Promise.all([statsRes.json(), recentRes.json()])
      setStats(statsData)
      setRecent(recentData.recent_activity || [])
      setLastUpdated(new Date())
      setError(null)
    } catch (e) {
      setError('Dashboard data unavailable. Backend may be starting up.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const QUICK_LINKS = [
    { to: '/scan',      icon: Scan,        label: 'ScanShield',  desc: 'Scan a Currency Note →',     color: 'text-clarion-accent' },
    { to: '/scam',      icon: AlertTriangle, label: 'ScamRadar', desc: 'Check a Scam →',             color: 'text-clarion-danger' },
    { to: '/fraudbot',  icon: MessageCircle, label: 'FraudBot',  desc: 'Talk to FraudBot →',         color: 'text-clarion-success' },
    { to: '/urlscanner', icon: LinkIcon,    label: 'Link Scanner', desc: 'Check a Suspicious Link →', color: 'text-purple-400' },
  ]

  return (
    <div className="min-h-screen pb-20 px-4 py-8 bg-clarion-bg transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-clarion-surface2 border border-clarion-border rounded-xl flex items-center justify-center shadow-sm">
              <LayoutDashboard className="w-6 h-6 text-clarion-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-outfit font-bold text-clarion-text tracking-tight">Command Centre</h1>
              <p className="text-clarion-muted text-sm font-medium mt-0.5">Real-time Threat Intelligence Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <div className="flex items-center gap-2 text-xs text-clarion-muted">
                <Clock className="w-3.5 h-3.5" />
                {lastUpdated.toLocaleTimeString('en-IN')}
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-clarion-success/10 border border-clarion-success/20 text-clarion-success text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-clarion-success animate-pulse" />
              LIVE
            </div>
            <button
              onClick={fetchData}
              className="p-2 rounded-xl bg-clarion-surface2 border border-clarion-border text-clarion-muted hover:text-clarion-accent hover:border-clarion-accent/50 transition-all"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-clarion-danger/10 border border-clarion-danger/30 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-clarion-danger flex-shrink-0 mt-0.5" />
            <p className="text-clarion-danger text-sm">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0,1,2,3].map(i => <SkeletonCard key={i} lines={1} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Currency Scans" value={stats?.total_scans ?? 0} icon={ScanLine} colorClass="text-clarion-accent" borderClass="border-clarion-accent" />
            <StatCard label="Counterfeits Detected" value={stats?.fake_count ?? 0} icon={AlertTriangle} colorClass="text-clarion-danger" borderClass="border-clarion-danger" />
            <StatCard label="Scam Checks" value={stats?.total_scam_checks ?? 0} icon={Shield} colorClass="text-clarion-accent" borderClass="border-clarion-accent" />
            <StatCard label="Scams Detected" value={stats?.scams_detected ?? 0} icon={TrendingUp} colorClass="text-clarion-danger" borderClass="border-clarion-danger" />
          </div>
        )}

        {/* Threat Level + Distribution */}
        {loading ? (
          <div className="grid lg:grid-cols-2 gap-6">
            <SkeletonCard lines={4} />
            <SkeletonCard lines={4} />
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            <ThreatLevelGauge level={stats?.threat_level ?? 'LOW'} totalChecks={stats?.total_scam_checks ?? 0} />
            <ScamDistribution distribution={stats?.scam_type_distribution} />
          </div>
        )}

        {/* Recent Activity */}
        <div>
          <h2 className="section-heading text-xl mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-clarion-accent" /> Recent Activity
          </h2>
          <ActivityFeed items={recent} loading={loading} />
        </div>

        {/* Quick Access */}
        <div>
          <h2 className="section-heading text-xl mb-4">Quick Access</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_LINKS.map(({ to, icon: Icon, label, desc, color }) => (
              <Link
                key={to}
                to={to}
                className="glass-card p-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-200 group"
              >
                <div className={`w-10 h-10 rounded-xl bg-clarion-surface2 border border-clarion-border flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <p className="font-outfit font-bold text-clarion-text mb-1">{label}</p>
                <p className={`text-xs font-semibold ${color}`}>{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
