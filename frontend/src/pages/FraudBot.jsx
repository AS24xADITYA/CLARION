import { useState, useRef, useEffect, useCallback } from 'react'
import {
  MessageCircle, Send, Phone, ExternalLink, AlertTriangle,
  Shield, ShieldCheck, ShieldAlert, RotateCcw, Cpu, Wifi,
  CheckCircle2, Circle, ChevronRight,
} from 'lucide-react'
import ChatBubble from '../components/ChatBubble'
import LanguageSelector from '../components/LanguageSelector'
import ConfirmModal from '../components/ConfirmModal'
import { sendFraudBotMessage } from '../services/api'

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_CHARS = 2000

const INITIAL_MESSAGE = {
  role: 'assistant',
  content:
    'Hello! I am **FraudBot**, your personal fraud safety advisor.\n\nDescribe the suspicious call or message you received, and I will guide you through a quick 4-step assessment to determine if it is a fraud.\n\nI support English, Hindi, Marathi, Tamil, Telugu, and Bengali — simply write in your preferred language.',
  timestamp: new Date(),
  riskLevel: null,
}

// Steps for the visual progress tracker
const STEPS = [
  { id: 1, label: 'Contact Method', short: 'Contact' },
  { id: 2, label: 'Their Claim',   short: 'Claim'   },
  { id: 3, label: 'Demand Made',   short: 'Demand'  },
  { id: 4, label: 'Threat/Urgency', short: 'Threat' },
]

// Suggested replies per step (indexed 1–4, shown after each bot question)
const SUGGESTED_REPLIES = {
  1: ['Phone call', 'WhatsApp message', 'Video call', 'SMS'],
  2: ['Claimed to be a government officer', 'Said my account is in trouble', 'Offered a prize or job'],
  3: ['Yes, they asked for money', 'Yes, they asked for OTP', 'No, they did not ask for anything'],
  4: ['Yes, they threatened arrest', 'Yes, they said act immediately', 'No threats were made'],
}

function generateSessionId() {
  try { return crypto.randomUUID() }
  catch { return Math.random().toString(36).slice(2) + Date.now() }
}

// ─── Step Progress Bar ────────────────────────────────────────────────────────
function StepProgress({ currentStep, riskLevel }) {
  if (currentStep < 1) return null

  const riskColor = {
    HIGH:   'text-clarion-danger border-clarion-danger/40 bg-clarion-danger/10',
    MEDIUM: 'text-yellow-400 border-yellow-500/40 bg-yellow-900/20',
    LOW:    'text-clarion-success border-clarion-success/40 bg-clarion-success/10',
  }

  return (
    <div className="px-4 py-3 border-b border-clarion-border bg-clarion-surface/50">
      {riskLevel ? (
        // Verdict state — show final result bar
        <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold ${riskColor[riskLevel] || riskColor.LOW}`}>
          {riskLevel === 'HIGH'   && <ShieldAlert className="w-4 h-4" />}
          {riskLevel === 'MEDIUM' && <Shield className="w-4 h-4" />}
          {riskLevel === 'LOW'    && <ShieldCheck className="w-4 h-4" />}
          Assessment Complete — {riskLevel} RISK
        </div>
      ) : (
        // Progress state — show step indicators
        <div className="flex items-center gap-1">
          {STEPS.map((step, i) => {
            const stepNum   = step.id
            const isDone    = currentStep > stepNum
            const isCurrent = currentStep === stepNum

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className={`flex items-center gap-1.5 flex-1 ${isCurrent ? 'opacity-100' : isDone ? 'opacity-70' : 'opacity-30'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300
                    ${isDone    ? 'bg-clarion-accent text-white'
                    : isCurrent ? 'bg-clarion-accent/30 border-2 border-clarion-accent text-clarion-accent'
                    :             'bg-clarion-surface2 border border-clarion-border text-clarion-muted'}`}>
                    {isDone
                      ? <CheckCircle2 className="w-3 h-3" />
                      : <span className="text-[9px] font-bold">{stepNum}</span>
                    }
                  </div>
                  <span className={`text-[10px] font-semibold hidden sm:block whitespace-nowrap
                    ${isCurrent ? 'text-clarion-accent' : isDone ? 'text-clarion-text' : 'text-clarion-muted'}`}>
                    {step.short}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-1 transition-all duration-500 ${isDone ? 'bg-clarion-accent' : 'bg-clarion-border'}`} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Verdict Card ─────────────────────────────────────────────────────────────
function VerdictCard({ riskLevel }) {
  if (!riskLevel) return null

  const config = {
    HIGH: {
      icon: ShieldAlert,
      title: '⚠️ This Is a Scam',
      subtitle: 'Immediate action required',
      border: 'border-clarion-danger/40',
      bg: 'bg-clarion-danger/8',
      titleColor: 'text-clarion-danger',
      badgeCls: 'bg-clarion-danger text-white',
    },
    MEDIUM: {
      icon: Shield,
      title: '🟡 Proceed with Caution',
      subtitle: 'Verify before acting',
      border: 'border-yellow-500/40',
      bg: 'bg-yellow-900/10',
      titleColor: 'text-yellow-400',
      badgeCls: 'bg-yellow-600 text-white',
    },
    LOW: {
      icon: ShieldCheck,
      title: '✅ Appears Legitimate',
      subtitle: 'Stay cautious regardless',
      border: 'border-clarion-success/40',
      bg: 'bg-clarion-success/8',
      titleColor: 'text-clarion-success',
      badgeCls: 'bg-clarion-success text-white',
    },
  }[riskLevel]

  if (!config) return null

  return (
    <div className={`mx-0 mb-3 p-4 rounded-2xl border ${config.border} ${config.bg} animate-slide-up`}>
      <div className="flex items-start gap-3 mb-3">
        <config.icon className={`w-6 h-6 flex-shrink-0 mt-0.5 ${config.titleColor}`} />
        <div className="flex-1 min-w-0">
          <p className={`font-black text-lg ${config.titleColor}`}>{config.title}</p>
          <p className="text-clarion-muted text-xs">{config.subtitle}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider flex-shrink-0 ${config.badgeCls}`}>
          {riskLevel}
        </span>
      </div>

      {riskLevel === 'HIGH' && (
        <div className="flex gap-2 flex-wrap">
          <a href="tel:1930"
             className="flex items-center gap-1.5 bg-clarion-danger text-white font-bold
                        px-4 py-2 rounded-xl text-sm hover:bg-red-500 transition-colors flex-shrink-0">
            <Phone className="w-4 h-4" /> Call 1930 Now
          </a>
          <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-1.5 border border-clarion-danger/50 text-clarion-danger font-semibold
                        px-4 py-2 rounded-xl text-sm hover:bg-clarion-danger/10 transition-colors">
            <ExternalLink className="w-4 h-4" /> File Report
          </a>
        </div>
      )}
    </div>
  )
}

// ─── Mode Badge ───────────────────────────────────────────────────────────────
function ModeBadge({ modelType }) {
  const modes = {
    ollama_llm:  { icon: Cpu,  label: 'AI Model · Local',  cls: 'text-clarion-accent border-clarion-accent/30 bg-clarion-accent/10' },
    groq_llm:    { icon: Wifi, label: 'AI Model · Cloud',  cls: 'text-purple-400 border-purple-400/30 bg-purple-900/20' },
    rule_based:  { icon: Shield, label: 'Offline Mode',    cls: 'text-clarion-muted border-clarion-border bg-clarion-surface2' },
  }
  const m = modes[modelType] || modes.rule_based

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${m.cls}`}>
      <m.icon className="w-3 h-3" />
      <span className="hidden sm:inline">{m.label}</span>
    </div>
  )
}

// ─── Suggested Reply Chips ────────────────────────────────────────────────────
function SuggestedReplies({ step, onSelect }) {
  const replies = SUGGESTED_REPLIES[step]
  if (!replies) return null

  return (
    <div className="flex flex-wrap gap-1.5 px-4 pb-2 animate-fade-in">
      {replies.map((reply) => (
        <button
          key={reply}
          onClick={() => onSelect(reply)}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full
                     bg-clarion-surface2 border border-clarion-border
                     text-clarion-muted hover:text-clarion-accent hover:border-clarion-accent/40
                     transition-all duration-200 hover:-translate-y-0.5"
        >
          <ChevronRight className="w-3 h-3" />
          {reply}
        </button>
      ))}
    </div>
  )
}

// ─── Main FraudBot Page ───────────────────────────────────────────────────────
export default function FraudBot() {
  const [messages, setMessages]           = useState([INITIAL_MESSAGE])
  const [input, setInput]                 = useState('')
  const [isSending, setIsSending]         = useState(false)
  const [language, setLanguage]           = useState('auto')
  const [detectedLang, setDetectedLang]   = useState(null)
  const [sessionId, setSessionId]         = useState(() => generateSessionId())
  const [verdictRisk, setVerdictRisk]     = useState(null)
  const [modelType, setModelType]         = useState('rule_based')
  const [error, setError]                 = useState(null)
  const [llmStatus, setLlmStatus]         = useState(null)   // null=loading, obj=fetched
  const [showResetModal, setShowResetModal] = useState(false)

  const chatEndRef  = useRef(null)
  const inputRef    = useRef(null)
  const messagesRef = useRef(messages)
  messagesRef.current = messages

  // Fetch LLM status on mount
  useEffect(() => {
    fetch('http://localhost:8000/api/fraudbot/status')
      .then(r => r.json())
      .then(data => setLlmStatus(data))
      .catch(() => setLlmStatus({ available: false, mode: 'unavailable', model: null }))
  }, [])

  // Auto-scroll on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  // Detect current assessment step from message history
  const currentStep = Math.min(
    messages.filter((m) => m.role === 'assistant').length,
    4
  )

  const buildHistory = useCallback(() =>
    messagesRef.current
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content })),
    []
  )

  const handleSend = useCallback(async (overrideText) => {
    const userText = (overrideText || input).trim()
    if (!userText || isSending) return

    setInput('')
    setError(null)

    const userMsg = { role: 'user', content: userText, timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setIsSending(true)

    const history = buildHistory()

    const { data, error: apiError } = await sendFraudBotMessage(
      userText,
      sessionId,
      history,
      language === 'auto' ? null : language,
    )

    setIsSending(false)

    if (apiError) {
      setError(apiError)
      return
    }

    if (data) {
      if (data.language_detected) setDetectedLang(data.language_detected)
      if (data.model_type)        setModelType(data.model_type)
      if (data.risk_level)        setVerdictRisk(data.risk_level)

      const botMsg = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        riskLevel: data.risk_level,
      }
      setMessages((prev) => [...prev, botMsg])
    }
  }, [input, isSending, sessionId, language, buildHistory])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function resetChat() {
    setShowResetModal(true)
  }

  function confirmReset() {
    setMessages([INITIAL_MESSAGE])
    setSessionId(generateSessionId())
    setVerdictRisk(null)
    setError(null)
    setInput('')
    setShowResetModal(false)
  }

  // Show suggested replies only when waiting for user input on a specific step
  // and no verdict has been reached yet
  const showSuggestions =
    !isSending &&
    !verdictRisk &&
    currentStep >= 1 &&
    currentStep <= 4 &&
    messages[messages.length - 1]?.role === 'assistant'

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">

      {/* ── Confirm Reset Modal ─────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={showResetModal}
        title="Start a new assessment?"
        message="Your current conversation will be cleared. This cannot be undone."
        confirmLabel="Yes, Start Fresh"
        cancelLabel="Cancel"
        onConfirm={confirmReset}
        onCancel={() => setShowResetModal(false)}
      />

      {/* ── Chat Header ───────────────────────────────────────────────────── */}
      <div className="glass-card sm:rounded-t-2xl rounded-none flex items-center gap-3 px-4 py-3
                      border-b border-clarion-border flex-shrink-0">
        <div className="w-12 h-12 bg-clarion-surface2 border border-clarion-border rounded-xl flex items-center justify-center shadow-sm">
          <MessageCircle className="w-6 h-6 text-clarion-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-outfit font-bold text-2xl text-clarion-text tracking-tight">FraudBot</p>
          <p className="text-xs text-clarion-muted font-medium mt-0.5">Multilingual Fraud Advisor · 6 Languages</p>
        </div>

        {/* Mode badge */}
        <ModeBadge modelType={modelType} />

        <LanguageSelector
          value={language}
          onChange={(lang) => { setLanguage(lang); setDetectedLang(null) }}
          detectedLanguage={detectedLang}
        />

        <button
          onClick={resetChat}
          className="flex items-center gap-1.5 text-xs text-clarion-muted hover:text-clarion-accent
                     transition-colors px-2 py-1.5 rounded-lg hover:bg-clarion-accent/10 ml-1 flex-shrink-0"
          title="Start a new conversation"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden sm:inline">New</span>
        </button>
      </div>

      {/* ── Step Progress Tracker ──────────────────────────────────────────── */}
      <div className="flex-shrink-0">
        <StepProgress currentStep={currentStep} riskLevel={verdictRisk} />
      </div>

      {/* ── Messages ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-clarion-surface/30">

        {/* Verdict Card — appears above new input after verdict */}
        {verdictRisk && <VerdictCard riskLevel={verdictRisk} />}

        {messages.map((msg, i) => (
          <ChatBubble
            key={i}
            role={msg.role}
            content={msg.content}
            riskLevel={msg.riskLevel}
            timestamp={msg.timestamp}
          />
        ))}

        {/* Typing indicator */}
        {isSending && (
          <div className="flex justify-start animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-clarion-accent/20 border border-clarion-accent/30
                            flex items-center justify-center mr-3 flex-shrink-0 mt-1">
              <Shield className="w-4 h-4 text-clarion-accent" />
            </div>
            <div className="px-4 py-3 bg-clarion-surface border border-clarion-border rounded-2xl rounded-tl-sm">
              <div className="flex items-center gap-1.5">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── Suggested Replies ──────────────────────────────────────────────── */}
      {showSuggestions && (
        <div className="bg-clarion-surface border-t border-clarion-border flex-shrink-0">
          <SuggestedReplies step={currentStep} onSelect={handleSend} />
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex-shrink-0 mx-4 py-2">
          <div className="flex items-center gap-2 p-3 bg-clarion-danger/10 border border-clarion-danger/30 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-clarion-danger flex-shrink-0" />
            <p className="text-clarion-danger text-xs">{error}</p>
          </div>
        </div>
      )}

      {/* ── Input bar ─────────────────────────────────────────────────────── */}
      <div className="glass-card sm:rounded-b-2xl rounded-none flex-shrink-0
                      border-t border-clarion-border p-3 flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            id="fraudbot-input"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={handleKeyDown}
            placeholder={
              verdictRisk
                ? 'Describe another situation or start a new chat...'
                : 'Describe the suspicious call or message... (Enter to send, Shift+Enter for new line)'
            }
            rows={2}
            className="w-full bg-transparent text-clarion-text placeholder:text-clarion-muted
                       text-sm leading-relaxed resize-none focus:outline-none pr-12"
            disabled={isSending}
            aria-label="Chat input"
          />
          {input.length > MAX_CHARS * 0.8 && (
            <span className="absolute bottom-0 right-0 text-[10px] text-clarion-muted font-mono">
              {input.length}/{MAX_CHARS}
            </span>
          )}
        </div>
        <button
          id="fraudbot-send-button"
          onClick={() => handleSend()}
          disabled={!input.trim() || isSending}
          className="w-10 h-10 rounded-xl bg-clarion-accent flex items-center justify-center
                     text-white hover:bg-blue-500 transition-all duration-200 flex-shrink-0
                     disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5
                     shadow-accent"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Privacy note */}
      <p className="text-center text-[10px] text-clarion-muted/50 py-1.5 flex-shrink-0 bg-clarion-bg">
        🔒 Conversation content is never stored. Session ends on page close.
      </p>
    </div>
  )
}
