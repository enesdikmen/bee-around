import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { resolveSpeciesImage, type ImageSource } from '../../api/speciesImage'
import type {
  ConservationSnapshot,
  SpeciesCard,
  ThematicStripCard,
} from '../../types/lens'

export type UseLensImageOverlayArgs = {
  topSpeciesData: SpeciesCard[]
  inSeasonSpecies: SpeciesCard[]
  smallWondersSpecies: SpeciesCard[]
  brandNewSpecies: SpeciesCard[]
  nightCreaturesSpecies: SpeciesCard[]
  thematicStripCards: ThematicStripCard[]
  conservationSnapshot: ConservationSnapshot
  imageSources: ImageSource[]
}

export type UseLensImageOverlayResult = {
  topSpeciesData: SpeciesCard[]
  inSeasonSpecies: SpeciesCard[]
  smallWondersSpecies: SpeciesCard[]
  brandNewSpecies: SpeciesCard[]
  nightCreaturesSpecies: SpeciesCard[]
  thematicStripCards: ThematicStripCard[]
  conservationSnapshot: ConservationSnapshot
}

export const useLensImageOverlay = (
  args: UseLensImageOverlayArgs,
): UseLensImageOverlayResult => {
  const {
    topSpeciesData,
    inSeasonSpecies,
    smallWondersSpecies,
    brandNewSpecies,
    nightCreaturesSpecies,
    thematicStripCards,
    conservationSnapshot,
    imageSources,
  } = args

  const speciesForImaging = useMemo(() => {
    const map = new Map<number, { speciesKey: number; canonicalName?: string }>()
    const collect = (cards: SpeciesCard[] | undefined) => {
      cards?.forEach((c) => {
        const key = Number(c.id)
        if (!Number.isFinite(key) || map.has(key)) return
        if (c.imageUrl) return
        map.set(key, { speciesKey: key, canonicalName: c.canonicalName })
      })
    }
    collect(topSpeciesData)
    collect(inSeasonSpecies)
    collect(smallWondersSpecies)
    collect(brandNewSpecies)
    collect(nightCreaturesSpecies)
    collect(conservationSnapshot.threatenedSpecies)
    return Array.from(map.values()).sort((a, b) => a.speciesKey - b.speciesKey)
  }, [
    topSpeciesData,
    inSeasonSpecies,
    smallWondersSpecies,
    brandNewSpecies,
    nightCreaturesSpecies,
    conservationSnapshot.threatenedSpecies,
  ])

  const imageMapQuery = useQuery({
    queryKey: [
      'speciesImages',
      speciesForImaging.map((s) => s.speciesKey).join(','),
      imageSources.join(','),
    ],
    queryFn: async () => {
      const map = new Map<number, { url: string; squareUrl?: string }>()
      if (imageSources.length === 0) return map
      await Promise.all(
        speciesForImaging.map(async ({ speciesKey, canonicalName }) => {
          const img = await resolveSpeciesImage({
            speciesKey,
            scientificName: canonicalName,
            sources: imageSources,
          })
          if (img?.url) map.set(speciesKey, { url: img.url, squareUrl: img.squareUrl })
        }),
      )
      return map
    },
    enabled: speciesForImaging.length > 0,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
  })

  const imageMap = imageMapQuery.data

  const applyImage = useMemo(() => {
    return <T extends SpeciesCard>(card: T): T => {
      const img = imageMap?.get(Number(card.id))
      if (!img) return card
      return { ...card, imageUrl: img.url, squareImageUrl: img.squareUrl }
    }
  }, [imageMap])

  const imagedTopSpecies = useMemo(
    () => topSpeciesData.map(applyImage),
    [topSpeciesData, applyImage],
  )
  const imagedInSeason = useMemo(
    () => inSeasonSpecies.map(applyImage),
    [inSeasonSpecies, applyImage],
  )
  const imagedSmallWonders = useMemo(
    () => smallWondersSpecies.map(applyImage),
    [smallWondersSpecies, applyImage],
  )
  const imagedBrandNew = useMemo(
    () => brandNewSpecies.map(applyImage),
    [brandNewSpecies, applyImage],
  )
  const imagedNightCreatures = useMemo(
    () => nightCreaturesSpecies.map(applyImage),
    [nightCreaturesSpecies, applyImage],
  )
  const imagedThematicStripCards = useMemo(
    () =>
      thematicStripCards.map((c) => ({
        ...c,
        species: c.species.map(applyImage),
      })),
    [thematicStripCards, applyImage],
  )
  const imagedConservationSnapshot = useMemo(
    () => ({
      ...conservationSnapshot,
      threatenedSpecies: conservationSnapshot.threatenedSpecies.map(applyImage),
    }),
    [conservationSnapshot, applyImage],
  )

  return {
    topSpeciesData: imagedTopSpecies,
    inSeasonSpecies: imagedInSeason,
    smallWondersSpecies: imagedSmallWonders,
    brandNewSpecies: imagedBrandNew,
    nightCreaturesSpecies: imagedNightCreatures,
    thematicStripCards: imagedThematicStripCards,
    conservationSnapshot: imagedConservationSnapshot,
  }
}
