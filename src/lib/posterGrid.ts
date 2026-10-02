/** Fixed poster size. The canonical layout is 6 × 4; narrow screens re-pack
 *  the same 24 cells into 3 or 2 columns. */
export const POSTER_GRID_W = 6
export const POSTER_GRID_H = 4
export const POSTER_GRID_AREA = POSTER_GRID_W * POSTER_GRID_H

/** Rows of the poster at a given column count (24 cells in total). */
export const posterRows = (cols: number) => POSTER_GRID_AREA / cols
