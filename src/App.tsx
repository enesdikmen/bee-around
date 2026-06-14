import { useEffect, useRef, useState } from 'react'
import BentoPoster from './pages/BentoPoster'
import AboutPage from './pages/AboutPage'
import { places } from './data/lensFallbacks'
import {
  getUiText,
  normalizeUiLanguage,
  UI_LANGUAGES,
  type UiLanguage,
} from './i18n/uiText'
import {
  canonicalizePlace,
  readLanguageFromLocation,
  readLocksFromLocation,
  readShareFromLocation,
  readThemeFromLocation,
} from './lib/shareToken'
import type { Place } from './types/lens'

type AppView = 'poster' | 'about'
type AppTheme =
  | 'playful'
  | 'canopy'
  | 'prism'
  | 'afterdark'
  | 'acidgarden'
type AppThemeOption = { id: AppTheme; label: string; swatch: string }

const brandLogoSrc = `${import.meta.env.BASE_URL}logo.svg`
const THEME_STORAGE_KEY = 'bee-around-theme'
const THEME_CLASS_BY_ID: Record<AppTheme, string> = {
  playful: 'theme-playful',
  canopy: 'theme-canopy',
  prism: 'theme-prism',
  afterdark: 'theme-afterdark',
  acidgarden: 'theme-acidgarden',
}
const THEME_OPTIONS: AppThemeOption[] = [
  { id: 'playful', label: 'Original', swatch: 'rgb(251 191 36)' },
  { id: 'canopy', label: 'Aqua', swatch: 'rgb(24 198 196)' },
  {
    id: 'prism',
    label: 'Prism',
    swatch:
      'linear-gradient(135deg, rgb(0 190 220) 0 45%, rgb(255 230 0) 45% 72%, rgb(74 58 255) 72% 100%)',
  },
  {
    id: 'afterdark',
    label: 'Afterdark',
    swatch:
      'linear-gradient(135deg, rgb(42 16 84) 0 52%, rgb(255 112 32) 52% 76%, rgb(198 255 0) 76% 100%)',
  },
  {
    id: 'acidgarden',
    label: 'Acid Garden',
    swatch:
      'linear-gradient(135deg, rgb(29 88 44) 0 50%, rgb(199 255 24) 50% 76%, rgb(116 82 255) 76% 100%)',
  },
]

const isAppTheme = (value: string | null): value is AppTheme =>
  value === 'playful' ||
  value === 'canopy' ||
  value === 'prism' ||
  value === 'afterdark' ||
  value === 'acidgarden'

const readThemeFromStorage = (): AppTheme => {
  if (typeof window === 'undefined') return 'playful'
  const themeFromUrl = readThemeFromLocation()
  if (isAppTheme(themeFromUrl)) return themeFromUrl
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isAppTheme(stored) ? stored : 'playful'
  } catch {
    return 'playful'
  }
}

const readViewFromLocation = (): AppView =>
  typeof window !== 'undefined' && window.location.hash === '#about'
    ? 'about'
    : 'poster'

const initialShare = readShareFromLocation()
const initialLocks = readLocksFromLocation()
const initialLanguage = readLanguageFromLocation()
const defaultPlaceSeed = places.find((place) => place.id === 'nairobi-ke') ?? places[0]
const defaultPlace = canonicalizePlace({
  ...defaultPlaceSeed,
  // Treat first-load Nairobi like a searched city so URL/state mirrors
  // selector-driven custom-place behavior (`c.*` token path).
  id: 'default-nairobi-bootstrap',
})

function App() {
  const [selectedPlace, setSelectedPlace] = useState<Place>(
    initialShare?.place ?? defaultPlace,
  )
  const [view, setView] = useState<AppView>(readViewFromLocation)
  const [theme, setTheme] = useState<AppTheme>(readThemeFromStorage)
  const [commonNameLanguage, setCommonNameLanguage] = useState<UiLanguage>(() =>
    normalizeUiLanguage(initialLanguage),
  )

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

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Ignore storage errors; theme still applies for current session.
    }
  }, [theme])

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

  return (
    <div className={`app-shell ${THEME_CLASS_BY_ID[theme]} text-ink`}>
      <header className="app-header">
        <button type="button" className="app-brand" onClick={() => showView('poster')}>
          <span
            className="app-brand__mark"
            style={{ '--brand-logo-url': `url("${brandLogoSrc}")` } as React.CSSProperties}
          />
          <span className="app-brand__text">
            <span className="app-brand__name">Bee Around</span>
            <span className="app-brand__tag">Biodiversity portraits</span>
          </span>
        </button>
      </header>
      {view === 'about' && (
        <AppHeaderControls
          theme={theme}
          themeOptions={THEME_OPTIONS}
          onThemeChange={setTheme}
          commonNameLanguage={commonNameLanguage}
          onLanguageChange={setCommonNameLanguage}
        />
      )}

      <main className="app-main">
        <section className={`app-view${view === 'poster' ? '' : ' app-view--hidden'}`} aria-hidden={view !== 'poster'}>
          <BentoPoster
            selectedPlace={selectedPlace}
            onPlaceChange={handlePlaceChange}
            theme={theme}
            themeOptions={THEME_OPTIONS}
            onThemeChange={setTheme}
            commonNameLanguage={commonNameLanguage}
            onLanguageChange={setCommonNameLanguage}
            initialSeed={initialShare?.seed}
            initialLocks={initialLocks}
            onShowAbout={() => showView('about')}
          />
        </section>
        <section className={`app-view${view === 'about' ? '' : ' app-view--hidden'}`} aria-hidden={view !== 'about'}>
          <AboutPage language={commonNameLanguage} onBack={() => showView('poster')} />
        </section>
      </main>
    </div>
  )
}

function AppHeaderControls({
  theme,
  themeOptions,
  onThemeChange,
  commonNameLanguage,
  onLanguageChange,
}: {
  theme: AppTheme
  themeOptions: AppThemeOption[]
  onThemeChange: (theme: AppTheme) => void
  commonNameLanguage: UiLanguage
  onLanguageChange: (language: UiLanguage) => void
}) {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false)
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
  const themeMenuRef = useRef<HTMLDivElement | null>(null)
  const languageMenuRef = useRef<HTMLDivElement | null>(null)
  const activeThemeOption =
    themeOptions.find((option) => option.id === theme) ?? themeOptions[0]
  const uiText = getUiText(commonNameLanguage)

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (!themeMenuRef.current?.contains(target)) setIsThemeMenuOpen(false)
      if (!languageMenuRef.current?.contains(target)) setIsLanguageMenuOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  return (
    <div className="bento-toolbar app-header-controls" aria-label="Display options">
      <div className="bento-toolbar__menu" ref={themeMenuRef}>
        <button
          type="button"
          className="bento-toolbar__icon-btn bento-toolbar__icon-btn--theme"
          title="Theme"
          aria-label="Theme"
          aria-haspopup="menu"
          aria-expanded={isThemeMenuOpen}
          onClick={() =>
            setIsThemeMenuOpen((open) => {
              const next = !open
              if (next) setIsLanguageMenuOpen(false)
              return next
            })
          }
          style={{ '--theme-swatch': activeThemeOption?.swatch } as React.CSSProperties}
        >
          <span className="bento-toolbar__theme-trigger-swatch" aria-hidden="true" />
        </button>
        {isThemeMenuOpen && (
          <div className="bento-toolbar__theme-popover" role="menu" aria-label="Theme">
            {themeOptions.map((option) => {
              const isActive = option.id === theme
              return (
                <button
                  key={option.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  aria-label={option.label}
                  title={option.label}
                  className={
                    'bento-toolbar__theme-option' +
                    (isActive ? ' bento-toolbar__theme-option--active' : '')
                  }
                  style={{ '--swatch': option.swatch } as React.CSSProperties}
                  onClick={() => {
                    onThemeChange(option.id)
                    setIsThemeMenuOpen(false)
                  }}
                />
              )
            })}
          </div>
        )}
      </div>
      <div className="bento-toolbar__menu" ref={languageMenuRef}>
        <button
          type="button"
          className="bento-toolbar__icon-btn"
          title={uiText.toolbar.language}
          aria-label={uiText.toolbar.languageAria}
          aria-haspopup="menu"
          aria-expanded={isLanguageMenuOpen}
          onClick={() =>
            setIsLanguageMenuOpen((open) => {
              const next = !open
              if (next) setIsThemeMenuOpen(false)
              return next
            })
          }
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="12" cy="12" r="8.5" />
            <path d="M3.5 12h17" />
            <path d="M12 3.5c2.3 2.4 3.6 5.4 3.6 8.5S14.3 18.1 12 20.5" />
            <path d="M12 3.5c-2.3 2.4-3.6 5.4-3.6 8.5S9.7 18.1 12 20.5" />
          </svg>
        </button>
        {isLanguageMenuOpen && (
          <div className="bento-toolbar__menu-popover" role="menu" aria-label={uiText.toolbar.language}>
            {UI_LANGUAGES.map((option) => {
              const isActive = option.code === commonNameLanguage
              return (
                <button
                  key={option.code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  className={
                    'bento-toolbar__menu-option' +
                    (isActive ? ' bento-toolbar__menu-option--active' : '')
                  }
                  onClick={() => {
                    onLanguageChange(option.code)
                    setIsLanguageMenuOpen(false)
                  }}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
