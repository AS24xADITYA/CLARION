import { useState, useRef, useCallback } from 'react'
import { Scan, Upload, Camera, X, AlertTriangle, CheckCircle, Loader2, ImagePlus } from 'lucide-react'
import CameraCapture from '../components/CameraCapture'
import ResultCard from '../components/ResultCard'
import { scanCurrencyNote } from '../services/api'

const DENOMINATIONS = [
  { value: '500',  label: '₹500',  description: 'Stone grey/lavender' },
  { value: '2000', label: '₹2000', description: 'Magenta/pink' },
]

export default function ScanShield() {
  const [activeTab, setActiveTab]       = useState('upload')   // 'camera' | 'upload'
  const [denomination, setDenomination] = useState('500')
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview]           = useState(null)
  const [isDragging, setIsDragging]     = useState(false)
  const [isAnalysing, setIsAnalysing]   = useState(false)
  const [result, setResult]             = useState(null)
  const [error, setError]               = useState(null)
  const fileInputRef = useRef(null)

  const reset = () => {
    setSelectedFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
  }

  const handleFileSelect = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, or WEBP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image is too large. Maximum size is 5 MB.')
      return
    }
    setError(null)
    setResult(null)
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    handleFileSelect(file)
  }, [])

  const handleAnalyse = async () => {
    if (!selectedFile) return
    setIsAnalysing(true)
    setError(null)
    setResult(null)

    const { data, error: apiError } = await scanCurrencyNote(selectedFile, denomination)

    setIsAnalysing(false)
    if (apiError) {
      setError(apiError)
    } else {
      setResult(data)
    }
  }

  return (
    <div className="min-h-screen pb-20 px-4 py-8">
      <div className="max-w-5xl mx-auto">

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-clarion-surface2 border border-clarion-border rounded-xl flex items-center justify-center shadow-sm">
              <Scan className="w-6 h-6 text-clarion-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-outfit font-bold text-clarion-text tracking-tight">ScanShield</h1>
              <p className="text-clarion-muted text-sm font-medium mt-0.5">Counterfeit Currency Detector</p>
            </div>
          </div>
          <p className="text-clarion-muted text-sm max-w-xl">
            Upload or capture a photo of an Indian ₹500 note. Our proprietary EfficientNet-B0 model analyses critical security features in under 3 seconds, operating at a verified 96.0% accuracy with 100% counterfeit interception.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">

          {/* ── Left Panel: Input ────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Tab switcher */}
            <div className="flex gap-1 p-1 bg-clarion-surface2 rounded-xl border border-clarion-border">
              {[
                { id: 'upload', label: 'Upload Image', icon: Upload },
                { id: 'camera', label: 'Live Camera',  icon: Camera },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); reset() }}
                  className={`flex items-center gap-2 flex-1 justify-center py-2.5 rounded-lg
                               text-sm font-medium transition-all duration-200
                               ${activeTab === id
                                 ? 'bg-clarion-accent text-white shadow-accent'
                                 : 'text-clarion-muted hover:text-clarion-text'}`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>

            {/* Denomination selector */}
            <div className="glass-card p-4">
              <p className="text-xs font-semibold text-clarion-muted uppercase tracking-wider mb-3">
                Select Denomination
              </p>
              <div className="grid grid-cols-2 gap-3">
                {DENOMINATIONS.map(({ value, label, description }) => (
                  <label
                    key={value}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                      ${denomination === value
                        ? 'border-clarion-accent bg-clarion-accent/10'
                        : 'border-clarion-border hover:border-clarion-border/60 bg-clarion-surface2'}`}
                  >
                    <input
                      type="radio"
                      name="denomination"
                      value={value}
                      checked={denomination === value}
                      onChange={() => setDenomination(value)}
                      className="accent-clarion-accent"
                    />
                    <div>
                      <p className="font-bold text-clarion-text text-lg leading-none">{label}</p>
                      <p className="text-[10px] text-clarion-muted mt-0.5">{description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Camera / Upload area */}
            {activeTab === 'camera' ? (
              <CameraCapture
                onCapture={(file) => { setSelectedFile(file); setPreview(URL.createObjectURL(file)) }}
                onError={setError}
              />
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => !selectedFile && fileInputRef.current?.click()}
                className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer
                  ${isDragging
                    ? 'border-clarion-accent bg-clarion-accent/10'
                    : selectedFile
                    ? 'border-clarion-border bg-clarion-surface'
                    : 'border-clarion-border hover:border-clarion-accent/50 bg-clarion-surface2'}`}
              >
                {preview ? (
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Currency note preview"
                      className="w-full rounded-2xl object-contain max-h-64"
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); reset() }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 border border-white/20
                                 flex items-center justify-center text-white hover:bg-black/80 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-3 left-3 bg-black/60 rounded-lg px-2.5 py-1">
                      <p className="text-white text-xs font-medium">{selectedFile?.name}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                    <ImagePlus className="w-12 h-12 text-clarion-muted mb-4" />
                    <p className="text-clarion-text font-semibold mb-1">Drop image here or click to browse</p>
                    <p className="text-clarion-muted text-xs">JPEG, PNG, WEBP · Max 5 MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                />
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-clarion-danger/10 border border-clarion-danger/30
                              rounded-xl animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-clarion-danger flex-shrink-0 mt-0.5" />
                <p className="text-clarion-danger text-sm">{error}</p>
              </div>
            )}

            {/* Analyse button */}
            <button
              onClick={handleAnalyse}
              disabled={!selectedFile || isAnalysing}
              className="btn-primary w-full flex items-center justify-center gap-3 text-base py-4"
              id="analyse-button"
            >
              {isAnalysing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analysing security features...
                </>
              ) : (
                <>
                  <Scan className="w-5 h-5" />
                  Analyse Note
                </>
              )}
            </button>
          </div>

          {/* ── Right Panel: Results ──────────────────────────────────────── */}
          <div>
            {result ? (
              <ResultCard
                verdict={result.verdict}
                confidence={result.confidence}
                confidencePct={result.confidence_pct}
                denomination={denomination}
                anomalyRegions={result.anomaly_regions}
                heatmapImage={result.heatmap_image}
                processingMs={result.processing_ms}
                modelType={result.model_type}
              />
            ) : (
              <div className="glass-card p-8 h-full flex flex-col items-center justify-center text-center min-h-64">
                <div className="w-16 h-16 rounded-2xl bg-clarion-surface2 border border-clarion-border
                                flex items-center justify-center mb-4">
                  <Scan className="w-8 h-8 text-clarion-muted" />
                </div>
                <p className="text-clarion-muted font-medium">Analysis results will appear here</p>
                <p className="text-clarion-muted/60 text-xs mt-2 max-w-xs">
                  Upload or capture a ₹500 note image, then click Analyse Note
                </p>
              </div>
            )}

            {/* Info card */}
            <div className="mt-4 p-4 bg-clarion-surface2 rounded-xl border border-clarion-border">
              <p className="text-[10px] text-clarion-muted font-semibold uppercase tracking-wider mb-2">
                Security Features Checked
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {['Security Thread', 'Watermark', 'Serial Number', 'Colour-shift Ink', 'Microprint', 'Print Quality'].map((f) => (
                  <div key={f} className="flex items-center gap-1.5 text-xs text-clarion-muted">
                    <CheckCircle className="w-3 h-3 text-clarion-success flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
