import { useState } from 'react'
import BentoPoster from './pages/BentoPoster'
import { places } from './data/lensFallbacks'
import {
  canonicalizePlace,
  readLanguageFromLocation,
  readLocksFromLocation,
  readShareFromLocation,
} from './lib/shareToken'
import type { Place } from './types/lens'

const initialShare = readShareFromLocation()
const initialLocks = readLocksFromLocation()
const initialLanguage = readLanguageFromLocation()
const defaultPlace = canonicalizePlace({
  ...places[0],
  // Treat first-load Munich like a searched city so URL/state mirrors
  // selector-driven custom-place behavior (`c.*` token path).
  id: 'default-munich-bootstrap',
})

function App() {
  const [selectedPlace, setSelectedPlace] = useState<Place>(
    initialShare?.place ?? defaultPlace,
  )

  // Always canonicalize so the sharer's `place.id`/`label` match what a
  // receiver will reconstruct from the URL — this keeps seeded RNG keys
  // (and therefore species picks + card layout) identical across the link.
  const handlePlaceChange = (p: Place) => setSelectedPlace(canonicalizePlace(p))

  return (
    <div className="theme-playful text-ink">
      <BentoPoster
        selectedPlace={selectedPlace}
        onPlaceChange={handlePlaceChange}
        initialSeed={initialShare?.seed}
        initialLocks={initialLocks}
        initialLanguage={initialLanguage ?? undefined}
      />
    </div>
  )
}

export default App
