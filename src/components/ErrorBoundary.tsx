import { Component, ErrorInfo, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Oxium renderer error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-ox-bg text-ox-text p-8">
          <div className="max-w-md text-center">
            <h1 className="text-lg font-semibold mb-3">Something went wrong</h1>
            <pre className="text-xs text-ox-text-muted bg-[#1a1a1a] p-4 rounded-xl border border-ox-border overflow-auto max-h-52 text-left mb-4">
              {this.state.error?.message}
              {'\n\n'}
              {this.state.error?.stack?.slice(0, 500)}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-ox-surface rounded-xl border border-ox-border text-sm hover:bg-ox-surface-hover transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
