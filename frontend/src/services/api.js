import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 seconds for LLM inference
  headers: { 'X-Client': 'CLARION-Frontend/1.0' },
})

// Response interceptor for unified error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.DEV) {
      console.error('[CLARION API Error]', error.config?.url, error.response?.data || error.message)
    }
    return Promise.reject(error)
  }
)

// ─── Helper ───────────────────────────────────────────────────────────────────
const safeCall = async (fn) => {
  try {
    const response = await fn()
    return { data: response.data, error: null }
  } catch (err) {
    const errorMessage =
      err.response?.data?.detail ||
      err.response?.data?.error ||
      err.message ||
      'An unexpected error occurred'
    return { data: null, error: errorMessage }
  }
}

// ─── ScanShield ──────────────────────────────────────────────────────────────
/**
 * Upload a currency note image for authenticity analysis.
 * @param {File} imageFile - The image file to analyse
 * @param {string} denomination - '500' or '2000'
 * @returns {{ data: ScanResult, error: string|null }}
 */
export const scanCurrencyNote = (imageFile, denomination) => {
  const formData = new FormData()
  formData.append('image', imageFile)
  formData.append('denomination', denomination)

  return safeCall(() =>
    api.post('/api/scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    })
  )
}

// ─── ScamRadar ───────────────────────────────────────────────────────────────
/**
 * Classify a scam text description into 9 categories.
 * @param {string} text - Description of the suspicious call/message
 * @param {string} language - Language code or 'auto'
 * @returns {{ data: ClassifyResult, error: string|null }}
 */
export const classifyScam = (text, language = 'auto') =>
  safeCall(() => api.post('/api/scam/classify', { text, language }))

// Module-level cache for patterns (load once per session)
let cachedPatterns = null

/**
 * Get all scam patterns for sidebar display (cached).
 * @returns {{ data: { patterns: Pattern[] }, error: string|null }}
 */
export const getScamPatterns = async () => {
  if (cachedPatterns) return { data: cachedPatterns, error: null }
  const result = await safeCall(() => api.get('/api/scam/patterns'))
  if (result.data) cachedPatterns = result.data
  return result
}

/**
 * Get scam detection statistics.
 * @returns {{ data: StatsResult, error: string|null }}
 */
export const getScamStats = () =>
  safeCall(() => api.get('/api/scam/stats'))

// ─── FraudBot ────────────────────────────────────────────────────────────────
/**
 * Send a message to FraudBot and get a fraud risk assessment.
 * @param {string} message - User's message
 * @param {string} sessionId - UUID session identifier
 * @param {Array} history - Conversation history [{ role, content }]
 * @param {string|null} languageOverride - Force language (e.g. 'hi')
 * @returns {{ data: ChatResult, error: string|null }}
 */
export const sendFraudBotMessage = (message, sessionId, history = [], languageOverride = null) =>
  safeCall(() =>
    api.post('/api/fraudbot/chat', {
      message,
      session_id: sessionId,
      history,
      language_override: languageOverride,
    })
  )

// ─── Health ──────────────────────────────────────────────────────────────────
/**
 * System health check — returns status of all 3 AI services.
 */
export const getHealth = () =>
  safeCall(() => api.get('/health'))

export default api
