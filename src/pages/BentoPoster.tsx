/**
 * BentoPoster — full-page bento-style biodiversity poster.
 *
 * Tiles come from `buildBentoTiles` and are packed by `gridPacker` into a
 * tight rectangle. Filler tiles pad the layout so cells stay square. The
 * regenerate button reshuffles by bumping a single poster seed.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CitySearch from '../components/CitySearch'
import { useLensData, type LensData } from '../hooks/useLensData'
import { packWithRetries, type BoxSpec, type Placement } from '../lib/gridPacker'
import type { Place } from '../types/lens'
import { IMAGE_SOURCE_LABELS } from '../api/speciesImage'
import type { ImageSourceConfig } from '../App'
import {
  buildBentoTiles,
  padToRectangle,
  POSTER_ASPECTS,
  type PosterAspect,
  type Tile,
} from './bentoTiles'
import './BentoPoster.css'

const ASPECT_ORDER: PosterAspect[] = ['horizontal', 'vertical', 'square']

interface Props {
  selectedPlace: Place
  onPlaceChange: (place: Place) => void
  imageSourceConfig: ImageSourceConfig
  onImageSourceConfigChange: (next: ImageSourceConfig) => void
}

function BentoPoster({
  selectedPlace,
  onPlaceChange,
  imageSourceConfig,
  onImageSourceConfigChange,
}: Props) {
  // Single seed for poster-level variation. Layout and data already consume it;
  // future style themes should derive from this same seed as well.
  const [posterSeed, setPosterSeed] = useState(1)
  const [layoutShuffleSeed, setLayoutShuffleSeed] = useState(1)
  const [aspect, setAspect] = useState<PosterAspect>('horizontal')
  const aspectCfg = POSTER_ASPECTS[aspect]
  const GRID_W = aspectCfg.gridW

  const placeName = selectedPlace?.label?.split(',')[0]?.trim() ?? 'Pick a place'
  const latitude = selectedPlace?.latitude
  const longitude = selectedPlace?.longitude

  // Active sources, in priority order. This is the only thing the data layer
  // ever sees — `imageSourceConfig` is a UI-only concern.
  const effectiveSources = useMemo(
    () => imageSourceConfig.filter((c) => c.active).map((c) => c.source),
    [imageSourceConfig],
  )

  const data = useLensData(selectedPlace, {
    imageSources: effectiveSources,
    // Keep content choices tied to the same poster seed as layout.
    contentSeed: posterSeed,
  })

  // Freeze visual output to the last fully-ready snapshot for each place/source
  // selection. This avoids partial card churn while async pieces settle.
  const snapshotKey = useMemo(
    () => `${selectedPlace?.id ?? 'none'}::${effectiveSources.join(',')}`,
    [selectedPlace?.id, effectiveSources],
  )
  const [committedSnapshot, setCommittedSnapshot] = useState<{
    key: string
    data: LensData
  } | null>(null)

  useEffect(() => {
    if (!data.isReady) return
    if (committedSnapshot?.key === snapshotKey) return
    setCommittedSnapshot({ key: snapshotKey, data })
    setLayoutShuffleSeed((s) => s + 1)
  }, [data, snapshotKey, committedSnapshot?.key])

  const displayData =
    committedSnapshot?.key === snapshotKey ? data : committedSnapshot?.data ?? null
  // Only show the loading overlay while we are waiting on the *first* ready
  // snapshot for the current place/sources. Regenerate (posterSeed bump)
  // keeps the same snapshotKey, so tiles update in place as new species
  // images stream in — the overlay does not flash back on.
  const isLoadingSnapshot = !displayData || committedSnapshot?.key !== snapshotKey

  // ── Per-card lock feature ─────────────────────────────────────────────
  // A locked tile freezes both its content (render closure + species ids)
  // and its grid position across Regenerate. Locks are keyed by `slotId`
  // (stable across content rotation, e.g. `mini-0`). When place / aspect /
  // image sources change the locked content becomes meaningless, so we
  // drop all locks.
  type Lock = { tile: Tile; x: number; y: number }
  const [locks, setLocks] = useState<Map<string, Lock>>(new Map())
  useEffect(() => {
    setLocks((prev) => (prev.size === 0 ? prev : new Map()))
  }, [selectedPlace?.id, aspect, effectiveSources.join(',')])

  const tiles = useMemo(() => {
    if (!displayData) return []
    const built = buildBentoTiles({
      placeName,
      latitude,
      longitude,
      data: displayData,
      contentSeed: posterSeed,
      aspect,
    })

    // Apply locks: replace locked slots with their frozen snapshot, drop
    // unlocked tiles that would duplicate a locked species, and append
    // any locked slots that aren't emitted by the fresh build.
    const lockedSlotIds = new Set(locks.keys())
    const lockedSpeciesIds = new Set<string>()
    for (const lock of locks.values()) {
      for (const sid of lock.tile.speciesIds ?? []) lockedSpeciesIds.add(sid)
    }
    const seenSlots = new Set<string>()
    const merged: Tile[] = []
    for (const t of built) {
      if (t.slotId && lockedSlotIds.has(t.slotId)) {
        const lock = locks.get(t.slotId)!
        merged.push({ ...lock.tile, pinXY: { x: lock.x, y: lock.y } })
        seenSlots.add(t.slotId)
        continue
      }
      // Drop any unlocked tile showing a species already claimed by a lock.
      if (t.speciesIds && t.speciesIds.some((id) => lockedSpeciesIds.has(id))) continue
      merged.push(t)
    }
    // Locked slots that no longer appear in the fresh build (e.g. a thematic
    // strip that dropped out for this seed) still need to be rendered.
    for (const [slotId, lock] of locks) {
      if (seenSlots.has(slotId)) continue
      merged.push({ ...lock.tile, pinXY: { x: lock.x, y: lock.y } })
    }

    // Fixed-height posters (square) need exact area padding; flexible-height
    // posters just need the total area to be a multiple of GRID_W.
    const targetArea =
      typeof aspectCfg.fixedH === 'number' ? GRID_W * aspectCfg.fixedH : undefined
    return padToRectangle(merged, GRID_W, targetArea)
  }, [placeName, latitude, longitude, displayData, aspect, aspectCfg.fixedH, GRID_W, posterSeed, locks])

  // Pack the tiles. For flexible-height posters the area is a multiple of
  // GRID_W so the exact-height rectangle should always fit; we allow +2 rows
  // of slack in case anchor constraints make the tightest layout infeasible.
  // For fixed-height posters we lock to exactly that height.
  //
  // We cache the pack result and re-use it whenever the seed/aspect/tile-set
  // is unchanged. This is what makes a Lock toggle a pure metadata update:
  // locking a card adds `pinXY` to one tile but does not change the tile id
  // list, so the cached placements are kept and nothing else on the poster
  // shuffles. A real Regenerate bumps `posterSeed`, which busts the cache.
  const packCacheRef = useRef<{
    key: string
    placements: Placement[]
    gridH: number
  } | null>(null)
  const { placements, gridH } = useMemo(() => {
    const cacheKey = `${posterSeed}|${layoutShuffleSeed}|${aspect}|${GRID_W}|${tiles
      .map((t) => t.id)
      .join(',')}`
    if (packCacheRef.current?.key === cacheKey) {
      return {
        placements: packCacheRef.current.placements,
        gridH: packCacheRef.current.gridH,
      }
    }
    const exactH = tiles.reduce((s, t) => s + t.w * t.h, 0) / GRID_W
    const startH = aspectCfg.fixedH ?? exactH
    const endH = aspectCfg.fixedH ?? exactH + 2
    for (let h = startH; h <= endH; h++) {
      // Hard pins are resolved against the *current* grid height attempt so
      // that e.g. `bottom-right` always means the actual bottom-right corner.
      const specs: BoxSpec[] = tiles.map((t) => {
        // Lock-card pin: freeze to an exact (x,y) regardless of corner.
        // Clamp y so a tile locked on a taller layout still fits when the
        // grid shrinks (defensive — we already drop locks on aspect change).
        if (t.pinXY) {
          const x = Math.max(0, Math.min(GRID_W - t.w, t.pinXY.x))
          const y = Math.max(0, Math.min(h - t.h, t.pinXY.y))
          return { id: t.id, w: t.w, h: t.h, constraint: { pin: { x, y } } }
        }
        if (t.pin) {
          const x = t.pin === 'top-right' || t.pin === 'bottom-right' ? GRID_W - t.w : 0
          const y = t.pin === 'bottom-left' || t.pin === 'bottom-right' ? h - t.h : 0
          return { id: t.id, w: t.w, h: t.h, constraint: { pin: { x, y } } }
        }
        if (t.anchor) {
          return { id: t.id, w: t.w, h: t.h, constraint: { anchor: t.anchor } }
        }
        return { id: t.id, w: t.w, h: t.h }
      })
      const layoutSeed = posterSeed * 7919 + layoutShuffleSeed * 104729
      const r = packWithRetries({ width: GRID_W, height: h, boxes: specs, seed: layoutSeed }, 60)
      if (r) {
        packCacheRef.current = { key: cacheKey, placements: r.placements, gridH: h }
        return { placements: r.placements, gridH: h }
      }
    }
    return { placements: [], gridH: startH }
  }, [tiles, posterSeed, layoutShuffleSeed, GRID_W, aspectCfg.fixedH, aspect])

  const placementById = useMemo(() => {
    const m = new Map<string, (typeof placements)[number]>()
    for (const p of placements) m.set(p.id, p)
    return m
  }, [placements])

  const toggleLock = (t: Tile, p: { x: number; y: number }) => {
    if (!t.slotId) return
    const slotId = t.slotId
    setLocks((prev) => {
      const next = new Map(prev)
      if (next.has(slotId)) next.delete(slotId)
      else next.set(slotId, { tile: t, x: p.x, y: p.y })
      return next
    })
  }

  return (
    <div className="bento-shell">
      <div className="bento-toolbar">
        <CitySearch selected={selectedPlace} onSelect={onPlaceChange} />
        <span className="bento-toolbar__sources" title="Image sources — checkbox toggles active state, arrows reorder priority">
          <span className="bento-toolbar__sources-label">Images:</span>
          {imageSourceConfig.map((entry, i) => {
            const setActive = (active: boolean) =>
              onImageSourceConfigChange(
                imageSourceConfig.map((c) =>
                  c.source === entry.source ? { ...c, active } : c,
                ),
              )
            const swap = (j: number) => {
              if (j < 0 || j >= imageSourceConfig.length) return
              const next = imageSourceConfig.slice()
              ;[next[i], next[j]] = [next[j], next[i]]
              onImageSourceConfigChange(next)
            }
            return (
              <span key={entry.source} className="bento-toolbar__source">
                <label className="bento-toolbar__check">
                  <input
                    type="checkbox"
                    checked={entry.active}
                    onChange={(e) => setActive(e.target.checked)}
                  />
                  {IMAGE_SOURCE_LABELS[entry.source]}
                </label>
                <button
                  type="button"
                  className="bento-toolbar__rank"
                  onClick={() => swap(i - 1)}
                  disabled={i === 0}
                  title="Move up in priority"
                  aria-label={`Move ${IMAGE_SOURCE_LABELS[entry.source]} up`}
                >▲</button>
                <button
                  type="button"
                  className="bento-toolbar__rank"
                  onClick={() => swap(i + 1)}
                  disabled={i === imageSourceConfig.length - 1}
                  title="Move down in priority"
                  aria-label={`Move ${IMAGE_SOURCE_LABELS[entry.source]} down`}
                >▼</button>
              </span>
            )
          })}
        </span>
        <button
          type="button"
          className="bento-toolbar__btn bento-toolbar__btn--primary"
          onClick={() => setPosterSeed((s) => s + 1)}
          title="Regenerate layout and data"
        >
          ↻ Regenerate
        </button>
        <span className="bento-toolbar__aspects" role="group" aria-label="Poster shape">
          {ASPECT_ORDER.map((a) => (
            <button
              key={a}
              type="button"
              className={
                'bento-toolbar__btn' +
                (aspect === a ? ' bento-toolbar__btn--primary' : '')
              }
              onClick={() => setAspect(a)}
              title={`${POSTER_ASPECTS[a].label} poster`}
              aria-pressed={aspect === a}
            >
              {POSTER_ASPECTS[a].label}
            </button>
          ))}
        </span>
      </div>

      <div className={`bento-grid-wrap${isLoadingSnapshot ? ' bento-grid-wrap--loading' : ''}`}>
        <div
          className={`bento-grid bento-grid--${aspect}`}
          style={{
            gridTemplateColumns: `repeat(${GRID_W}, 1fr)`,
            gridTemplateRows: `repeat(${gridH}, 1fr)`,
            aspectRatio: `${GRID_W} / ${gridH}`,
          }}
        >
          <AnimatePresence>
            {tiles.map((t) => {
              const p = placementById.get(t.id)
              if (!p) return null
              const isLocked = !!t.slotId && locks.has(t.slotId)
              const canLock = !!t.slotId && !t.className.includes('bento-card--filler')
              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                  className={t.className + (isLocked ? ' bento-card--locked' : '')}
                  style={{
                    gridColumn: `${p.x + 1} / span ${p.w}`,
                    gridRow: `${p.y + 1} / span ${p.h}`,
                  }}
                >
                  {canLock && (
                    <button
                      type="button"
                      className={
                        'bento-lock-btn' + (isLocked ? ' bento-lock-btn--on' : '')
                      }
                      onClick={() => toggleLock(t, { x: p.x, y: p.y })}
                      title={isLocked ? 'Unlock card' : 'Lock card content and position'}
                      aria-label={isLocked ? 'Unlock card' : 'Lock card'}
                      aria-pressed={isLocked}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" width="14" height="14">
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
                  {t.render()}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
        {isLoadingSnapshot && (
          <div className="bento-grid-loading" role="status" aria-live="polite">
            <div className="bento-grid-loading__panel">
              <span className="bento-grid-loading__dot" aria-hidden="true" />
              <span>Loading full place snapshot…</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BentoPoster
