# Bee Around

Bee Around turns open biodiversity records into playful, shareable portraits of places. Pick a city or country, and the app builds a poster-like view showing the species, seasons, record types, conservation signals, and data sources that appear in GBIF records for that place.

It is designed for people who want a friendly way into biodiversity data: educators, students, outreach teams, GBIF nodes, local communities, challenge judges, and curious readers who may not normally open a data portal first.

## What It Does

- Searches for places and builds a biodiversity poster for the selected area.
- Highlights observed species, seasonal patterns, broad taxonomic groups, threatened species, and distinctive local species.
- Lets each refresh produce a new version of the same place, so exploration feels more like discovery than a fixed report.
- Lets users lock favorite cards, change visual themes, switch interface/name language, share an exact poster link, and export through the browser print dialog.
- Shows attribution cues for GBIF data and species images where credits and licenses are available.

Bee Around is honest about what it shows: the poster reflects available GBIF records for the selected area. It is not a complete census of all life in that place.

## GBIF Challenge Fit

Bee Around was built as a public-facing entry concept for the GBIF Ebbe Nielsen Challenge. It uses GBIF-mediated biodiversity data to create something people can understand, reuse, and share: a compact visual story of a place, with links and credits that point back to the underlying biodiversity network.

The project aims to be useful for outreach, education, local biodiversity conversations, and quick demonstrations of what open biodiversity records can reveal.

## Learn More

- [How Bee Around works](docs/how-it-works.md)
- [Data and attribution](docs/data-and-attribution.md)

## Run Locally

From this folder:

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

To build a production version:

```bash
npm run build
```

## Notes

Bee Around is a frontend-only React app. It calls public web APIs directly from the browser, including GBIF for biodiversity data and OpenStreetMap Nominatim for place search.
