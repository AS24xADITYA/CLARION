import { Globe } from 'lucide-react'

const LANGUAGES = [
  { code: 'auto', label: 'Auto-detect',  flag: '🌐' },
  { code: 'en',   label: 'English',      flag: '🇬🇧' },
  { code: 'hi',   label: 'हिंदी (Hindi)', flag: '🇮🇳' },
  { code: 'mr',   label: 'मराठी (Marathi)', flag: '🇮🇳' },
  { code: 'ta',   label: 'தமிழ் (Tamil)', flag: '🇮🇳' },
  { code: 'te',   label: 'తెలుగు (Telugu)', flag: '🇮🇳' },
  { code: 'bn',   label: 'বাংলা (Bengali)', flag: '🇮🇳' },
]

/**
 * LanguageSelector — Dropdown for choosing FraudBot conversation language.
 * Props:
 *   value: language code (e.g. 'en', 'hi')
 *   onChange(code): callback
 *   detectedLanguage: string | null — shown as detected label
 */
export default function LanguageSelector({ value, onChange, detectedLanguage }) {
  const selected = LANGUAGES.find((l) => l.code === value) || LANGUAGES[0]

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 text-clarion-muted text-xs">
        <Globe className="w-3.5 h-3.5" />
        {detectedLanguage && (
          <span>
            Detected: <span className="text-clarion-accent font-medium">{
              LANGUAGES.find(l => l.code === detectedLanguage)?.label || detectedLanguage
            }</span>
          </span>
        )}
      </div>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-clarion-surface2 border border-clarion-border rounded-lg
                   px-3 py-1.5 text-sm text-clarion-text
                   focus:outline-none focus:border-clarion-accent
                   transition-colors duration-200 cursor-pointer"
        aria-label="Select conversation language"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export { LANGUAGES }
