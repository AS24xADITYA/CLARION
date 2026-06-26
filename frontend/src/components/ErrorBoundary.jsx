import { Component } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

/**
 * ErrorBoundary — Class component to catch JS errors in page components.
 * Prevents a single broken page from crashing the entire React app.
 * Renders a graceful fallback UI with a reload button.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[CLARION ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
          <div className="glass-card max-w-md w-full p-8 text-center space-y-6 border border-clarion-border animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-clarion-danger/10 border border-clarion-danger/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-clarion-danger" />
            </div>

            <div>
              <h2 className="text-xl font-outfit font-bold text-clarion-text mb-2">
                Something went wrong
              </h2>
              <p className="text-clarion-muted text-sm leading-relaxed">
                This tool encountered an unexpected error. The rest of CLARION is still working —
                you can use the navigation above to access other features.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-clarion-surface2 rounded-xl border border-clarion-border text-left">
                <p className="text-xs font-mono text-clarion-muted break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="btn-primary flex items-center justify-center gap-2 w-full min-h-[44px]"
            >
              <RotateCcw className="w-4 h-4" />
              Reload this component
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
