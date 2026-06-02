/**
 * Cross-lens species deduplication.
 *
 * Each lens (top species, conservation, thematic) fetches its own
 * candidate pool independently. Without coordination, the same species
 * can appear as the hero, as an at-risk pick, and inside a thematic
 * strip.
 *
 * This pass runs once over the assembled `LensData` and enforces a single
 * fixed priority order — earlier slots win, later slots fall through to
 * their next candidate. Every lens exposes a *list* of candidates so a
 * fall-through is just an array filter (no extra network calls).
 *
 * Priority (most prominent → least):
 *   1. `topSpeciesData`        — hero tile + mini gallery (claims all)
 *   2. `threatenedSpecies`     — at-risk card (claims the survivor it renders)
 *   3. `thematicStripCards[*]` — themed strips, processed in array order;
 *                                first 2 non-empty survivors are the primary
 *                                tiles and the next 2 are kept as backup
 *                                candidates for post-lock 1x1 hole-filling.
 *   4. `signatureSpeciesData`  — pool for the signature-species card.
 *                                Filtered against everything above so the
 *                                random pick never duplicates a species
 *                                already shown elsewhere on the poster.
 *
 * Adding a new lens: insert it into the chain at the right priority and
 * make sure the hook returns multiple candidates so dedup can fall
 * through.
 */
import type { LensData } from './types'

const MAX_THEMATIC_PRIMARY_STRIPS = 2
const MAX_THEMATIC_CANDIDATES = 4

export const dedupeSpeciesAcrossLenses = (data: LensData): LensData => {
  const claimed = new Set<string>()

  // 1. Top species (hero + minis): claim everything in the gallery.
  for (const sp of data.topSpeciesData) claimed.add(sp.id)

  // 2. At-risk: filter the threatened list, claim all survivors so no
  //    downstream card duplicates them (2 are rendered, but the pool is
  //    small so claiming all is safe).
  const threatenedSpecies = data.conservationSnapshot.threatenedSpecies
    .filter((sp) => !claimed.has(sp.id))
  for (const sp of threatenedSpecies) claimed.add(sp.id)

  // 3. Thematic strips: keep up to 2 primary tiles plus 2 backup
  //    candidates. Backup candidates are filtered against higher-priority
  //    claims and earlier thematics so they stay unique, but they do not
  //    claim against signature species until the poster actually uses them.
  const thematicStripCards: LensData['thematicStripCards'] = []
  const thematicClaimed = new Set(claimed)
  let primaryThematicCount = 0
  for (const card of data.thematicStripCards) {
    const species = card.species.filter((sp) => !thematicClaimed.has(sp.id))
    if (species.length === 0) continue
    thematicStripCards.push({ ...card, species })
    thematicClaimed.add(species[0].id)
    if (primaryThematicCount < MAX_THEMATIC_PRIMARY_STRIPS) {
      claimed.add(species[0].id)
      primaryThematicCount += 1
    }
    if (thematicStripCards.length >= MAX_THEMATIC_CANDIDATES) break
  }

  // 4. Signature species: pass through the survivors so the card can pick
  //    one at random from a clean pool. We don't claim here — there's no
  //    lower-priority lens that would conflict.
  const signatureSpeciesData = data.signatureSpeciesData.filter(
    (sp) => !claimed.has(sp.id),
  )

  return {
    ...data,
    conservationSnapshot: {
      ...data.conservationSnapshot,
      threatenedSpecies,
    },
    thematicStripCards,
    signatureSpeciesData,
  }
}
