# Bee Around

Bee Around turns open biodiversity records into playful, shareable portraits of places. Pick a city or country-scale place and the app builds a bento poster showing what GBIF records reveal there: species, seasonality, record types, conservation signals, comparison context, data sources, photo credits, and a QR-backed share link.

It is designed for people who want a friendly first step into biodiversity data: educators, students, outreach teams, GBIF nodes, local communities, challenge judges, and curious readers who may not normally open a data portal first.

Bee Around is honest about scope: it visualizes available GBIF-mediated records for the selected area. It is not a complete census of all life in that place.

## What It Does

- Searches places with OpenStreetMap Nominatim, then asks GBIF for compact occurrence summaries for that area.
- Builds a fixed 6 x 4 poster with a title card, total-record card, hero species, mini species cards, thematic species, seasonality and evidence mix, at-risk species, signature species, and sources/QR card.
- Uses public GBIF endpoints directly from the browser: `/v1/occurrence/search`, `/v1/species/{key}`, `/v1/species/{key}/media`, and `/v1/dataset/{uuid}`.
- Uses image sources in this order: iNaturalist, Wikidata/Wikimedia Commons, then GBIF species media. Image credits and source links are shown when metadata is available.
- Lets each Regenerate produce a new deterministic version of the same place using a poster seed. Shared URLs reopen the same place, seed, theme, language, and user-managed card locks.
- Lets users lock favorite cards, switch visual themes, switch interface/name language, and export with the browser print/PDF flow.

## How The Poster Is Calculated

Most numbers come from GBIF occurrence facet queries with `limit=0`. That means Bee Around asks GBIF for counts and grouped summaries, not full occurrence downloads.

For a place, the main summary query requests:

```text
GET https://api.gbif.org/v1/occurrence/search
  ?limit=0
  &decimalLatitude=min,max
  &decimalLongitude=min,max
  &facet=month
  &facet=year
  &facet=datasetKey
  &facet=kingdomKey
  &facet=basisOfRecord
  &facetLimit=300
```

Country-scale bounding boxes, defined as at least 20 degrees of latitude or 40 degrees of longitude, use `country=XX` instead of latitude/longitude ranges when an ISO-2 country code is available.

The poster also makes smaller facet queries for species-selection pools, IUCN buckets, threatened species, thematic species, and signature species. Details are in [How Bee Around works](docs/how-it-works.md) and [Data and attribution](docs/data-and-attribution.md).

## Why Bee Around Exists

GBIF makes a huge amount of biodiversity data available, but a first encounter
with that data can still feel technical for people who are not already working
inside biodiversity informatics. Bee Around is built for that first step. It
starts with a familiar question, "what does open biodiversity data say about
this place?", and turns the answer into a compact visual poster.

The poster format is intentionally playful and approachable. Regenerate gives
another view of the same place, card locks let people keep favorite findings,
themes and language options make the output easier to adapt, and the browser
print/PDF flow turns a digital view into a physical outreach object. The QR code
on the poster reopens the same generated state, so a classroom poster, event
handout, or local display can still lead viewers back to the interactive version
with sources, credits, GBIF species links, and method notes.

Bee Around is not a replacement for GBIF.org, formal occurrence downloads,
dataset citation workflows, or expert biodiversity assessment. It is a bridge
into them: a visual, shareable, and honest first glimpse of available
GBIF-mediated records for a place.

The project emphasizes:

- access: place-first exploration instead of query parameters first;
- outreach: posters, QR links, themes, language options, and print/PDF export;
- transparency: visible caveats, source links, licenses, and GBIF taxon links;
- repeatability: seeded regeneration, stateful URLs, and user-managed card locks;
- public value: education, GBIF node communication, local biodiversity
  conversation, and quick demonstrations of open data.

## Learn More

- [How Bee Around works](docs/how-it-works.md)
- [Data and attribution](docs/data-and-attribution.md)
- [Precompute notebook](docs/precompute_comparison_sample.ipynb)

## License

Bee Around is open source under the [MIT License](LICENSE). The app uses
third-party biodiversity records, place data, and species images; see
[Data and attribution](docs/data-and-attribution.md) for source, license, and
citation notes for those materials.

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

## Implementation Notes

Bee Around is a frontend-only React/Vite app. It calls public web APIs directly from the browser. It includes two static precomputed data files derived from GBIF API queries: `comparison_precompute.json` for peer percentiles and curated comparison rows, and `global_baseline.json` for global occurrence totals and top-species counts used in signature-species ratios. The precompute workflow used to create those files is documented in `docs/precompute_comparison_sample.ipynb`.
