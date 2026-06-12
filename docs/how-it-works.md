# How Bee Around Works

Bee Around creates a biodiversity poster for a place. Each poster is a compact mix of maps, species cards, record counts, seasonal patterns, conservation hints, source information, and a shareable link.

The app is meant to feel exploratory. A single place can produce many good posters, because there is usually more biodiversity data than can fit on one screen.

## Choosing a Place

Use the place search at the top of the app to find a city or other named place. Search results come from OpenStreetMap Nominatim and include OpenStreetMap attribution in the dropdown.

When a place is selected, Bee Around uses its available boundary box when possible. For very large country-scale areas, it uses the country filter instead. If a detailed boundary is not available, the app falls back to an approximate area around the selected point.

## Building the Poster

For the selected place, Bee Around asks GBIF for summary counts rather than downloading every individual record. It uses those summaries to build cards such as:

- a place title with a small globe marker
- total GBIF records for the area
- broad biodiversity groups such as animals, plants, fungi, and others
- common or representative species cards
- monthly seasonality and record history
- how records were made, such as human observations, specimens, samples, or machine observations
- IUCN Red List category summaries where GBIF has that information
- threatened species cards when available
- signature species that appear more strongly in this place than in a global GBIF baseline
- source and sharing information, including a QR code

Species cards show common names when GBIF provides them in the selected language. They also show scientific names, observation counts, taxonomic context, GBIF species links, and image credits when available.

## Refreshing and Randomization

The **Regenerate** button creates a new version of the poster for the same place. It changes the poster seed, which can rotate species choices, thematic cards, and layout while keeping the same underlying place.

This is intentional. Bee Around treats biodiversity data as something to browse from several angles, not as a single fixed dashboard.

## Species and Card Selection

The app builds small candidate pools from GBIF counts, then picks from those pools in a repeatable way. That means the same shared poster link should reopen with the same seed and card choices, while a new regenerate action gives the place a fresh composition.

The poster avoids showing the same species in multiple cards when it can. If data is sparse or an image is missing, the app may show a placeholder or fallback content rather than leaving the poster empty.

## Locked Cards

Most cards can be locked with the lock button on the card. A locked card keeps its current content and position when the poster is regenerated.

This lets someone keep a favorite species, title, or source card in place while exploring other variations. The title and source cards are locked by default so the poster stays readable and attributable. The sources card keeps its position when locked, but its QR code and sharing text stay live so they match the current poster state.

Unlocking a card does not immediately reshuffle it. It becomes free to change on the next regenerate action.

## Share Links

The app keeps the browser address bar in sync with the poster. A share link can preserve:

- the selected place
- the poster seed
- the selected language
- the selected visual theme
- locked cards and their positions

The sources card includes a QR code for the current poster link, making exported posters easier to reopen later.

## Themes and Language

The theme menu changes the visual style of the poster. Current themes include Original, Aqua, Prism, Afterdark, and Acid Garden.

The language menu changes interface text and asks GBIF for species common names in that language where available. Scientific names remain visible so the species identity is still clear when common names are missing or vary by source.

## Export and Print

The **PDF** button opens the browser print dialog. From there, choose **Save as PDF** or print normally.

Bee Around sizes the print page to match the current poster shape. Text and vector graphics remain crisp where the browser supports it; species photos and the small globe render as images. The suggested filename includes the place and seed so different poster versions are easier to tell apart.

Exports should be treated as visual summaries. For reuse beyond a quick demo or classroom setting, check the image credits, licenses, and underlying GBIF data links.
