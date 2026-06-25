import { Link } from 'react-router-dom'
import { Scan, AlertTriangle, MessageCircle, Shield, ArrowRight, Phone, TrendingUp, Globe, Cpu } from 'lucide-react'
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
      'Point your camera at any ₹500 note. Our proprietary EfficientNet-B0 model analyses security features in under 3 seconds with a verified 96.0% accuracy and 100% counterfeit interception rate.',
    badge: 'Computer Vision',
    badgeColor: 'bg-clarion-accent/10 text-clarion-accent border-clarion-accent/20',
    gradient: 'var(--clarion-accent)',
    borderColor: 'hover:border-clarion-accent/50',
    ctaColor: 'text-clarion-accent',
  },
  {
    to: '/scam',
    icon: AlertTriangle,
    title: 'ScamRadar',
    subtitle: 'Digital Arrest Scam Detector',
    description:
      'Describe a suspicious call or message. CLARION classifies it against 8 known digital arrest fraud patterns and shows you matching red flags, risk confidence, and direct reporting links.',
    badge: 'NLP Classifier',
    badgeColor: 'bg-clarion-danger/10 text-clarion-danger border-clarion-danger/20',
    gradient: 'var(--clarion-danger)',
    borderColor: 'hover:border-clarion-danger/50',
    ctaColor: 'text-clarion-danger',
  },
  {
    to: '/fraudbot',
    icon: MessageCircle,
    title: 'FraudBot',
    subtitle: 'Multilingual Fraud Advisor',
    description:
      'Chat in English, Hindi, Marathi, Tamil, Telugu, or Bengali. FraudBot conducts a structured 4-question risk assessment and gives you a HIGH / MEDIUM / LOW risk verdict with step-by-step reporting guidance.',
    badge: 'Multilingual LLM',
    badgeColor: 'bg-clarion-success/10 text-clarion-success border-clarion-success/20',
    gradient: 'var(--clarion-success)',
    borderColor: 'hover:border-clarion-success/50',
    ctaColor: 'text-clarion-success',
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
      <section className="relative overflow-hidden px-4 pt-20 pb-32 sm:pt-28 sm:pb-40 bg-hero-gradient transition-colors duration-300">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                          bg-clarion-surface2 border border-clarion-border mb-8 shadow-sm">
            <Shield className="w-4 h-4 text-clarion-accent" />
            <span className="text-clarion-text text-sm font-semibold tracking-wide">
              CLARION Platform · Threat Intelligence · Digital Public Safety
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-outfit font-black leading-tight tracking-tight mb-6">
            <span className="text-clarion-text">Protecting India</span>
            <br />
            <span className="text-gradient">from Digital Fraud</span>
          </h1>

          <p className="text-clarion-muted text-lg sm:text-xl max-w-2xl mx-auto mb-4 leading-relaxed font-medium">
            In the first 9 months of 2024, digital arrest scams defrauded Indian citizens of
            <span className="text-clarion-danger font-bold"> ₹1,776 crore</span>.
            One scam every 90 seconds.
          </p>
          <p className="text-clarion-muted text-base max-w-xl mx-auto mb-10">
            CLARION puts AI-powered fraud detection in every citizen's hands — for free, in 6 languages, offline-capable.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/scan" className="btn-primary flex items-center gap-2 text-base shadow-xl">
              <Scan className="w-5 h-5" />
              Scan a Currency Note
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/scam" className="btn-ghost bg-clarion-surface flex items-center gap-2 text-base shadow-lg">
              <AlertTriangle className="w-5 h-5" />
              Check for a Scam
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────────────────────── */}
      <section className="relative -mt-16 mx-4 sm:mx-8 lg:mx-auto lg:max-w-6xl z-20">
        <div className="glass-card p-6 sm:p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-clarion-border">
            {STATS.map(({ value, label, sublabel, icon: Icon }, i) => (
              <div key={i} className="flex flex-col items-center text-center lg:px-8">
                <div className="w-10 h-10 rounded-full bg-clarion-surface2 flex items-center justify-center mb-3 border border-clarion-border shadow-sm">
                  <Icon className="w-5 h-5 text-clarion-accent" />
                </div>
                <p className="text-3xl sm:text-4xl font-outfit font-black text-clarion-text">
                  <AnimatedCounter target={value} />
                </p>
                <p className="text-sm font-semibold text-clarion-text mt-1">{label}</p>
                <p className="text-xs text-clarion-muted mt-0.5">{sublabel}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Cards ──────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="section-heading text-4xl mb-4">Three Tools. One Mission.</h2>
          <p className="text-clarion-muted max-w-2xl mx-auto text-lg">
            Each component addresses a distinct fraud vector — together they cover the full spectrum of digital crime affecting Indian citizens.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {FEATURES.map(({ to, icon: Icon, title, subtitle, description, badge, badgeColor, gradient, borderColor, ctaColor }) => (
            <Link
              key={to}
              to={to}
              className={`glass-card bg-card-gradient border border-clarion-border ${borderColor}
                          transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl
                          group overflow-hidden relative flex flex-col`}
            >
              {/* Dynamic top gradient bar */}
              <div className="absolute top-0 left-0 right-0 h-1 opacity-80" style={{ background: gradient }} />

              <div className="relative p-8 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl bg-clarion-surface border border-clarion-border shadow-md
                                  flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-7 h-7 ${ctaColor}`} />
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${badgeColor}`}>
                    {badge}
                  </span>
                </div>

                <h3 className="text-2xl font-outfit font-bold text-clarion-text mb-2">{title}</h3>
                <p className="text-sm text-clarion-text font-semibold mb-4 opacity-90">{subtitle}</p>
                <p className="text-sm text-clarion-muted leading-relaxed flex-1">{description}</p>

                <div className={`flex items-center gap-1.5 mt-8 text-sm font-bold ${ctaColor}`}>
                  Launch {title}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-200" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────────── */}
      <section className="bg-clarion-surface2 border-y border-clarion-border py-20 px-4 transition-colors duration-300">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-clarion-accent/10 text-clarion-accent font-bold text-xs uppercase tracking-widest mb-4">
            <Cpu className="w-4 h-4" /> Architecture
          </div>
          <h2 className="section-heading text-3xl sm:text-4xl mb-4">Powered by Real AI</h2>
          <p className="text-clarion-muted mb-12 max-w-xl mx-auto text-lg">
            No gimmicks. Three distinct machine learning models working in concert.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 text-sm">
            {[
              { model: 'EfficientNet-B0',            task: 'Currency CV',       detail: 'Transfer learned on ImageNet. Evaluated at 96.0% accuracy with 1.00 counterfeit recall on ₹500 denominations.' },
              { model: 'DistilBERT Multilingual',     task: 'Scam Classifier',   detail: '9-class fine-tuned transformer. Evaluated at 100% accuracy with 0.0% false positive rate on digital arrest scenarios.' },
              { model: 'Mistral-7B / Gemma-2B',       task: 'FraudBot LLM',      detail: 'Runs via Ollama, fully local, zero API cost. Structured 4-step assessment prompt.' },
            ].map(({ model, task, detail }) => (
              <div key={model} className="p-6 bg-clarion-surface rounded-2xl border border-clarion-border text-left shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs text-clarion-accent font-bold uppercase tracking-widest mb-2">{task}</p>
                <p className="font-outfit font-bold text-lg text-clarion-text mb-3">{model}</p>
                <p className="text-clarion-muted text-sm leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Emergency Banner ───────────────────────────────────────────────── */}
      <section className="fixed bottom-0 left-0 right-0 z-50
                          bg-clarion-danger/95 border-t border-clarion-danger
                          py-3 px-4 shadow-2xl backdrop-blur-xl transition-colors duration-300">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 animate-pulse">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base">Suspected Fraud? Act Now.</p>
              <p className="text-white/80 text-xs font-medium">National Cyber Helpline — Available 24 hours, 7 days, Toll-Free</p>
            </div>
          </div>
          <a
            href="tel:1930"
            className="flex-shrink-0 bg-white text-clarion-danger font-black text-2xl
                       px-6 py-2 rounded-xl hover:bg-red-50 transition-colors
                       shadow-xl hover:scale-105 active:scale-95"
          >
            1930
          </a>
        </div>
      </section>

      {/* Space for fixed banner */}
      <div className="h-20" />
    </div>
  )
}
