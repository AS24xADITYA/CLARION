import { Shield, Zap, Globe, Lock, ExternalLink, Github } from 'lucide-react'

const TECH_STACK = [
  { layer: 'Frontend',       tech: 'React 18 + Vite + TailwindCSS',             why: 'Fast SPA with PWA offline support' },
  { layer: 'Backend',        tech: 'Python FastAPI + SQLAlchemy (SQLite)',        why: 'Async API, auto-docs, lightweight DB' },
  { layer: 'CV Model',       tech: 'EfficientNet-B0 (TensorFlow / Keras)',        why: 'ImageNet transfer learning for currency CV' },
  { layer: 'NLP Classifier', tech: 'DistilBERT Multilingual (HuggingFace)',      why: '9-class fine-tuned transformer' },
  { layer: 'LLM',            tech: 'Mistral-7B via Ollama (local inference)',     why: 'Zero API cost, privacy-safe' },
  { layer: 'Image Analysis', tech: 'OpenCV + Pillow (rule-based fallback)',       why: 'Works without trained model' },
  { layer: 'Lang Detection', tech: 'langdetect Python library',                  why: '55+ languages, offline' },
  { layer: 'PWA',            tech: 'Workbox via vite-plugin-pwa',                why: 'Offline-capable, installable on phone' },
]

const METRICS = [
  { metric: 'ScanShield Accuracy',          target: '>85%',  method: 'Test set of 200 synthetic notes' },
  { metric: 'ScanShield Precision (Fake)',   target: '>80%',  method: 'TP / (TP+FP) on fake class' },
  { metric: 'ScanShield Recall (Fake)',      target: '>80%',  method: 'TP / (TP+FN) on fake class' },
  { metric: 'ScamRadar Macro F1',            target: '>75%',  method: 'Average F1 across 9 classes' },
  { metric: 'ScamRadar FPR (Legitimate)',    target: '<5%',   method: '% legitimate wrongly flagged' },
  { metric: 'FraudBot Language Coverage',   target: '6',     method: 'EN, HI, MR, TA, TE, BN' },
  { metric: 'FraudBot Response Latency',    target: '<8s',   method: 'Mistral-7B local CPU inference' },
]

export default function About() {
  return (
    <div className="min-h-screen pb-20 px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-clarion-accent rounded-2xl flex items-center justify-center shadow-accent">
              <Shield className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gradient mb-3">About CLARION</h1>
          <p className="text-clarion-muted max-w-2xl mx-auto">
            CLARION is an AI-powered Digital Public Safety Intelligence platform built for
            <strong className="text-clarion-text"> CLARION Initiative 2.0 (Digital Public Safety)</strong> by CLARION Team.
            All technology is 100% free and open source.
          </p>
        </div>

        {/* Architecture diagram (text) */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-clarion-text mb-5 flex items-center gap-2">
            <Zap className="w-5 h-5 text-clarion-accent" /> System Architecture
          </h2>
          <div className="font-mono text-xs text-clarion-muted leading-relaxed overflow-x-auto">
            <pre className="whitespace-pre">{`
  ┌─────────────────────────────────────────────────────────┐
  │           User Browser / Mobile PWA (React 18)          │
  │  ScanShield.jsx  │  ScamRadar.jsx  │  FraudBot.jsx      │
  └────────────────────────┬────────────────────────────────┘
                           │ HTTPS / proxy
  ┌────────────────────────▼────────────────────────────────┐
  │            FastAPI Backend  (Python · Port 8000)         │
  │  /api/scan      │  /api/scam      │  /api/fraudbot       │
  └────┬────────────┴──────┬──────────┴────────┬────────────┘
       │                   │                    │
  ┌────▼────────┐  ┌───────▼──────┐  ┌─────────▼──────────┐
  │ EfficientNet │  │  DistilBERT  │  │  Ollama / Mistral-7B│
  │   B0 (CV)   │  │  (9-class)   │  │  or Rule-based LLM  │
  │ + OpenCV    │  │ + KB Matcher │  │  (6 languages)      │
  └─────────────┘  └──────────────┘  └────────────────────-┘
                           │
  ┌────────────────────────▼────────────────────────────────┐
  │              SQLite (Analytics Logs · No PII)            │
  └─────────────────────────────────────────────────────────┘
`}</pre>
          </div>
        </div>

        {/* Tech stack */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-clarion-text mb-5 flex items-center gap-2">
            <Globe className="w-5 h-5 text-clarion-accent" /> Technology Stack (100% Free & Open Source)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-clarion-border">
                  <th className="text-left py-2 pr-6 text-clarion-muted font-semibold text-xs uppercase tracking-wider">Layer</th>
                  <th className="text-left py-2 pr-6 text-clarion-muted font-semibold text-xs uppercase tracking-wider">Technology</th>
                  <th className="text-left py-2 text-clarion-muted font-semibold text-xs uppercase tracking-wider">Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-clarion-border/50">
                {TECH_STACK.map(({ layer, tech, why }) => (
                  <tr key={layer} className="hover:bg-clarion-surface2 transition-colors">
                    <td className="py-3 pr-6 text-clarion-accent font-medium text-xs">{layer}</td>
                    <td className="py-3 pr-6 font-mono text-clarion-text text-xs">{tech}</td>
                    <td className="py-3 text-clarion-muted text-xs">{why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Evaluation metrics */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-clarion-text mb-2 flex items-center gap-2">
            📊 Target Evaluation Metrics
          </h2>
          <p className="text-clarion-muted text-sm mb-5">
            Target metrics for production deployment. Run <code className="text-clarion-accent font-mono text-xs bg-clarion-surface2 px-1.5 py-0.5 rounded">backend/training/evaluate_models.py</code> after training to generate the actual values.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-clarion-border">
                  <th className="text-left py-2 pr-6 text-clarion-muted font-semibold text-xs uppercase tracking-wider">Metric</th>
                  <th className="text-left py-2 pr-6 text-clarion-muted font-semibold text-xs uppercase tracking-wider">Target</th>
                  <th className="text-left py-2 text-clarion-muted font-semibold text-xs uppercase tracking-wider">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-clarion-border/50">
                {METRICS.map(({ metric, target, method }) => (
                  <tr key={metric} className="hover:bg-clarion-surface2 transition-colors">
                    <td className="py-3 pr-6 text-clarion-text text-xs font-medium">{metric}</td>
                    <td className="py-3 pr-6">
                      <span className="px-2 py-0.5 bg-clarion-success/10 border border-clarion-success/30 text-clarion-success rounded-md text-xs font-bold">
                        {target}
                      </span>
                    </td>
                    <td className="py-3 text-clarion-muted text-xs">{method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Privacy */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-clarion-text mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-clarion-accent" /> Privacy by Design
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              'No PII stored — all analysis is ephemeral',
              'Currency note images deleted immediately after processing',
              'FraudBot conversations stored in session only, never in DB',
              'SQLite logs store only timestamps and verdicts — no user input',
              'HTTPS enforced via ngrok for public demo',
              'Rate limiting prevents abuse during demo',
            ].map((point, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 bg-clarion-surface2 rounded-xl">
                <div className="w-1.5 h-1.5 rounded-full bg-clarion-success mt-1.5 flex-shrink-0" />
                <p className="text-sm text-clarion-muted">{point}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="glass-card p-6 text-center">
          <h2 className="text-xl font-bold text-clarion-text mb-2">Team</h2>
          <p className="text-clarion-muted text-sm">CLARION Threat Intelligence Team</p>
          <p className="text-clarion-muted text-sm mt-1">CLARION — AI for Digital Public Safety</p>
          <div className="mt-6 flex items-center justify-center gap-6 flex-wrap">
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-clarion-accent text-sm hover:underline"
            >
              <ExternalLink className="w-4 h-4" /> cybercrime.gov.in
            </a>
            <span className="text-clarion-muted">·</span>
            <span className="text-clarion-text font-black text-lg">1930</span>
            <span className="text-clarion-muted text-xs">National Cyber Helpline</span>
          </div>
        </div>
      </div>
    </div>
  )
}
