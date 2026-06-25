import { Link, useLocation } from 'react-router-dom'
import { Shield, Search, MessageSquare, AlertTriangle, Menu, X, Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'

export default function Navbar() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const { isDark, toggleTheme } = useTheme()

  const links = [
    { name: 'ScanShield', path: '/scan',     icon: Search },
    { name: 'ScamRadar',  path: '/scam',     icon: AlertTriangle },
    { name: 'FraudBot',   path: '/fraudbot', icon: MessageSquare },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-clarion-surface/80 backdrop-blur-xl border-b border-clarion-border transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" onClick={() => setIsOpen(false)}>
            <div className="w-9 h-9 rounded-xl bg-clarion-accent/10 border border-clarion-accent/20 flex items-center justify-center
                            group-hover:bg-clarion-accent/20 transition-all duration-300">
              <Shield className="w-5 h-5 text-clarion-accent" />
            </div>
            <span className="font-outfit font-bold text-xl tracking-wide text-clarion-text">CLARION</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {links.map((link) => {
              const active = location.pathname === link.path
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 text-sm font-medium transition-all duration-200 px-3 py-2 rounded-lg
                    ${active ? 'text-clarion-accent bg-clarion-accent/10' : 'text-clarion-muted hover:text-clarion-text hover:bg-clarion-surface2'}`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.name}
                </Link>
              )
            })}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 ml-2 rounded-xl bg-clarion-surface2 border border-clarion-border text-clarion-muted
                         hover:text-clarion-accent hover:border-clarion-accent/50 transition-all duration-300"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            {/* Theme Toggle (Mobile) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-clarion-surface2 border border-clarion-border text-clarion-muted
                         hover:text-clarion-accent transition-all duration-300"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-clarion-muted hover:text-clarion-text hover:bg-clarion-surface2 transition-colors"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-clarion-surface border-b border-clarion-border animate-fade-in absolute w-full shadow-xl">
          <div className="px-4 py-3 space-y-1">
            {links.map((link) => {
              const active = location.pathname === link.path
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                    ${active ? 'bg-clarion-accent/10 text-clarion-accent' : 'text-clarion-muted hover:bg-clarion-surface2 hover:text-clarion-text'}`}
                >
                  <link.icon className="w-5 h-5" />
                  {link.name}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}
