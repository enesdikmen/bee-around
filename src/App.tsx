import { useState } from 'react'
import BentoPoster from './pages/BentoPoster'
import { places } from './data/lensFallbacks'
import type { Place } from './types/lens'

function App() {
  const [selectedPlace, setSelectedPlace] = useState<Place>(places[0])

  return (
    <div className="theme-playful text-ink">
      <BentoPoster
        selectedPlace={selectedPlace}
        onPlaceChange={setSelectedPlace}
      />
    </div>
  )
}

export default App
