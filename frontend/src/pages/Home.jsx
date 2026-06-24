import { Link } from 'react-router-dom'
import { Scan, AlertTriangle, MessageCircle, Shield, ArrowRight, Phone, TrendingUp, Globe, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

const STATS = [
  { value: '1.14M',     label: 'Complaints in 2023',    sublabel: '+60% YoY', icon: TrendingUp },
  { value: '₹1,776 Cr', label: 'Lost in 9 months',      sublabel: 'MHA Report 2024', icon: Shield },
  { value: '6',          label: 'Indian Languages',      sublabel: 'Supported by FraudBot', icon: Globe },
  { value: '1930',       label: 'National Cyber Helpline', sublabel: 'Toll-free · 24×7', icon: Phone },
]

const FEATURES = [
  {
    to: '/scan',
    icon: Scan,
    title: 'ScanShield',
    subtitle: 'Counterfeit Currency Detector',
    description:
      'Point your camera at any ₹500 or ₹2000 note. AI analyses 6 security features in under 3 seconds and returns GENUINE / FAKE / UNCERTAIN with a confidence score.',
    badge: 'Computer Vision',
    badgeColor: 'bg-blue-900/40 text-blue-300 border-blue-700/40',
    gradient: 'from-blue-900/30 to-transparent',
    borderColor: 'hover:border-blue-500/40',
    ctaColor: 'text-blue-400',
  },
  {
    to: '/scam',
    icon: AlertTriangle,
    title: 'ScamRadar',
    subtitle: 'Digital Arrest Scam Detector',
    description:
      'Describe a suspicious call or message. CLARION classifies it against 8 known digital arrest fraud patterns and shows you matching red flags, risk confidence, and direct reporting links.',
    badge: 'NLP Classifier',
    badgeColor: 'bg-red-900/40 text-red-300 border-red-700/40',
    gradient: 'from-red-900/30 to-transparent',
    borderColor: 'hover:border-red-500/40',
    ctaColor: 'text-red-400',
  },
  {
    to: '/fraudbot',
    icon: MessageCircle,
    title: 'FraudBot',
    subtitle: 'Multilingual Fraud Advisor',
    description:
      'Chat in English, Hindi, Marathi, Tamil, Telugu, or Bengali. FraudBot conducts a structured 4-question risk assessment and gives you a HIGH / MEDIUM / LOW risk verdict with step-by-step reporting guidance.',
    badge: 'Multilingual LLM',
    badgeColor: 'bg-green-900/40 text-green-300 border-green-700/40',
    gradient: 'from-green-900/30 to-transparent',
    borderColor: 'hover:border-green-500/40',
    ctaColor: 'text-green-400',
  },
]

function AnimatedCounter({ target, duration = 1500 }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const numTarget = parseFloat(target.replace(/[^0-9.]/g, ''))
    if (isNaN(numTarget)) return
    const step = numTarget / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= numTarget) { setCount(numTarget); clearInterval(timer) }
      else setCount(start)
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])

  // Reconstruct the display value with original formatting
  const display = target.replace(/[\d.]+/, (m) => {
    const n = parseFloat(m)
    return count >= n ? m : count.toFixed(m.includes('.') ? 2 : 0)
  })
  return <span>{target.includes('1930') ? target : display}</span>
}

export default function Home() {
  return (
    <div className="min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pt-20 pb-32 sm:pt-28 sm:pb-40">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full
                          bg-clarion-accent/5 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full
                          bg-clarion-danger/5 blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                          bg-clarion-accent/10 border border-clarion-accent/20 mb-8">
            <Shield className="w-4 h-4 text-clarion-accent" />
            <span className="text-clarion-accent text-sm font-semibold tracking-wide">
              CLARION Platform · Threat Intelligence · Digital Public Safety
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-tight tracking-tight mb-6">
            <span className="text-clarion-text">Protecting India</span>
            <br />
            <span className="text-gradient">from Digital Fraud</span>
          </h1>

          <p className="text-clarion-muted text-lg sm:text-xl max-w-2xl mx-auto mb-4 leading-relaxed">
            In the first 9 months of 2024, digital arrest scams defrauded Indian citizens of
            <span className="text-clarion-danger font-bold"> ₹1,776 crore</span>.
            One scam every 90 seconds.
          </p>
          <p className="text-clarion-muted text-base max-w-xl mx-auto mb-10">
            CLARION puts AI-powered fraud detection in every citizen's hands — for free, in 6 languages, offline-capable.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/scan" className="btn-primary flex items-center gap-2 text-base">
              <Scan className="w-5 h-5" />
              Scan a Currency Note
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/scam" className="btn-ghost flex items-center gap-2 text-base">
              <AlertTriangle className="w-5 h-5" />
              Check for a Scam
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────────────────────── */}
      <section className="relative -mt-16 mx-4 sm:mx-8 lg:mx-auto lg:max-w-6xl">
        <div className="glass-card p-6 sm:p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-clarion-border">
            {STATS.map(({ value, label, sublabel, icon: Icon }, i) => (
              <div key={i} className="flex flex-col items-center text-center lg:px-8">
                <Icon className="w-5 h-5 text-clarion-accent mb-2 opacity-70" />
                <p className="text-2xl sm:text-3xl font-black text-clarion-text">
                  <AnimatedCounter target={value} />
                </p>
                <p className="text-xs font-semibold text-clarion-muted mt-1">{label}</p>
                <p className="text-[10px] text-clarion-muted/60 mt-0.5">{sublabel}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Cards ──────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="section-heading text-3xl sm:text-4xl mb-4">Three Tools. One Mission.</h2>
          <p className="text-clarion-muted max-w-xl mx-auto">
            Each component addresses a distinct fraud vector — together they cover the full spectrum of digital crime affecting Indian citizens.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map(({ to, icon: Icon, title, subtitle, description, badge, badgeColor, gradient, borderColor, ctaColor }) => (
            <Link
              key={to}
              to={to}
              className={`glass-card border border-clarion-border ${borderColor}
                          transition-all duration-300 hover:-translate-y-1 hover:shadow-card
                          group overflow-hidden relative`}
            >
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              <div className="relative p-6">
                {/* Icon */}
                <div className="w-12 h-12 rounded-2xl bg-clarion-surface2 border border-clarion-border
                                flex items-center justify-center mb-4
                                group-hover:scale-110 transition-transform duration-300">
                  <Icon className={`w-6 h-6 ${ctaColor}`} />
                </div>

                {/* Badge */}
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold
                                  uppercase tracking-wider border mb-3 ${badgeColor}`}>
                  {badge}
                </span>

                <h3 className="text-xl font-bold text-clarion-text mb-1">{title}</h3>
                <p className="text-xs text-clarion-muted font-medium mb-3">{subtitle}</p>
                <p className="text-sm text-clarion-muted leading-relaxed">{description}</p>

                {/* CTA */}
                <div className={`flex items-center gap-1.5 mt-5 text-sm font-semibold ${ctaColor}`}>
                  Launch {title}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────────── */}
      <section className="bg-clarion-surface border-y border-clarion-border py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="section-heading text-2xl sm:text-3xl mb-4">Powered by Real AI</h2>
          <p className="text-clarion-muted mb-10 max-w-xl mx-auto">
            No gimmicks. Three distinct machine learning models working in concert.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 text-sm">
            {[
              { model: 'EfficientNet-B0',            task: 'Currency CV',       detail: 'Transfer learned on ImageNet. Grad-CAM heatmaps for anomaly localisation.' },
              { model: 'DistilBERT Multilingual',     task: 'Scam Classifier',   detail: '9-class fine-tuned transformer. 1,350+ training samples across 8 scam types.' },
              { model: 'Mistral-7B / Gemma-2B',       task: 'FraudBot LLM',      detail: 'Runs via Ollama, fully local, zero API cost. Structured 4-step assessment prompt.' },
            ].map(({ model, task, detail }) => (
              <div key={model} className="p-5 bg-clarion-surface2 rounded-2xl border border-clarion-border text-left">
                <p className="text-[10px] text-clarion-accent font-bold uppercase tracking-widest mb-1">{task}</p>
                <p className="font-bold text-clarion-text mb-2 font-mono text-sm">{model}</p>
                <p className="text-clarion-muted text-xs leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Emergency Banner ───────────────────────────────────────────────── */}
      <section className="fixed bottom-0 left-0 right-0 z-50
                          bg-clarion-danger/95 border-t border-red-700/50
                          py-2.5 px-4"
               style={{ backdropFilter: 'blur(12px)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Suspected Fraud? Act Now.</p>
              <p className="text-red-200 text-xs">National Cyber Helpline — Available 24 hours, 7 days, Toll-Free</p>
            </div>
          </div>
          <a
            href="tel:1930"
            className="flex-shrink-0 bg-white text-clarion-danger font-black text-xl
                       px-5 py-2 rounded-xl hover:bg-red-50 transition-colors
                       shadow-lg"
          >
            1930
          </a>
        </div>
      </section>

      {/* Space for fixed banner */}
      <div className="h-16" />
    </div>
  )
}
