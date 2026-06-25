import { Shield, ShieldAlert, ShieldCheck, Phone, ExternalLink } from 'lucide-react'

/**
 * ChatBubble — Message bubble for FraudBot chat interface.
 * Props:
 *   role: 'user' | 'assistant'
 *   content: string (markdown-like with **bold**, bullet lists, links)
 *   riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | null
 *   timestamp: Date
 */
export default function ChatBubble({ role, content, riskLevel, timestamp }) {
  const isUser = role === 'user'

  const formatTime = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  /**
   * Full markdown renderer supporting:
   * - **bold** text
   * - Lines starting with • or - or * as bullet items
   * - Lines starting with 1. 2. etc as numbered items
   * - Auto-linkify: cybercrime.gov.in and 1930
   */
  const renderLine = (line, idx) => {
    const isBullet   = /^[•\-\*]\s/.test(line.trimStart())
    const isNumbered = /^\d+\.\s/.test(line.trimStart())

    const renderInline = (text) => {
      // Split on **bold**, URLs, phone number 1930
      const tokens = text.split(/(\*\*[^*]+\*\*|cybercrime\.gov\.in|1930)/g)
      return tokens.map((token, i) => {
        if (token.startsWith('**') && token.endsWith('**')) {
          return <strong key={i} className="font-semibold text-clarion-text">{token.slice(2, -2)}</strong>
        }
        if (token === 'cybercrime.gov.in') {
          return (
            <a key={i} href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer"
               className="text-clarion-accent underline hover:opacity-80 transition-opacity inline-flex items-center gap-0.5">
              cybercrime.gov.in<ExternalLink className="w-3 h-3 inline ml-0.5" />
            </a>
          )
        }
        if (token === '1930' && !isUser) {
          return (
            <a key={i} href="tel:1930"
               className="text-clarion-danger font-bold hover:underline inline-flex items-center gap-0.5">
              <Phone className="w-3 h-3 inline" />1930
            </a>
          )
        }
        return <span key={i}>{token}</span>
      })
    }

    const content = isBullet
      ? line.trimStart().replace(/^[•\-\*]\s/, '')
      : isNumbered
      ? line.trimStart().replace(/^\d+\.\s/, '')
      : line

    if (isBullet) {
      return (
        <li key={idx} className="flex items-start gap-2 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-clarion-muted mt-1.5 flex-shrink-0" />
          <span>{renderInline(content)}</span>
        </li>
      )
    }
    if (isNumbered) {
      const num = line.trimStart().match(/^(\d+)\./)?.[1] || idx + 1
      return (
        <li key={idx} className="flex items-start gap-2 mt-1">
          <span className="text-clarion-accent font-bold text-xs min-w-[16px] mt-0.5 flex-shrink-0">{num}.</span>
          <span>{renderInline(content)}</span>
        </li>
      )
    }
    if (!line.trim()) return <div key={idx} className="h-2" />
    return <p key={idx} className={idx > 0 ? 'mt-1.5' : ''}>{renderInline(line)}</p>
  }

  const renderContent = (text) => {
    const lines = text.split('\n')
    const elements = []
    let listBuffer = []
    let listType = null // 'bullet' | 'numbered'

    const flushList = () => {
      if (listBuffer.length === 0) return
      elements.push(
        <ul key={`list-${elements.length}`} className="space-y-0.5 mt-1 pl-0">
          {listBuffer}
        </ul>
      )
      listBuffer = []
      listType = null
    }

    lines.forEach((line, idx) => {
      const isBullet   = /^[•\-\*]\s/.test(line.trimStart())
      const isNumbered = /^\d+\.\s/.test(line.trimStart())

      if (isBullet || isNumbered) {
        const newType = isBullet ? 'bullet' : 'numbered'
        if (listType && listType !== newType) flushList()
        listType = newType
        listBuffer.push(renderLine(line, idx))
      } else {
        flushList()
        elements.push(renderLine(line, idx))
      }
    })
    flushList()
    return elements
  }

  // Risk level badge config
  const riskConfig = {
    HIGH:   { icon: ShieldAlert, cls: 'bg-clarion-danger/20 border-clarion-danger/40 text-clarion-danger', label: 'HIGH RISK' },
    MEDIUM: { icon: Shield,      cls: 'bg-yellow-900/30 border-yellow-600/40 text-yellow-400',             label: 'MEDIUM RISK' },
    LOW:    { icon: ShieldCheck, cls: 'bg-clarion-success/20 border-clarion-success/40 text-clarion-success', label: 'LOW RISK' },
  }

  const riskBadge = riskLevel && !isUser ? (() => {
    const cfg = riskConfig[riskLevel]
    if (!cfg) return null
    return (
      <div className={`flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full w-fit text-xs font-bold border animate-fade-in ${cfg.cls}`}>
        <cfg.icon className="w-3 h-3" />
        {cfg.label}
      </div>
    )
  })() : null

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      {/* Bot avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-clarion-accent/20 border border-clarion-accent/30
                        flex items-center justify-center flex-shrink-0 mr-3 mt-1">
          <Shield className="w-4 h-4 text-clarion-accent" />
        </div>
      )}

      <div className={`max-w-[80%] ${isUser ? 'max-w-[70%]' : ''}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? 'bg-clarion-accent text-white rounded-tr-sm'
            : 'bg-clarion-surface border border-clarion-border text-clarion-text rounded-tl-sm'
          }`}>
          {renderContent(content)}
        </div>

        {/* Risk badge */}
        {riskBadge}

        {/* Timestamp */}
        <p className={`text-[10px] text-clarion-muted mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatTime(timestamp)}
        </p>
      </div>
    </div>
  )
}
