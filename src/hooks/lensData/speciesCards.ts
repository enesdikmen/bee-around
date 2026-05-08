import { fetchSpecies } from '../../api/gbif'
import type { SpeciesCard } from '../../types/lens'

export type SpeciesPick = {
  speciesKey: number
  count: number
  highlight: string
}

export const resolveSpeciesCards = async (
  picks: SpeciesPick[],
  signal: AbortSignal | undefined,
): Promise<SpeciesCard[]> => {
  return Promise.all(
    picks.map(async (item) => {
      const species = await fetchSpecies({ speciesKey: item.speciesKey, signal })
      return {
        id: String(item.speciesKey),
        commonName:
          species.vernacularName ??
          species.canonicalName ??
          species.scientificName,
        scientificName: species.scientificName,
        canonicalName: species.canonicalName ?? species.scientificName,
        imageUrl: '',
        highlight: item.highlight,
        taxonLine: [species.kingdom, species.phylum, species.class]
          .filter(Boolean)
          .join(' · '),
        popularity: item.count,
      }
    }),
  )
}