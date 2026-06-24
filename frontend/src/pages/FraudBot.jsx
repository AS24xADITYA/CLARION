import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, Send, Phone, ExternalLink, AlertTriangle, Shield } from 'lucide-react'
import ChatBubble from '../components/ChatBubble'
import LanguageSelector from '../components/LanguageSelector'
import { sendFraudBotMessage } from '../services/api'

const INITIAL_MESSAGE = {
  role: 'assistant',
  content:
    "Hello! I am FraudBot, your personal fraud safety advisor.\n\nPlease describe the suspicious call or message you received, and I will help you assess whether it is a fraud.\n\n*I support English, Hindi, Marathi, Tamil, Telugu, and Bengali — simply write in your preferred language.*",
  timestamp: new Date(),
  riskLevel: null,
}

function generateSessionId() {
  try { return crypto.randomUUID() }
  catch { return Math.random().toString(36).slice(2) + Date.now() }
}

export default function FraudBot() {
  const [messages, setMessages]           = useState([INITIAL_MESSAGE])
  const [input, setInput]                 = useState('')
  const [isSending, setIsSending]         = useState(false)
  const [language, setLanguage]           = useState('auto')
  const [detectedLang, setDetectedLang]   = useState(null)
  const [sessionId]                       = useState(() => generateSessionId())
  const [highRiskAlert, setHighRiskAlert] = useState(false)
  const [error, setError]                 = useState(null)

  const chatEndRef  = useRef(null)
  const inputRef    = useRef(null)
  const messagesRef = useRef(messages) // stable ref for history building
  messagesRef.current = messages

  // Auto-scroll on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  const buildHistory = useCallback(() =>
    messagesRef.current
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content })),
    []
  )

  const handleSend = useCallback(async () => {
    const userText = input.trim()
    if (!userText || isSending) return

    setInput('')
    setError(null)

    // Add user message immediately
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
      if (data.risk_level === 'HIGH') setHighRiskAlert(true)

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

  const resetChat = () => {
    setMessages([INITIAL_MESSAGE])
    setHighRiskAlert(false)
    setDetectedLang(null)
    setError(null)
    setInput('')
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-screen pb-0 px-0 sm:px-4 sm:py-4 max-w-3xl mx-auto">

      {/* ── Chat Header ───────────────────────────────────────────────────── */}
      <div className="glass-card sm:rounded-2xl rounded-none flex items-center gap-3 px-4 py-3 mb-0 sm:mb-4 border-b border-clarion-border">
        <div className="w-10 h-10 rounded-xl bg-clarion-accent/20 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-clarion-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-clarion-text">FraudBot</p>
          <p className="text-xs text-clarion-muted">Multilingual Fraud Advisor</p>
        </div>
        <LanguageSelector
          value={language}
          onChange={(lang) => { setLanguage(lang); setDetectedLang(null) }}
          detectedLanguage={detectedLang}
        />
        <button
          onClick={resetChat}
          className="text-xs text-clarion-muted hover:text-clarion-accent transition-colors px-2 py-1 rounded-lg
                     hover:bg-clarion-accent/10 ml-2"
          title="Start a new conversation"
        >
          New Chat
        </button>
      </div>

      {/* ── HIGH RISK Alert Banner ─────────────────────────────────────────── */}
      {highRiskAlert && (
        <div className="mx-0 sm:mx-0 mb-4 p-4 bg-clarion-danger border border-red-700
                        sm:rounded-2xl animate-slide-up">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-white flex-shrink-0" />
              <div>
                <p className="font-bold text-white">⚠️ WARNING: This appears to be a SCAM</p>
                <p className="text-red-200 text-xs mt-0.5">Do NOT transfer any money or share personal details.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href="tel:1930"
                className="flex items-center gap-1.5 bg-white text-clarion-danger font-black
                           px-4 py-2 rounded-xl text-sm hover:bg-red-50 transition-colors"
              >
                <Phone className="w-4 h-4" /> Call 1930
              </a>
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-white/20 text-white font-semibold
                           px-4 py-2 rounded-xl text-sm hover:bg-white/30 transition-colors border border-white/30"
              >
                <ExternalLink className="w-4 h-4" /> Report Now
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Messages ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-4 px-4 py-4 glass-card sm:rounded-2xl rounded-none">
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

      {/* ── Error display ──────────────────────────────────────────────────── */}
      {error && (
        <div className="mx-4 mt-2 p-3 bg-clarion-danger/10 border border-clarion-danger/30 rounded-xl">
          <p className="text-clarion-danger text-xs">{error}</p>
        </div>
      )}

      {/* ── Input bar ─────────────────────────────────────────────────────── */}
      <div className="glass-card sm:rounded-2xl rounded-none mt-4 p-3 flex items-end gap-3">
        <textarea
          ref={inputRef}
          id="fraudbot-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the suspicious call or message... (Enter to send, Shift+Enter for new line)"
          rows={2}
          className="flex-1 bg-transparent text-clarion-text placeholder:text-clarion-muted
                     text-sm leading-relaxed resize-none focus:outline-none"
          disabled={isSending}
          aria-label="Chat input"
        />
        <button
          id="fraudbot-send-button"
          onClick={handleSend}
          disabled={!input.trim() || isSending}
          className="w-10 h-10 rounded-xl bg-clarion-accent flex items-center justify-center
                     text-white hover:bg-blue-500 transition-all duration-200 flex-shrink-0
                     disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Privacy note */}
      <p className="text-center text-[10px] text-clarion-muted/50 py-2">
        🔒 Conversation content is never stored. Session ends on page close.
      </p>
    </div>
  )
}
