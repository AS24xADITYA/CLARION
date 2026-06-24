import { NavLink, Link } from 'react-router-dom'
import { Shield, Scan, AlertTriangle, MessageCircle, Info, Phone } from 'lucide-react'

const navItems = [
  { to: '/scan',     label: 'ScanShield', icon: Scan,          title: 'Detect Fake Currency' },
  { to: '/scam',     label: 'ScamRadar',  icon: AlertTriangle, title: 'Check for Scams' },
  { to: '/fraudbot', label: 'FraudBot',   icon: MessageCircle, title: 'Talk to AI Advisor' },
  { to: '/about',    label: 'About',      icon: Info,          title: 'How It Works' },
]

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-clarion-border"
         style={{ background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-clarion-accent rounded-xl flex items-center justify-center
                            shadow-accent group-hover:scale-110 transition-transform duration-200">
              <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-gradient">CLARION</span>
              <p className="text-[10px] text-clarion-muted leading-none -mt-0.5 font-mono tracking-widest uppercase">
                Digital Safety AI
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon, title }) => (
              <NavLink
                key={to}
                to={to}
                title={title}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                   ${isActive
                     ? 'text-clarion-accent bg-clarion-accent/10'
                     : 'text-clarion-muted hover:text-clarion-text hover:bg-clarion-border/30'
                   }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </div>

          {/* Emergency helpline */}
          <a
            href="tel:1930"
            className="flex items-center gap-2 bg-clarion-danger/10 border border-clarion-danger/40
                       text-clarion-danger rounded-full px-3 py-1.5 text-xs font-bold
                       hover:bg-clarion-danger/20 transition-colors duration-200"
            title="National Cyber Helpline — Available 24×7"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Helpline</span> 1930
          </a>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex items-center justify-around pb-2 pt-1 border-t border-clarion-border/50">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all
                 ${isActive
                   ? 'text-clarion-accent'
                   : 'text-clarion-muted hover:text-clarion-text'
                 }`
              }
            >
              <Icon className="w-4.5 h-4.5" />
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
