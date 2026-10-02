import { useSyncExternalStore } from 'react'
import { POSTER_GRID_W } from '../lib/posterGrid'

/**
 * Poster columns for the current viewport.
 *
 * The packer accepts any grid width and no tile is wider than 2 cells, so the
 * same tile set re-packs at 2 or 3 columns without becoming unplaceable. Total
 * area is fixed at POSTER_GRID_AREA, so rows are simply area / columns and stay
 * whole at 6, 3 and 2.
 *
 * Narrower is not automatically better: the old mobile layout rendered 6
 * columns across a fixed 820px canvas, so each card was already ~137px wide and
 * the visitor panned sideways to read it. Three columns on a 393px phone would
 * be ~116px — smaller than before. Two columns is ~178px, which is the point of
 * the exercise.
 */
const COLUMN_BREAKPOINTS = [
  { query: '(max-width: 520px)', columns: 2 },
  { query: '(max-width: 720px)', columns: 3 },
] as const

const readColumns = (): number => {
  if (typeof window === 'undefined' || !window.matchMedia) return POSTER_GRID_W
  for (const breakpoint of COLUMN_BREAKPOINTS) {
    if (window.matchMedia(breakpoint.query).matches) return breakpoint.columns
  }
  return POSTER_GRID_W
}

const subscribe = (onChange: () => void) => {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const lists = COLUMN_BREAKPOINTS.map((b) => window.matchMedia(b.query))
  lists.forEach((list) => list.addEventListener('change', onChange))
  return () => {
    lists.forEach((list) => list.removeEventListener('change', onChange))
  }
}

const readServerColumns = () => POSTER_GRID_W

/** `forceWide` pins the poster to the canonical width, used while printing. */
export function usePosterColumns(forceWide: boolean): number {
  const columns = useSyncExternalStore(subscribe, readColumns, readServerColumns)
  return forceWide ? POSTER_GRID_W : columns
}
