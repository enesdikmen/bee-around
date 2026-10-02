/**
 * Builds the poster from its state: which cards are shown, from which seed,
 * and where. Pure, so a URL always reproduces the same poster.
 *
 * 1. Fixed cards (locked, then held) go first and are never dropped. They are
 *    rebuilt from the seed they were captured at; live cards (sources,
 *    sightings) always show current content in their fixed place.
 * 2. Fresh cards for the current seed fill the remaining area in registry
 *    order, skipping slots and species that are already shown.
 * 3. Backup cards fill any gap, then invisible fillers, so the poster always
 *    has exactly POSTER_GRID_AREA cells.
 * 4. Packing honours every fixed position it can and never fails: if the
 *    fresh cards cannot fit around the fixed ones, the largest is swapped for
 *    fillers until they do.
 */
import { pack, packWithRetries, type BoxSpec, type Placement } from './gridPacker'
import { POSTER_GRID_AREA, posterRows } from './posterGrid'
import { mapPosition, type FixedCard, type PosterState } from './posterState'
import type { Tile } from '../pages/bentoTiles'

/** Cards whose content stays live when locked; only their position is fixed.
 *  Both show place-level data: the sources QR follows the current URL, and
 *  the sightings card's red-list numbers arrive after the poster is shown. */
export const LIVE_SLOT_IDS = new Set(['sources', 'sightings'])

/** The cards one seed's poster offers: the main set, then gap-filling backups
 *  in priority order. */
export type SeedTiles = { main: Tile[]; backups: Tile[] }

export type PosterCard = Tile & {
  /** Seed the card's content came from; recorded when the card is locked. */
  sourceSeed: number
  fixed?: 'locked' | 'held'
}

export type PosterLayout = {
  cards: PosterCard[]
  placements: Placement[]
}

const area = (t: { w: number; h: number }) => t.w * t.h

const filler = (i: number): PosterCard => ({
  id: `filler-${i}`,
  w: 1,
  h: 1,
  className: 'bento-card bento-card--filler',
  render: () => null,
  sourceSeed: 0,
})

export function assemblePosterCards(
  state: PosterState,
  cols: number,
  tilesFor: (seed: number) => SeedTiles,
): PosterCard[] {
  const rows = posterRows(cols)
  const current = tilesFor(state.seed)
  const cards: PosterCard[] = []
  const usedIds = new Set<string>()
  const usedSlots = new Set<string>()
  const usedSpecies = new Set<string>()
  const occupied = new Set<string>()
  let usedArea = 0

  const conflicts = (t: Tile) =>
    usedIds.has(t.id) ||
    (!!t.slotId && usedSlots.has(t.slotId)) ||
    !!t.speciesIds?.some((id) => usedSpecies.has(id))

  const add = (card: PosterCard) => {
    cards.push(card)
    usedIds.add(card.id)
    if (card.slotId) usedSlots.add(card.slotId)
    card.speciesIds?.forEach((id) => usedSpecies.add(id))
    usedArea += area(card)
  }

  const findSlot = (tiles: SeedTiles, slotId: string) =>
    tiles.main.find((t) => t.slotId === slotId) ??
    tiles.backups.find((t) => t.slotId === slotId)

  // A fixed position is kept when it is inside the grid and free.
  const claimCells = (x: number, y: number, w: number, h: number) => {
    if (x < 0 || y < 0 || x + w > cols || y + h > rows) return false
    const cells: string[] = []
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) cells.push(`${x + dx},${y + dy}`)
    }
    if (cells.some((c) => occupied.has(c))) return false
    cells.forEach((c) => occupied.add(c))
    return true
  }

  const fixed: Array<[FixedCard, 'locked' | 'held']> = [
    ...state.locks.map((c): [FixedCard, 'locked'] => [c, 'locked']),
    ...state.held.map((c): [FixedCard, 'held'] => [c, 'held']),
  ]
  for (const [entry, kind] of fixed) {
    const live = LIVE_SLOT_IDS.has(entry.slotId)
    const tile = findSlot(live ? current : tilesFor(entry.seed), entry.slotId)
    // The data no longer offers this card (e.g. GBIF changed); skip it.
    if (!tile || conflicts(tile) || usedArea + area(tile) > POSTER_GRID_AREA) continue
    const pos = mapPosition(entry, tile, state.cols, cols)
    const pinned = claimCells(pos.x, pos.y, tile.w, tile.h)
    add({
      ...tile,
      pinXY: pinned ? pos : undefined,
      sourceSeed: live ? state.seed : entry.seed,
      fixed: kind,
    })
  }

  for (const tile of [...current.main, ...current.backups]) {
    if (usedArea >= POSTER_GRID_AREA) break
    if (conflicts(tile) || usedArea + area(tile) > POSTER_GRID_AREA) continue
    add({ ...tile, sourceSeed: state.seed })
  }

  let i = 0
  while (usedArea < POSTER_GRID_AREA) add(filler(i++))

  // The packer's choices depend on card order, so keep a stable one: the
  // current seed's registry order (fixed cards take their slot's place),
  // then fixed cards it does not offer, backups and fillers.
  const mainIndex = new Map(current.main.map((t, index) => [t.slotId ?? t.id, index]))
  const rank = (card: PosterCard, index: number) =>
    mainIndex.get(card.slotId ?? card.id) ??
    (card.fixed ? 1000 : card.id.startsWith('filler-') ? 3000 : 2000) + index
  return cards
    .map((card, index) => ({ card, key: rank(card, index) }))
    .sort((a, b) => a.key - b.key)
    .map(({ card }) => card)
}

const specFor = (card: PosterCard, cols: number, rows: number): BoxSpec => {
  const box = { id: card.id, w: card.w, h: card.h }
  if (card.pinXY) return { ...box, constraint: { pin: card.pinXY } }
  if (card.pin) {
    const x = card.pin.endsWith('right') ? cols - card.w : 0
    const y = card.pin.startsWith('bottom') ? rows - card.h : 0
    return { ...box, constraint: { pin: { x, y } } }
  }
  if (card.anchor) return { ...box, constraint: { anchor: card.anchor } }
  return box
}

/** Packs the cards into a `cols`-wide grid. Always returns a full layout. */
export function layoutPoster(cards: PosterCard[], cols: number, seed: number): PosterLayout {
  const rows = posterRows(cols)
  let current = cards
  let fillerIndex = cards.filter((c) => c.id.startsWith('filler-')).length
  for (;;) {
    const result = packWithRetries(
      { width: cols, height: rows, boxes: current.map((c) => specFor(c, cols, rows)), seed: seed * 7919 },
      60,
    )
    if (result) return { cards: current, placements: result.placements }
    // Swap the largest unfixed card for fillers and try again. 1 × 1 cards
    // always fit around valid pins, so this ends.
    const victim = current
      .filter((c) => !c.pinXY && area(c) > 1)
      .sort((a, b) => area(b) - area(a))[0]
    if (!victim) break
    const replacements = Array.from({ length: area(victim) }, () => filler(fillerIndex++))
    current = [...current.filter((c) => c !== victim), ...replacements]
  }
  // Unreachable with valid pins; as a last resort ignore pins entirely.
  const free = current.map((c) => ({ ...c, pinXY: undefined, pin: undefined }))
  const result = pack({ width: cols, height: rows, boxes: free.map((c) => specFor(c, cols, rows)), seed })
  return { cards: free, placements: result?.placements ?? [] }
}
