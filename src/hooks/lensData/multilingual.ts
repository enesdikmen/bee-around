type VernacularEntry = {
  language?: string
  vernacularName?: string
}

type VernacularsBySpecies = Record<number, VernacularEntry[]>

const FEATURED_LANGS: { code: string; label: string }[] = [
  { code: 'eng', label: 'EN' },
  { code: 'deu', label: 'DE' },
  { code: 'fra', label: 'FR' },
  { code: 'spa', label: 'ES' },
  { code: 'ita', label: 'IT' },
  { code: 'pol', label: 'PL' },
  { code: 'rus', label: 'RU' },
  { code: 'jpn', label: 'JA' },
  { code: 'zho', label: 'ZH' },
  { code: 'nld', label: 'NL' },
  { code: 'por', label: 'PT' },
]

export const pickMultilingualNames = (
  vernacularsBySpecies: VernacularsBySpecies,
  heroSpeciesKey: number | undefined,
): { language: string; name: string }[] => {
  const list =
    heroSpeciesKey && Number.isFinite(heroSpeciesKey)
      ? vernacularsBySpecies[heroSpeciesKey] ?? []
      : []
  if (!list.length) return []

  const byLang = new Map<string, string>()
  for (const item of list) {
    const lang = (item.language ?? '').toLowerCase()
    const name = item.vernacularName?.trim()
    if (!lang || !name) continue
    if (!byLang.has(lang)) byLang.set(lang, name)
  }

  const picked: { language: string; name: string }[] = []
  for (const { code, label } of FEATURED_LANGS) {
    const name = byLang.get(code)
    if (name) picked.push({ language: label, name })
    if (picked.length >= 5) break
  }

  return picked
}