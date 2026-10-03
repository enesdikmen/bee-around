import assert from 'node:assert/strict'
import { test } from 'node:test'
import { moduleLoader } from './helpers.mjs'

const state = await (await moduleLoader('src/lib/posterState.ts'))()
const layout = await (await moduleLoader('src/lib/posterLayout.ts'))()

const tile = (id, w = 1, h = 1, extra = {}) => ({
  id,
  slotId: id,
  w,
  h,
  className: '',
  render: () => null,
  ...extra,
})

// A full 24-cell poster for one seed: title, sightings, hero, 7 minis,
// 2 themes, seasonality, 2 at-risk, signature, sources.
const posterFor = (seed) => ({
  main: [
    tile('title', 2, 1),
    tile('sightings', 1, 2),
    tile('hero', 2, 2, { speciesIds: [`hero-${seed}`] }),
    ...Array.from({ length: 7 }, (_, i) => tile(`mini-${i}`, 1, 1, { id: `sp-${seed}-${i}`, speciesIds: [`m${i}-${seed}`] })),
    tile(seed % 2 ? 'thematic-nightCreatures' : 'thematic-inSeason', 1, 1, { speciesIds: [`night-${seed}`] }),
    tile('thematic-smallWonders', 1, 1, { speciesIds: [`small-${seed}`] }),
    tile('seasonality', 2, 1),
    tile('at-risk-0', 1, 1, { speciesIds: [`risk0-${seed}`] }),
    tile('at-risk-1', 1, 1, { speciesIds: [`risk1-${seed}`] }),
    tile('signature-species', 1, 1, { speciesIds: [`sig-${seed}`] }),
    tile('sources', 2, 1, { id: `sources@${seed}` }),
  ],
  backups: [tile(`species-backup-${seed}`, 1, 1, { speciesIds: [`backup-${seed}`] })],
})

const areaOf = (cards) => cards.reduce((sum, c) => sum + c.w * c.h, 0)

const assertFullLayout = (result, cols) => {
  const rows = 24 / cols
  const cells = new Set()
  for (const p of result.placements) {
    for (let dx = 0; dx < p.w; dx++) {
      for (let dy = 0; dy < p.h; dy++) {
        assert.ok(p.x + dx < cols && p.y + dy < rows, `${p.id} inside the grid`)
        const key = `${p.x + dx},${p.y + dy}`
        assert.ok(!cells.has(key), `${p.id} overlaps`)
        cells.add(key)
      }
    }
  }
  assert.equal(cells.size, 24)
  assert.equal(result.placements.length, result.cards.length)
}

test('default locks put sources in the bottom-right corner at every width', () => {
  assert.deepEqual(state.initialPosterState(1, 6).locks.map((l) => [l.slotId, l.x, l.y]), [['title', 0, 0], ['sources', 4, 3]])
  assert.deepEqual(state.initialPosterState(1, 2).locks.map((l) => [l.slotId, l.x, l.y]), [['title', 0, 0], ['sources', 0, 11]])
})

test('URLs leave out default locks and round-trip custom ones', () => {
  const params = new URLSearchParams('s=x&lang=en')
  state.writePosterParams(params, state.initialPosterState(4, 6))
  assert.equal(params.toString(), 's=x&lang=en')
  assert.deepEqual(state.readPosterParams(params, 4, 2), state.initialPosterState(4, 2))

  const custom = {
    seed: 7,
    cols: 3,
    locks: [{ slotId: 'title', seed: 1, x: 0, y: 0 }, { slotId: 'mini-2', seed: 5, x: 2, y: 7 }],
    held: [{ slotId: 'hero', seed: 6, x: 0, y: 1 }],
  }
  state.writePosterParams(params, custom)
  assert.equal(params.get('l'), 'title_0_0_1,mini-2_2_7_5')
  assert.equal(params.get('h'), 'hero_0_1_6')
  assert.equal(params.get('g'), '3')
  assert.deepEqual(state.readPosterParams(new URLSearchParams(params.toString()), 7, 6), custom)

  const none = new URLSearchParams('l=')
  assert.deepEqual(state.readPosterParams(none, 2, 6).locks, [])
  const junk = new URLSearchParams('l=title_0_0_1,bad,hero_9_9_1,mini-0_1_1_0,title_1_1_2')
  assert.deepEqual(state.readPosterParams(junk, 2, 6).locks, [{ slotId: 'title', seed: 1, x: 0, y: 0 }])
})

test('regenerate clears held cards; unlock holds the card until then', () => {
  let s = state.initialPosterState(1, 6)
  s = state.posterReducer(s, { type: 'unlock', slotId: 'title', cols: 6, shown: new Map() })
  assert.deepEqual(s.locks.map((l) => l.slotId), ['sources'])
  assert.deepEqual(s.held, [{ slotId: 'title', seed: 1, x: 0, y: 0 }])
  s = state.posterReducer(s, { type: 'regenerate' })
  assert.equal(s.seed, 2)
  assert.deepEqual(s.held, [])
})

test('locking records the seed the card came from, not the current seed', () => {
  const s = state.posterReducer(
    { ...state.initialPosterState(1, 6), seed: 3, held: [{ slotId: 'hero', seed: 1, x: 0, y: 2 }] },
    { type: 'lock', card: { slotId: 'hero', seed: 1, x: 0, y: 2 }, cols: 6, shown: new Map() },
  )
  assert.deepEqual(s.locks.find((l) => l.slotId === 'hero'), { slotId: 'hero', seed: 1, x: 0, y: 2 })
  assert.deepEqual(s.held, [])
})

test('acting at a new width re-records positions where the cards are shown', () => {
  const shown = new Map([['title', { x: 0, y: 0 }], ['sources', { x: 0, y: 11 }], ['mini-0', { x: 1, y: 4 }]])
  const s = state.posterReducer(state.initialPosterState(1, 6), {
    type: 'lock', card: { slotId: 'mini-0', seed: 1, x: 1, y: 4 }, cols: 2, shown,
  })
  assert.equal(s.cols, 2)
  assert.deepEqual(s.locks.map((l) => [l.slotId, l.x, l.y]), [['title', 0, 0], ['sources', 0, 11], ['mini-0', 1, 4]])
})

test('positions map to other widths by their nearest corner', () => {
  assert.deepEqual(state.mapPosition({ slotId: 'sources', x: 4, y: 3 }, { w: 2, h: 1 }, 6, 2), { x: 0, y: 11 })
  assert.deepEqual(state.mapPosition({ slotId: 'hero', x: 0, y: 2 }, { w: 2, h: 2 }, 6, 2), { x: 0, y: 10 })
  assert.deepEqual(state.mapPosition({ slotId: 'mini-1', x: 5, y: 0 }, { w: 1, h: 1 }, 6, 3), { x: 2, y: 0 })
  // Full-width cards on a phone: title stays left, sources goes back right.
  assert.deepEqual(state.mapPosition({ slotId: 'title', x: 0, y: 0 }, { w: 2, h: 1 }, 2, 6), { x: 0, y: 0 })
  assert.deepEqual(state.mapPosition({ slotId: 'sources', x: 0, y: 11 }, { w: 2, h: 1 }, 2, 6), { x: 4, y: 3 })
})

test('a locked card is always shown, even when its slot is not in the new poster', () => {
  const s = {
    ...state.initialPosterState(1, 6),
    seed: 2,
    locks: [...state.defaultLocks(1, 6), { slotId: 'thematic-nightCreatures', seed: 1, x: 2, y: 3 }],
  }
  const cards = layout.assemblePosterCards(s, 6, posterFor)
  const night = cards.find((c) => c.slotId === 'thematic-nightCreatures')
  assert.ok(night, 'the locked night creature is kept')
  assert.equal(night.sourceSeed, 1)
  assert.deepEqual(night.pinXY, { x: 2, y: 3 })
  assert.equal(areaOf(cards), 24)
  assertFullLayout(layout.layoutPoster(cards, 6, 2), 6)
})

test('live cards keep their place but show current content; locked species are not repeated', () => {
  const s = {
    ...state.initialPosterState(1, 6),
    seed: 3,
    locks: [...state.defaultLocks(1, 6), { slotId: 'mini-0', seed: 1, x: 3, y: 0 }],
  }
  const cards = layout.assemblePosterCards(s, 6, (seed) => {
    const p = posterFor(seed)
    // The current poster shows the locked mini's species in another slot.
    if (seed === 3) p.main[5] = tile('mini-2', 1, 1, { id: 'dup', speciesIds: ['m0-1'] })
    return p
  })
  const sources = cards.find((c) => c.slotId === 'sources')
  assert.equal(sources.id, 'sources@3')
  assert.deepEqual(sources.pinXY, { x: 4, y: 3 })
  assert.equal(cards.filter((c) => c.speciesIds?.includes('m0-1')).length, 1)
  assert.equal(areaOf(cards), 24)
})

test('a locked backup card is restored from its seed', () => {
  const s = { ...state.initialPosterState(1, 6), seed: 2, locks: [{ slotId: 'species-backup-1', seed: 1, x: 5, y: 0 }] }
  const cards = layout.assemblePosterCards(s, 6, posterFor)
  assert.ok(cards.some((c) => c.slotId === 'species-backup-1' && c.fixed === 'locked'))
})

test('desktop locks opened on a phone still give a full poster', () => {
  const s = {
    seed: 3,
    cols: 6,
    locks: [
      ...state.defaultLocks(1, 6),
      { slotId: 'hero', seed: 1, x: 0, y: 2 },
      { slotId: 'thematic-nightCreatures', seed: 1, x: 2, y: 3 },
      { slotId: 'mini-0', seed: 2, x: 0, y: 1 },
      { slotId: 'at-risk-1', seed: 2, x: 3, y: 0 },
    ],
    held: [],
  }
  for (const cols of [2, 3, 6]) {
    const cards = layout.assemblePosterCards(s, cols, posterFor)
    for (const slotId of ['title', 'sources', 'hero', 'thematic-nightCreatures', 'mini-0', 'at-risk-1']) {
      assert.ok(cards.some((c) => c.slotId === slotId), `${slotId} kept at ${cols} columns`)
    }
    assertFullLayout(layout.layoutPoster(cards, cols, 3), cols)
  }
  const phone = layout.assemblePosterCards(s, 2, posterFor)
  assert.deepEqual(phone.find((c) => c.slotId === 'sources').pinXY, { x: 0, y: 11 })
})

test('fresh cards that cannot fit around fixed cards become fillers instead of breaking the poster', () => {
  // Pins on a checkerboard leave no room for any 2-cell card.
  const locks = []
  for (let y = 0; y < 4; y++) {
    for (let x = (y % 2); x < 6; x += 2) locks.push({ slotId: `mini-${locks.length}`, seed: 1, x, y })
  }
  const many = (seed) => ({
    main: [tile('hero', 2, 2), tile('seasonality', 2, 1), ...Array.from({ length: 12 }, (_, i) => tile(`mini-${i}`, 1, 1, { id: `m${seed}-${i}`, speciesIds: [`s${seed}-${i}`] }))],
    backups: [],
  })
  const s = { seed: 2, cols: 6, locks, held: [] }
  const result = layout.layoutPoster(layout.assemblePosterCards(s, 6, many), 6, 2)
  assertFullLayout(result, 6)
  assert.equal(result.cards.filter((c) => c.pinXY).length, 12)
  assert.ok(!result.cards.some((c) => c.slotId === 'hero' || c.slotId === 'seasonality'), 'unfittable cards were swapped out')
})

test('on a phone the wide cards are spread out, unless a lock is in the way', () => {
  const rowOf = (result, slotId) => {
    const card = result.cards.find((c) => c.slotId === slotId)
    return result.placements.find((p) => p.id === card.id).y
  }
  const phone = layout.layoutPoster(layout.assemblePosterCards(state.initialPosterState(1, 2), 2, posterFor), 2, 1)
  assertFullLayout(phone, 2)
  assert.deepEqual(
    ['title', 'hero', 'sightings', 'seasonality', 'sources'].map((slotId) => rowOf(phone, slotId)),
    [0, 1, 3, 7, 11],
  )

  const locked = {
    ...state.initialPosterState(1, 2),
    locks: [...state.defaultLocks(1, 2), { slotId: 'mini-0', seed: 1, x: 1, y: 2 }],
  }
  const blocked = layout.layoutPoster(layout.assemblePosterCards(locked, 2, posterFor), 2, 1)
  assertFullLayout(blocked, 2)
  assert.equal(rowOf(blocked, 'mini-0'), 2)
  assert.notEqual(rowOf(blocked, 'hero'), 1)

  const desktop = layout.assemblePosterCards(state.initialPosterState(1, 6), 6, posterFor)
  assert.ok(!desktop.some((c) => !c.fixed && c.pinXY), 'wider grids pack freely')
})

test('without user locks the card order matches the registry, so layouts are stable', () => {
  const cards = layout.assemblePosterCards(state.initialPosterState(1, 6), 6, posterFor)
  assert.deepEqual(cards.map((c) => c.slotId), posterFor(1).main.map((t) => t.slotId))
  const a = layout.layoutPoster(cards, 6, 1)
  const b = layout.layoutPoster(cards, 6, 1)
  assert.deepEqual(a.placements, b.placements)
})
