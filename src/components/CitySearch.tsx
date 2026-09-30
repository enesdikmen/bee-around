/**
 * Simple city search backed by Nominatim (OpenStreetMap).
 *
 * Debounced free-text input → dropdown of matches → emits a `Place`.
 * Stays in the `Place` shape the rest of the app already consumes.
 */
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchCities } from '../api/nominatim'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { getUiText, type UiText } from '../i18n/uiText'
import type { Place } from '../types/lens'
import './CitySearch.css'

interface Props {
  selected?: Place
  onSelect: (place: Place) => void
  placeholder?: string
  language?: string
  text?: UiText['citySearch']
  disabled?: boolean
}

export default function CitySearch({
  selected,
  onSelect,
  placeholder,
  language = 'en',
  text = getUiText(language).citySearch,
  disabled = false,
}: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Search once typing pauses. TanStack Query caches each search for an hour
  // after its last use (Nominatim's policy asks clients to cache) and cancels
  // a search that is still running when the text changes.
  const term = query.trim().replace(/\s+/g, ' ')
  const debouncedTerm = useDebouncedValue(term, 400)
  const search = useQuery({
    queryKey: ['citySearch', language, debouncedTerm.toLowerCase()],
    queryFn: ({ signal }) => searchCities(debouncedTerm, { signal, language }),
    enabled: !disabled && debouncedTerm.length >= 2,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
  })
  const results = search.data ?? []
  const loading = search.isFetching || term !== debouncedTerm

  // Close dropdown on outside click.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function pick(p: Place) {
    if (disabled) return
    onSelect(p)
    setQuery('')
    setOpen(false)
  }

  const buttonLabel = selected?.label ?? text.pickCity

  return (
    <div className="city-search" ref={wrapRef}>
      <input
        className="city-search__input"
        type="text"
        value={query}
        disabled={disabled}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder={selected ? buttonLabel : placeholder ?? text.placeholder}
        aria-label={text.ariaLabel}
      />
      {open && !disabled && term.length >= 2 && (
        <div className="city-search__dropdown" role="listbox">
          {loading && <div className="city-search__hint">{text.searching}</div>}
          {!loading && search.isError && (
            <div className="city-search__hint city-search__hint--err">{text.failed}</div>
          )}
          {!loading && search.isSuccess && results.length === 0 && (
            <div className="city-search__hint">{text.noMatches}</div>
          )}
          {!loading &&
            search.isSuccess &&
            results.map((p) => (
              <button
                key={p.id}
                type="button"
                className="city-search__item"
                disabled={disabled}
                onClick={() => pick(p)}
                role="option"
              >
                <span className="city-search__name">{p.label}</span>
                {p.country && <span className="city-search__country">{p.country}</span>}
              </button>
            ))}
          <div className="city-search__attr">
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
              © OpenStreetMap contributors
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
