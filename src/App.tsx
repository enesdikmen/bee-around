import { useEffect, useState } from 'react'
import BentoPoster from './pages/BentoPoster'
import AboutPage from './pages/AboutPage'
import { places } from './data/lensFallbacks'
import {
  canonicalizePlace,
  readLanguageFromLocation,
  readLocksFromLocation,
  readShareFromLocation,
} from './lib/shareToken'
import type { Place } from './types/lens'

type AppView = 'poster' | 'about'

const readViewFromLocation = (): AppView =>
  typeof window !== 'undefined' && window.location.hash === '#about'
    ? 'about'
    : 'poster'

function BrandMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.14" />
      <path
        d="M12 4.75a7.25 7.25 0 1 0 0 14.5a7.25 7.25 0 0 0 0-14.5Zm0 0c1.95 1.9 3 4.47 3 7.25s-1.05 5.35-3 7.25m0-14.5c-1.95 1.9-3 4.47-3 7.25s1.05 5.35 3 7.25M5.25 12h13.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M11.25 8.2c1.75-.2 3.52.23 4.95 1.2c-1.06 2.55-3.42 4.36-6.17 4.74c-1.75.2-3.52-.22-4.95-1.18c1.06-2.56 3.42-4.38 6.17-4.76Z"
        fill="currentColor"
      />
    </svg>
  )
}

const initialShare = readShareFromLocation()
const initialLocks = readLocksFromLocation()
const initialLanguage = readLanguageFromLocation()
const defaultPlace = canonicalizePlace({
  ...places[0],
  // Treat first-load Munich like a searched city so URL/state mirrors
  // selector-driven custom-place behavior (`c.*` token path).
  id: 'default-munich-bootstrap',
})

function App() {
  const [selectedPlace, setSelectedPlace] = useState<Place>(
    initialShare?.place ?? defaultPlace,
  )
  const [view, setView] = useState<AppView>(readViewFromLocation)

  // Always canonicalize so the sharer's `place.id`/`label` match what a
  // receiver will reconstruct from the URL — this keeps seeded RNG keys
  // (and therefore species picks + card layout) identical across the link.
  const handlePlaceChange = (p: Place) => setSelectedPlace(canonicalizePlace(p))

  useEffect(() => {
    const syncView = () => setView(readViewFromLocation())
    window.addEventListener('hashchange', syncView)
    window.addEventListener('popstate', syncView)
    return () => {
      window.removeEventListener('hashchange', syncView)
      window.removeEventListener('popstate', syncView)
    }
  }, [])

  const showView = (nextView: AppView) => {
    if (nextView === 'about') {
      if (window.location.hash !== '#about') window.location.hash = 'about'
      else setView('about')
      return
    }

    const url = new URL(window.location.href)
    url.hash = ''
    window.history.pushState({}, '', url)
    setView('poster')
  }

  const isAboutView = view === 'about'

  return (
    <div className="app-shell theme-playful text-ink">
      <header className="app-header">
        <button type="button" className="app-brand" onClick={() => showView('poster')}>
          <span className="app-brand__mark">
            <BrandMark />
          </span>
          <span className="app-brand__text">
            <span className="app-brand__name">Lynxee</span>
            <span className="app-brand__tag">Biodiversity portraits</span>
          </span>
        </button>
        <button
          type="button"
          className={`app-nav-btn${isAboutView ? ' app-nav-btn--active' : ''}`}
          onClick={() => showView(isAboutView ? 'poster' : 'about')}
          aria-current={isAboutView ? 'page' : undefined}
        >
          {isAboutView ? 'Back to poster' : 'About / Method'}
        </button>
      </header>

      <main className="app-main">
        {isAboutView ? (
          <AboutPage />
        ) : (
          <BentoPoster
            selectedPlace={selectedPlace}
            onPlaceChange={handlePlaceChange}
            initialSeed={initialShare?.seed}
            initialLocks={initialLocks}
            initialLanguage={initialLanguage ?? undefined}
          />
        )}
      </main>
    </div>
  )
}

export default App
