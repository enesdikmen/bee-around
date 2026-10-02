/**
 * BentoPoster — full-page bento-style biodiversity poster.
 *
 * The poster is a pure function of its state (seed + fixed cards, see
 * lib/posterState) and the place's data: cards are assembled and packed by
 * lib/posterLayout. A new poster is only shown once all of its data and
 * images are ready, so Regenerate swaps the whole poster at once.
 */
import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CitySearch from '../components/CitySearch'
import Loader from '../components/Loader'
import { selectLensData, useLensPools } from '../hooks/useLensData'
import { useSpeciesImages } from '../hooks/lensData/speciesImages'
import type { Placement } from '../lib/gridPacker'
import { printPosterToPdf } from '../lib/printPoster'
import { usePosterColumns } from '../hooks/usePosterColumns'
import {
  getUiText,
  UI_LANGUAGES,
  type UiLanguage,
} from '../i18n/uiText'
import { posterUrl } from '../lib/shareToken'
import {
  initialPosterState,
  posterReducer,
  readPosterParams,
} from '../lib/posterState'
import {
  assemblePosterCards,
  layoutPoster,
  type PosterCard,
  type SeedTiles,
} from '../lib/posterLayout'
import type { Place } from '../types/lens'
import { ALL_IMAGE_SOURCES } from '../api/speciesImage'
import { countFirstPosterTime, countPosterWithoutSpecies } from '../lib/analytics'
import {
  buildBentoTiles,
  buildSpeciesBackupTiles,
  buildThematicBackupTiles,
} from './bentoTiles'
import { POSTER_GRID_AREA, POSTER_GRID_H, POSTER_GRID_W } from '../lib/posterGrid'
import './BentoPoster.css'

type PosterThemeId =
  | 'playful'
  | 'canopy'
  | 'prism'
  | 'afterdark'
  | 'acidgarden'

// Only the first poster of a page load is timed: it is what someone opening
// a shared link waits for, measured from the start of the page load.
let firstPosterTimed = false

/** A complete poster, ready to show. */
type PosterView = {
  placeId: string
  cols: number
  cards: PosterCard[]
  placements: Map<string, Placement>
}

interface Props {
  selectedPlace: Place
  onPlaceChange: (place: Place) => void
  theme: PosterThemeId
  themeOptions: Array<{ id: PosterThemeId; label: string; swatch: string }>
  onThemeChange: (theme: PosterThemeId) => void
  commonNameLanguage: UiLanguage
  onLanguageChange: (language: UiLanguage) => void
  onShowAbout?: () => void
  /** Seed from a shared URL. */
  initialSeed?: number
  /** URL params of a shared link; fixed cards are read from them. */
  initialParams?: URLSearchParams
}

function BentoPoster({
  selectedPlace,
  onPlaceChange,
  theme,
  themeOptions,
  onThemeChange,
  commonNameLanguage,
  onLanguageChange,
  onShowAbout,
  initialSeed,
  initialParams,
}: Props) {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false)
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
  const uiText = getUiText(commonNameLanguage)
  // Printing always renders the canonical wide poster, whatever the screen is.
  const [forcePosterWide, setForcePosterWide] = useState(false)
  const pendingPrintRef = useRef(false)
  const GRID_W = usePosterColumns(forcePosterWide)
  const themeMenuRef = useRef<HTMLDivElement | null>(null)
  const languageMenuRef = useRef<HTMLDivElement | null>(null)
  const closeThemeMenu = () => setIsThemeMenuOpen(false)
  const closeLanguageMenu = () => setIsLanguageMenuOpen(false)
  const activeThemeOption =
    themeOptions.find((option) => option.id === theme) ?? themeOptions[0]
  const selectTheme = (nextTheme: PosterThemeId) => {
    onThemeChange(nextTheme)
    closeThemeMenu()
  }
  const selectLanguage = (language: UiLanguage) => {
    onLanguageChange(language)
    closeLanguageMenu()
  }

  const placeName = selectedPlace?.label?.split(',')[0]?.trim() ?? uiText.citySearch.pickCity
  const latitude = selectedPlace?.latitude
  const longitude = selectedPlace?.longitude

  // Source priority is intentionally fixed in UI for a simpler experience.
  // To change fallback order later, edit `ALL_IMAGE_SOURCES` in
  // `src/api/speciesImage.ts`.
  const effectiveSources = ALL_IMAGE_SOURCES

  // ── State: the seed and the fixed (locked or held) cards ───────────────
  const [state, dispatch] = useReducer(posterReducer, undefined, () => {
    const seed = initialSeed && Number.isFinite(initialSeed) ? initialSeed : 1
    return initialParams
      ? readPosterParams(initialParams, seed, GRID_W)
      : initialPosterState(seed, GRID_W)
  })

  // A new place starts from the default locks. Reset during render so the
  // old place's fixed cards are never applied to the new place's data.
  const [statePlaceId, setStatePlaceId] = useState(selectedPlace.id)
  if (statePlaceId !== selectedPlace.id) {
    setStatePlaceId(selectedPlace.id)
    dispatch({ type: 'reset', cols: GRID_W })
  }

  // ── Data: fetched once per place, selected per seed ───────────────────
  const pools = useLensPools(selectedPlace, commonNameLanguage)
  // The current poster plus every poster a fixed card was captured from.
  const seedsKey = Array.from(
    new Set([state.seed, ...state.locks.map((c) => c.seed), ...state.held.map((c) => c.seed)]),
  )
    .sort((a, b) => a - b)
    .join(',')
  const posters = useMemo(
    () =>
      pools.isReady
        ? seedsKey.split(',').map((seed) => ({
            seed: Number(seed),
            data: selectLensData(pools, Number(seed)),
          }))
        : [],
    [pools, seedsKey],
  )
  const posterData = useMemo(() => posters.map((p) => p.data), [posters])
  const { applyImages, isReady: imagesReady } = useSpeciesImages(posterData, effectiveSources)
  // The last complete poster, kept on screen while the next one loads.
  const [lastView, setLastView] = useState<PosterView | null>(null)
  // The first poster of a place waits for its photos, so a shared link opens
  // complete. Later posters (Regenerate, language) show at once: their
  // species are final, and photos not looked up yet fade in when they arrive.
  const hasShownPlace = lastView?.placeId === selectedPlace.id
  const isComplete = pools.isReady && posters.length > 0 && (imagesReady || hasShownPlace)

  // The address bar and the sources QR code both come from the state.
  const shareUrl = useMemo(() => {
    const url = posterUrl(selectedPlace, state, commonNameLanguage, theme)
    url.hash = ''
    return url.toString()
  }, [selectedPlace, state, commonNameLanguage, theme])

  useEffect(() => {
    const next = posterUrl(selectedPlace, state, commonNameLanguage, theme).toString()
    if (next !== window.location.href) window.history.replaceState(null, '', next)
  }, [selectedPlace, state, commonNameLanguage, theme])

  // ── View: assemble and pack a complete poster ─────────────────────────
  const assembled = useMemo(() => {
    if (!isComplete) return null
    const dataBySeed = new Map(posters.map((p) => [p.seed, applyImages(p.data)]))
    const tilesBySeed = new Map<number, SeedTiles>()
    const tilesFor = (seed: number): SeedTiles => {
      const cached = tilesBySeed.get(seed)
      if (cached) return cached
      const data = dataBySeed.get(seed)
      const tiles: SeedTiles = data
        ? {
            main: buildBentoTiles({
              placeName,
              latitude,
              longitude,
              data,
              contentSeed: seed,
              shareUrl,
              language: commonNameLanguage,
              uiText,
            }),
            backups: [
              ...buildThematicBackupTiles(data, commonNameLanguage, uiText),
              ...buildSpeciesBackupTiles(data, commonNameLanguage, uiText),
            ],
          }
        : { main: [], backups: [] }
      tilesBySeed.set(seed, tiles)
      return tiles
    }
    const cards = assemblePosterCards(state, GRID_W, tilesFor)
    return {
      cards,
      seed: state.seed,
      cols: GRID_W,
      key: `${state.seed}|${GRID_W}|${cards.map((c) => c.id).join(',')}`,
    }
  }, [isComplete, posters, applyImages, state, GRID_W, shareUrl, placeName, latitude, longitude, commonNameLanguage, uiText])

  // Packing is kept while the same cards sit in the same places, so locking,
  // unlocking or switching language never reshuffles the poster. It is
  // recomputed during render (not in an effect) so no frame shows a stale layout.
  const [layout, setLayout] = useState<{ key: string; cards: PosterCard[]; placements: Placement[] } | null>(null)
  let currentLayout = layout
  if (assembled) {
    const reusable =
      layout?.key === assembled.key &&
      assembled.cards.every((c) => {
        if (!c.pinXY) return true
        const p = layout.placements.find((pl) => pl.id === c.id)
        return p?.x === c.pinXY.x && p?.y === c.pinXY.y
      })
    if (!reusable) {
      currentLayout = { key: assembled.key, ...layoutPoster(assembled.cards, assembled.cols, assembled.seed) }
      setLayout(currentLayout)
    }
  }

  const view = useMemo<PosterView | null>(() => {
    if (!assembled || !currentLayout) return null
    // Refresh content (images, language) on the kept layout.
    const byId = new Map(assembled.cards.map((c) => [c.id, c]))
    return {
      placeId: selectedPlace.id,
      cols: assembled.cols,
      cards: currentLayout.cards.map((c) => byId.get(c.id) ?? c),
      placements: new Map(currentLayout.placements.map((p) => [p.id, p])),
    }
  }, [assembled, currentLayout, selectedPlace.id])

  if (view && view !== lastView) setLastView(view)
  const shownView = view ?? lastView
  // The loader covers the first poster of a place; Regenerate and language
  // changes keep the previous poster up until the new one is complete.
  const isLoadingSnapshot = !view && shownView?.placeId !== selectedPlace.id
  const isToolbarDisabled = isLoadingSnapshot
  // Menus never show over the loader.
  const showThemeMenu = isThemeMenuOpen && !isToolbarDisabled
  const showLanguageMenu = isLanguageMenuOpen && !isToolbarDisabled
  const shownCols = shownView?.cols ?? GRID_W
  const shownRows = POSTER_GRID_AREA / shownCols
  const lockedSlotIds = useMemo(() => new Set(state.locks.map((c) => c.slotId)), [state.locks])

  useEffect(() => {
    if (isLoadingSnapshot || firstPosterTimed) return
    firstPosterTimed = true
    countFirstPosterTime(performance.now() / 1000)
  }, [isLoadingSnapshot])

  const hasSpecies = view ? view.cards.some((c) => c.speciesIds?.length) : null
  useEffect(() => {
    if (hasSpecies === false) countPosterWithoutSpecies()
  }, [hasSpecies])

  useEffect(() => {
    if (!isLanguageMenuOpen && !isThemeMenuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      const isInsideLanguageMenu = languageMenuRef.current?.contains(target)
      const isInsideThemeMenu = themeMenuRef.current?.contains(target)
      if (!isInsideLanguageMenu && !isInsideThemeMenu) {
        closeThemeMenu()
        closeLanguageMenu()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeThemeMenu()
        closeLanguageMenu()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isLanguageMenuOpen, isThemeMenuOpen])

  const handleDownloadPdf = () => {
    if (isToolbarDisabled) return
    // On a narrow viewport the poster is packed at 2 or 3 columns. Re-pack to
    // the canonical width first and print from the effect below, once that
    // layout has actually rendered.
    if (GRID_W !== POSTER_GRID_W) {
      pendingPrintRef.current = true
      setForcePosterWide(true)
      return
    }
    printPosterToPdf({
      gridW: POSTER_GRID_W,
      gridH: POSTER_GRID_H,
      placeName,
      seed: state.seed,
    })
  }

  useEffect(() => {
    if (!pendingPrintRef.current) return
    if (!forcePosterWide || shownView?.cols !== POSTER_GRID_W) return
    pendingPrintRef.current = false
    const restoreNarrowLayout = () => {
      setForcePosterWide(false)
      window.removeEventListener('afterprint', restoreNarrowLayout)
    }
    window.addEventListener('afterprint', restoreNarrowLayout)
    printPosterToPdf({
      gridW: POSTER_GRID_W,
      gridH: POSTER_GRID_H,
      placeName,
      seed: state.seed,
    })
  }, [forcePosterWide, shownView?.cols, placeName, state.seed])

  const toggleLock = (card: PosterCard, at: Placement) => {
    if (isToolbarDisabled || !card.slotId || !shownView) return
    const shown = new Map<string, { x: number; y: number }>()
    for (const c of shownView.cards) {
      const p = shownView.placements.get(c.id)
      if (c.slotId && p) shown.set(c.slotId, { x: p.x, y: p.y })
    }
    if (lockedSlotIds.has(card.slotId)) {
      dispatch({ type: 'unlock', slotId: card.slotId, cols: shownView.cols, shown })
    } else {
      dispatch({
        type: 'lock',
        // The seed the visible content came from, which is not always the
        // current seed (e.g. a card kept after unlocking).
        card: { slotId: card.slotId, seed: card.sourceSeed, x: at.x, y: at.y },
        cols: shownView.cols,
        shown,
      })
    }
  }

  return (
    <div className="bento-shell">
      <div className="bento-toolbar">
        <CitySearch
          selected={selectedPlace}
          onSelect={onPlaceChange}
          language={commonNameLanguage}
          text={uiText.citySearch}
          disabled={isToolbarDisabled}
        />
        <button
          type="button"
          className="bento-toolbar__btn bento-toolbar__btn--primary"
          disabled={isToolbarDisabled}
          onClick={() => {
            if (isToolbarDisabled) return
            dispatch({ type: 'regenerate' })
          }}
          title={uiText.toolbar.regenerateTitle}
        >
          ↻ {uiText.toolbar.regenerate}
        </button>
        <button
          type="button"
          className="bento-toolbar__btn"
          onClick={handleDownloadPdf}
          disabled={isToolbarDisabled}
          title={uiText.toolbar.pdfTitle}
        >
          ⤓ {uiText.toolbar.pdf}
        </button>
        {onShowAbout && (
          <button
            type="button"
            className="bento-toolbar__icon-btn"
            title={uiText.toolbar.about}
            aria-label={uiText.toolbar.about}
            disabled={isToolbarDisabled}
            onClick={onShowAbout}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9">
              <circle cx="12" cy="12" r="8.5" />
              <path d="M12 10.5v5.25" strokeLinecap="round" />
              <path d="M12 7.25h.01" strokeLinecap="round" />
            </svg>
          </button>
        )}
        <div className="bento-toolbar__menu" ref={themeMenuRef}>
          <button
            type="button"
            className="bento-toolbar__icon-btn bento-toolbar__icon-btn--theme"
            title={uiText.toolbar.theme}
            aria-label={uiText.toolbar.theme}
            aria-haspopup="menu"
            aria-expanded={showThemeMenu}
            disabled={isToolbarDisabled}
            onClick={() =>
              setIsThemeMenuOpen((open) => {
                const next = !open
                if (next) closeLanguageMenu()
                return next
              })
            }
            style={{ '--theme-swatch': activeThemeOption?.swatch } as React.CSSProperties}
          >
            <span className="bento-toolbar__theme-trigger-swatch" aria-hidden="true" />
          </button>
          {showThemeMenu && (
            <div className="bento-toolbar__theme-popover" role="menu" aria-label={uiText.toolbar.theme}>
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
                    disabled={isToolbarDisabled}
                    style={{ '--swatch': option.swatch } as React.CSSProperties}
                    onClick={() => selectTheme(option.id)}
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
            aria-expanded={showLanguageMenu}
            disabled={isToolbarDisabled}
            onClick={() =>
              setIsLanguageMenuOpen((open) => {
                const next = !open
                if (next) closeThemeMenu()
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
          {showLanguageMenu && (
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
                    disabled={isToolbarDisabled}
                    onClick={() => selectLanguage(option.code)}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className={`bento-grid-wrap${isLoadingSnapshot ? ' bento-grid-wrap--loading' : ''}`}>
        <div
          className="bento-grid"
          style={{
            gridTemplateColumns: `repeat(${shownCols}, 1fr)`,
            gridTemplateRows: `repeat(${shownRows}, 1fr)`,
            aspectRatio: `${shownCols} / ${shownRows}`,
          }}
        >
          <AnimatePresence>
            {(shownView?.cards ?? []).map((t) => {
              const p = shownView?.placements.get(t.id)
              if (!p) return null
              const isLocked = !!t.slotId && lockedSlotIds.has(t.slotId)
              const canLock = !!t.slotId && !t.className.includes('bento-card--filler')
              const tileKey = t.slotId ? `slot-${t.slotId}` : `tile-${t.id}`
              const className = [
                t.className,
                isLocked ? 'bento-card--locked' : '',
                p.y === 0 ? 'bento-card--top-row' : '',
              ].filter(Boolean).join(' ')
              const style = {
                gridColumn: `${p.x + 1} / span ${p.w}`,
                gridRow: `${p.y + 1} / span ${p.h}`,
              }
              const cardBody = (
                <>
                  {canLock && (
                    <button
                      type="button"
                      className={
                        'bento-lock-btn' + (isLocked ? ' bento-lock-btn--on' : '')
                      }
                      onClick={() => toggleLock(t, p)}
                      title={isLocked ? uiText.toolbar.unlockCardTitle : uiText.toolbar.lockCardTitle}
                      aria-label={isLocked ? uiText.toolbar.unlockCard : uiText.toolbar.lockCard}
                      aria-pressed={isLocked}
                      disabled={isLoadingSnapshot}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" width="17" height="17">
                        {isLocked ? (
                          <path
                            fill="currentColor"
                            d="M6 10V8a6 6 0 1 1 12 0v2h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1h1Zm2 0h8V8a4 4 0 1 0-8 0v2Z"
                          />
                        ) : (
                          <path
                            fill="currentColor"
                            d="M8 10V8a4 4 0 0 1 7.874-1 1 1 0 1 1-1.948.45A2 2 0 0 0 10 8v2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1h3Z"
                          />
                        )}
                      </svg>
                    </button>
                  )}
                  {t.render({ disableTooltips: isLoadingSnapshot })}
                </>
              )

              return (
                <motion.div
                  key={tileKey}
                  layout={isLocked ? false : 'position'}
                  initial={isLocked ? false : { opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={isLocked ? undefined : { opacity: 0, scale: 0.92 }}
                  transition={
                    isLocked
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 220, damping: 26 }
                  }
                  className={className}
                  style={style}
                >
                  {cardBody}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
        {isLoadingSnapshot && (
          <div className="bento-grid-loading" role="status" aria-live="polite">
            <Loader
              size={112}
              label={uiText.toolbar.loadingSnapshot}
              steps={uiText.toolbar.loadingSnapshotSteps}
            />
          </div>
        )}
      </div>
      <p className="bento-print-footer" aria-hidden="true">
        <span>{uiText.poster.printFooter}</span>
      </p>
    </div>
  )
}

export default BentoPoster
