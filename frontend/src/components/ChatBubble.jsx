import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react'

/**
 * ChatBubble — Message bubble for FraudBot chat interface.
 * Props:
 *   role: 'user' | 'assistant'
 *   content: string (markdown-like with **bold** support)
 *   riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | null
 *   timestamp: Date
 */
export default function ChatBubble({ role, content, riskLevel, timestamp }) {
  const isUser = role === 'user'

  // Simple markdown renderer: **bold**, \n newlines, bullet *
  const renderContent = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-clarion-text">{part.slice(2, -2)}</strong>
      }
      return <span key={i}>{part}</span>
    })
  }

  const formatTime = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  // Risk level badge
  const riskBadge = riskLevel && !isUser ? (
    <div className={`flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full w-fit text-xs font-bold
      ${riskLevel === 'HIGH'
        ? 'bg-clarion-danger/20 border border-clarion-danger/40 text-clarion-danger'
        : riskLevel === 'MEDIUM'
        ? 'bg-yellow-900/30 border border-yellow-600/40 text-yellow-400'
        : 'bg-clarion-success/20 border border-clarion-success/40 text-clarion-success'
      }`}>
      {riskLevel === 'HIGH'   && <ShieldAlert className="w-3 h-3" />}
      {riskLevel === 'MEDIUM' && <Shield      className="w-3 h-3" />}
      {riskLevel === 'LOW'    && <ShieldCheck className="w-3 h-3" />}
      {riskLevel} RISK
    </div>
  ) : null

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
          {/* Render content with line breaks */}
          {content.split('\n').map((line, i) => (
            <p key={i} className={i > 0 ? 'mt-1.5' : ''}>
              {renderContent(line)}
            </p>
          ))}
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
