# Data and Attribution

Bee Around is powered mainly by GBIF-mediated biodiversity data. It turns public records into a visual summary for a selected place, while keeping the most important caveat visible: the app shows patterns in available GBIF records, not a complete census of nature.

Some species are recorded often because people notice them, photograph them, collect them, or share them through active projects. Other species may be present but under-recorded, misidentified, hidden, seasonal, restricted, or simply missing from available datasets.

## Occurrence Records

Most poster numbers come from GBIF occurrence records. An occurrence is evidence that an organism was recorded at a place and time. Depending on the dataset, that evidence might be a human observation, museum or herbarium specimen, material sample, machine observation, fossil, literature record, or another record type.

Bee Around summarizes occurrence records for the selected place using GBIF search facets. These facets allow the app to count patterns such as month, year, species, kingdom, dataset, basis of record, media type, and IUCN Red List category without downloading every record.

## Place Area

Place search is provided by OpenStreetMap Nominatim. When possible, Bee Around uses the selected place boundary box to ask GBIF for records in that area. For country-scale selections, it can use a country filter. When a boundary is not available, it uses an approximate area around the selected point.

Because place boundaries and record coordinates vary in precision, the poster should be read as a helpful place-based snapshot rather than a legally precise boundary report.

## Species Names

Species cards use GBIF species information. Bee Around prefers a common name in the selected language when GBIF provides one, then falls back to canonical or scientific names.

Scientific names are always important because common names can be missing, duplicated, translated differently, or used differently across regions.

## Images and Media

Species images are best-effort. The app tries to find representative images from configured sources, including GBIF species media and other openly accessible biodiversity/image sources used by the frontend.

When image credit metadata is available, Bee Around shows it in the species card details. Credits can include the source, creator or rights holder, license, and a link back to the image or media page.

Not every species has a usable image. In those cases, the app may show a placeholder while still keeping the species identity and GBIF link.

## Datasets, Licenses, and Credits

GBIF occurrence records come from many publishing datasets. Bee Around reads dataset metadata for top contributing datasets, including titles, publishers, DOIs, and licenses when GBIF provides them.

The poster source card points readers back to GBIF, and species detail panels link to GBIF species pages. Image detail panels link to source pages when available. These links are part of the attribution trail and help readers inspect the underlying record network.

For formal reuse, users should follow the licenses and citations attached to the underlying datasets and media. A Bee Around poster is a convenient summary, not a replacement for checking the original GBIF dataset pages and media source pages.

## Conservation Signals

Bee Around can show IUCN Red List category summaries and threatened species cards where those categories appear in GBIF occurrence data. These signals are useful for orientation, but they are not a local conservation assessment.

A threatened species appearing on a poster means GBIF has records for that taxon in or near the selected area under the current filters. It does not prove current presence, local population size, breeding status, or management priority.

## Known Caveats

- Record volume reflects observation and publishing activity, not only biodiversity.
- Popular places, charismatic species, active citizen-science communities, and well-digitized collections may appear strongly.
- Some records may have coordinate uncertainty, old dates, duplicate clusters, missing media, or taxonomic changes.
- Some species groups are easier to observe than others.
- Recent records may be incomplete because datasets are published and indexed over time.
- Image availability and licensing vary by species and source.

Bee Around is therefore best read as an invitation: it helps people notice patterns, ask better questions, and follow the links back to GBIF for deeper investigation.
