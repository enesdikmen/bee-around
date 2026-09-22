import { Component, type ErrorInfo, type ReactNode } from 'react'
import { countEvent } from '../lib/analytics'

type Props = { children: ReactNode }
type State = { error: Error | null }

const buttonClass =
  'rounded-lg border-[3px] border-black px-4 py-2 font-bold shadow-[4px_4px_0_#000]'

// The poster is built from public APIs we do not control, so a shape change
// upstream surfaces here as a render error. Without a boundary that is a blank
// page and no signal that anything broke. Colours are literal because the theme
// tokens live on a wrapper App owns, which may never have mounted.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Bee Around crashed:', error, info.componentStack)
    countEvent(`error/${error.name}: ${error.message}`, 'Crash')
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div
        role="alert"
        className="grid min-h-screen place-items-center bg-[#d9cfc2] p-6 text-black"
      >
        <div className="max-w-lg rounded-2xl border-[3px] border-black bg-[#fff7ed] p-7 shadow-[8px_8px_0_#000]">
          <h1 className="mb-3 text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
            This poster didn&rsquo;t make it
          </h1>
          <p className="mb-5 leading-relaxed">
            Bee Around builds posters from live biodiversity APIs, and one of them
            returned something it couldn&rsquo;t read. If you arrived from a
            shared link, starting fresh usually works.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={`${buttonClass} bg-[#fbbf24]`}
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
            <a className={`${buttonClass} bg-[#ff6d6d]`} href={import.meta.env.BASE_URL}>
              Start fresh
            </a>
          </div>
          <p className="mt-5 text-sm opacity-70">
            {error.name}: {error.message}
          </p>
        </div>
      </div>
    )
  }
}
