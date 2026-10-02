/**
 * Poster state: the seed plus the cards the user has fixed in place.
 *
 * Everything shown on the poster is derived from this state and the data for
 * the place; no rendered card is stored. That keeps three things equal at all
 * times: what is on screen, what the URL encodes, and what a reopened link
 * shows.
 *
 * A card is fixed in one of two ways:
 * - locked: kept (content and position) across Regenerate until unlocked;
 * - held: just unlocked; kept as it is until the next Regenerate, so
 *   unlocking never swaps a card out from under the pointer.
 *
 * Each fixed card records the seed its content came from, so locked cards
 * from different Regenerates can sit side by side, and its position in a grid
 * of `cols` columns.
 */
import { POSTER_GRID_W, posterRows } from './posterGrid'

export type FixedCard = {
  slotId: string
  /** Seed of the poster the card's content came from. */
  seed: number
  x: number
  y: number
}

export type PosterState = {
  seed: number
  /** Column count the fixed cards' positions refer to. */
  cols: number
  locks: FixedCard[]
  held: FixedCard[]
}

/** Title (top-left) and sources (bottom-right) start locked. Both are 2 × 1. */
const TITLE = { slotId: 'title', w: 2, h: 1 }
const SOURCES = { slotId: 'sources', w: 2, h: 1 }

export const defaultLocks = (seed: number, cols: number): FixedCard[] => [
  { slotId: TITLE.slotId, seed, x: 0, y: 0 },
  { slotId: SOURCES.slotId, seed, x: cols - SOURCES.w, y: posterRows(cols) - SOURCES.h },
]

/** True when the locks are exactly the defaults (seeds do not matter: neither
 *  card's content depends on the seed). Default locks are left out of URLs. */
export const hasDefaultLocks = ({ locks, cols }: Pick<PosterState, 'locks' | 'cols'>) => {
  if (locks.length !== 2) return false
  return defaultLocks(1, cols).every((d) =>
    locks.some((l) => l.slotId === d.slotId && l.x === d.x && l.y === d.y),
  )
}

export const initialPosterState = (seed: number, cols: number): PosterState => ({
  seed,
  cols,
  locks: defaultLocks(seed, cols),
  held: [],
})

/**
 * Where a fixed card goes in a grid with a different column count. The card
 * keeps its offset from the nearest corner of the grid it was placed in, so
 * corner cards stay in their corner (title top-left, sources bottom-right)
 * and the rest stay roughly where they were. A card as wide as the grid
 * touches both sides; it keeps to the left, except sources, which belongs
 * on the right. The result may collide with another card; the layout
 * resolves that.
 */
export const mapPosition = (
  card: Pick<FixedCard, 'slotId' | 'x' | 'y'>,
  size: { w: number; h: number },
  fromCols: number,
  toCols: number,
): { x: number; y: number } => {
  if (fromCols === toCols) return { x: card.x, y: card.y }
  const fromRows = posterRows(fromCols)
  const toRows = posterRows(toCols)
  const right = fromCols - card.x - size.w
  const bottom = fromRows - card.y - size.h
  const keepLeft = card.x < right || (card.x === right && card.slotId !== SOURCES.slotId)
  const x = keepLeft ? card.x : toCols - size.w - right
  const y = card.y <= bottom ? card.y : toRows - size.h - bottom
  return {
    x: Math.max(0, Math.min(toCols - size.w, x)),
    y: Math.max(0, Math.min(toRows - size.h, y)),
  }
}

/** Positions of the cards currently on screen, by slot id. */
export type ShownPositions = ReadonlyMap<string, { x: number; y: number }>

export type PosterAction =
  | { type: 'regenerate' }
  | { type: 'lock'; card: FixedCard; cols: number; shown: ShownPositions }
  | { type: 'unlock'; slotId: string; cols: number; shown: ShownPositions }
  | { type: 'reset'; cols: number }

/** Re-record every fixed card at its on-screen position in a `cols`-column
 *  grid, so positions always refer to the grid the user last acted in. */
const rebase = (state: PosterState, cols: number, shown: ShownPositions): PosterState => {
  if (state.cols === cols) return state
  const at = (card: FixedCard): FixedCard => {
    const pos = shown.get(card.slotId)
    return pos ? { ...card, x: pos.x, y: pos.y } : card
  }
  return {
    ...state,
    cols,
    locks: state.locks.filter((c) => shown.has(c.slotId)).map(at),
    held: state.held.filter((c) => shown.has(c.slotId)).map(at),
  }
}

const without = (cards: FixedCard[], slotId: string) =>
  cards.filter((c) => c.slotId !== slotId)

export function posterReducer(state: PosterState, action: PosterAction): PosterState {
  switch (action.type) {
    case 'regenerate':
      return { ...state, seed: state.seed + 1, held: [] }
    case 'lock': {
      const next = rebase(state, action.cols, action.shown)
      return {
        ...next,
        locks: [...without(next.locks, action.card.slotId), action.card],
        held: without(next.held, action.card.slotId),
      }
    }
    case 'unlock': {
      const next = rebase(state, action.cols, action.shown)
      const card = next.locks.find((c) => c.slotId === action.slotId)
      if (!card) return next
      return {
        ...next,
        locks: without(next.locks, action.slotId),
        held: [...without(next.held, action.slotId), card],
      }
    }
    case 'reset':
      return initialPosterState(state.seed, action.cols)
  }
}

// ── URL ──────────────────────────────────────────────────────────────────
//
// `l` lists locked cards and `h` held cards, each as
// `<slotId>_<x36>_<y36>_<seed36>` joined by commas. `l` is left out when the
// locks are the defaults; an empty `l` means no locks at all. `g` is the
// column count positions refer to, left out when it is 6.

const SLOT_ID = /^[A-Za-z0-9-]+$/

const encodeCards = (cards: FixedCard[]) =>
  cards
    .filter((c) => SLOT_ID.test(c.slotId))
    .map((c) => [c.slotId, c.x.toString(36), c.y.toString(36), c.seed.toString(36)].join('_'))
    .join(',')

const decodeCards = (raw: string, cols: number): FixedCard[] => {
  const rows = posterRows(cols)
  const cards: FixedCard[] = []
  for (const part of raw.split(',')) {
    const [slotId, x36, y36, seed36, ...rest] = part.split('_')
    if (rest.length || !slotId || !SLOT_ID.test(slotId)) continue
    const x = Number.parseInt(x36, 36)
    const y = Number.parseInt(y36, 36)
    const seed = Number.parseInt(seed36, 36)
    if (![x, y, seed].every(Number.isInteger) || seed < 1) continue
    if (x < 0 || y < 0 || x >= cols || y >= rows) continue
    if (cards.some((c) => c.slotId === slotId)) continue
    cards.push({ slotId, x, y, seed })
  }
  return cards
}

const VALID_COLS = new Set([2, 3, POSTER_GRID_W])

/** Writes the fixed-card params for `state` into `params`. `s` (place and
 *  seed) is written by the caller. */
export function writePosterParams(params: URLSearchParams, state: PosterState) {
  const showLocks = !hasDefaultLocks(state)
  if (showLocks) params.set('l', encodeCards(state.locks))
  else params.delete('l')
  if (state.held.length) params.set('h', encodeCards(state.held))
  else params.delete('h')
  if ((showLocks || state.held.length) && state.cols !== POSTER_GRID_W) {
    params.set('g', String(state.cols))
  } else {
    params.delete('g')
  }
}

/**
 * Reads the poster state from URL params. `seed` comes from the `s` token;
 * `cols` is the current column count, used when the URL has default locks.
 */
export function readPosterParams(params: URLSearchParams, seed: number, cols: number): PosterState {
  const rawLocks = params.get('l')
  if (rawLocks === null && !params.get('h')) return initialPosterState(seed, cols)
  const g = Number(params.get('g') ?? POSTER_GRID_W)
  const gridCols = VALID_COLS.has(g) ? g : POSTER_GRID_W
  const locks = rawLocks === null ? defaultLocks(seed, gridCols) : decodeCards(rawLocks, gridCols)
  const held = decodeCards(params.get('h') ?? '', gridCols).filter(
    (h) => !locks.some((l) => l.slotId === h.slotId),
  )
  return { seed, cols: gridCols, locks, held }
}
