/**
 * Live signature species — computes per-place over-representation vs the
 * cached global baseline. Lets the comparison + signature-species cards
 * work for *any* user-selected place, not only the precomputed ones.
 *
 * Inputs:
 *   - one bbox-scoped `fetchOccurrenceFacets` call with `facet=speciesKey`,
 *     `facetLimit=500`. (One extra GBIF call per place.)
 *   - static `global_baseline.json` produced by the precompute notebook
 *     (totalRecords + top 500 global species counts).
 *
 * Output: up to `TOP_N` species ranked by `localShare / globalShare`,
 * each enriched with species metadata (vernacular, scientific, taxon
 * line) via `fetchSpecies`, so they can flow through the shared image-
 * overlay pipeline and render as proper species cards.
 *
 * Caveats:
 *   - We only score species that appear in the top-500 global baseline.
 *     Truly endemic / regional species rarely make that cut, so what
 *     surfaces here is "common-ish species disproportionately observed
 *     here", not strict endemism.
 *   - We require a minimum local total (`MIN_LOCAL_TOTAL`) so tiny,
 *     undersampled bboxes don't produce spurious 100× ratios driven
 *     purely by a single observer's dataset.
 */
import { useQuery } from '@tanstack/react-query'
import { fetchOccurrenceFacets, fetchSpecies } from '../../api/gbif'
import type { Place, SpeciesCard } from '../../types/lens'
import { placeGeoParams } from './shared'
import globalBaselineRaw from '../../global_baseline.json'

type GlobalBaseline = {
  totalRecords: number
  topSpeciesGlobal: { speciesKey: number; count: number }[]
}

const baseline = globalBaselineRaw as GlobalBaseline
const GLOBAL_TOTAL = baseline.totalRecords
const GLOBAL_BY_KEY: Map<number, number> = new Map(
  baseline.topSpeciesGlobal.map((s) => [Number(s.speciesKey), Number(s.count)]),
)

/** Minimum local count of a species for it to be eligible as signature.
 *  Aligned with the precompute notebook so render-time filters never
 *  diverge from what generated the data. */
const MIN_LOCAL_COUNT = 20
/** Minimum total records in the selected place for any ratio to be
 *  trusted. Below this the share denominator is too small and ratios
 *  blow up for trivial reasons. */
const MIN_LOCAL_TOTAL = 2000
const MIN_RATIO = 1.5
/** How many candidates to keep. Dedupe across lenses may drop some, and
 *  the card picks one at random from the survivors, so we keep a small
 *  pool rather than just the top-1. */
const TOP_N = 5
const FACET_LIMIT = 500

export type SignatureSpeciesCard = SpeciesCard & {
  /** localShare / globalShare. >1 means over-represented vs the world. */
  overRepresentationRatio: number
  localCount: number
  globalCount: number
}

export const useLiveSignatureSpecies = (
  selectedPlace?: Place,
): SignatureSpeciesCard[] => {
  const query = useQuery({
    queryKey: ['liveSignatureSpecies', selectedPlace?.id],
    queryFn: async ({ signal }): Promise<SignatureSpeciesCard[]> => {
      if (!selectedPlace || GLOBAL_TOTAL <= 0) return []

      const facetResp = await fetchOccurrenceFacets({
        ...placeGeoParams(selectedPlace),
        facetFields: ['speciesKey'],
        facetLimit: FACET_LIMIT,
        signal,
      })

      const localTotal = facetResp.count ?? 0
      if (localTotal < MIN_LOCAL_TOTAL) return []
      const counts = facetResp.facets?.[0]?.counts ?? []
      if (counts.length === 0) return []

      type Scored = {
        speciesKey: number
        localCount: number
        globalCount: number
        ratio: number
      }
      const scored: Scored[] = []
      for (const row of counts) {
        const speciesKey = Number(row.name)
        if (!Number.isFinite(speciesKey)) continue
        const localCount = Number(row.count)
        if (!Number.isFinite(localCount) || localCount < MIN_LOCAL_COUNT) continue
        const globalCount = GLOBAL_BY_KEY.get(speciesKey)
        if (!globalCount || globalCount <= 0) continue

        const localShare = localCount / localTotal
        const globalShare = globalCount / GLOBAL_TOTAL
        if (globalShare <= 0) continue
        const ratio = localShare / globalShare
        if (!Number.isFinite(ratio) || ratio < MIN_RATIO) continue

        scored.push({ speciesKey, localCount, globalCount, ratio })
      }

      scored.sort((a, b) => b.ratio - a.ratio)
      const top = scored.slice(0, TOP_N)
      if (top.length === 0) return []

      // Resolve full species metadata in parallel so the species card has
      // a vernacular, scientific name, and taxon line to render.
      const cards = await Promise.all(
        top.map(async (entry): Promise<SignatureSpeciesCard> => {
          try {
            const species = await fetchSpecies({
              speciesKey: entry.speciesKey,
              signal,
            })
            const taxonLine = [species.kingdom, species.phylum, species.class]
              .filter(Boolean)
              .join(' · ')
            return {
              id: String(entry.speciesKey),
              commonName:
                species.vernacularName ??
                species.canonicalName ??
                species.scientificName,
              scientificName: species.scientificName,
              canonicalName: species.canonicalName ?? species.scientificName,
              imageUrl: '',
              highlight: 'Signature species',
              taxonLine: taxonLine || undefined,
              popularity: entry.localCount,
              overRepresentationRatio: entry.ratio,
              localCount: entry.localCount,
              globalCount: entry.globalCount,
            }
          } catch {
            return {
              id: String(entry.speciesKey),
              commonName: `Species ${entry.speciesKey}`,
              scientificName: `Species ${entry.speciesKey}`,
              imageUrl: '',
              highlight: 'Signature species',
              popularity: entry.localCount,
              overRepresentationRatio: entry.ratio,
              localCount: entry.localCount,
              globalCount: entry.globalCount,
            }
          }
        }),
      )
      return cards
    },
    enabled: Boolean(selectedPlace),
    // Global baseline is static; place facet is moderately expensive.
    staleTime: 1000 * 60 * 30,
  })

  return query.data ?? []
}
