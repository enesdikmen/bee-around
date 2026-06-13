interface Props {
  onBack: () => void
}

function AboutPage({ onBack }: Props) {
  const docsBaseUrl = 'https://github.com/enesdikmen/bee-around/blob/main'

  return (
    <section className="about-page" aria-labelledby="about-page-title">
      <div className="about-content">
        <button type="button" className="about-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>

        <section className="about-card">
          <p className="about-kicker">About</p>
          <h1 id="about-page-title">Bee Around</h1>
          <p>
            Bee Around turns open GBIF biodiversity records into playful,
            shareable portraits of places. Pick a place, refresh for a new
            lens, lock favorite cards, and export a poster for outreach,
            education, or quick discovery.
          </p>
        </section>

        <section className="about-grid">
          <article className="about-card">
            <h2>How it works</h2>
            <p>
              The app summarizes available GBIF records for the selected area:
              species, seasons, record types, conservation signals, and source
              information. It shows patterns in the data, not a complete census
              of nature.
            </p>
            <p>
              <a href={`${docsBaseUrl}/docs/how-it-works.md`}>
                Read how Bee Around works
              </a>
            </p>
          </article>

          <article className="about-card">
            <h2>Data and credits</h2>
            <p>
              Occurrence records, species names, dataset metadata, and many
              attribution links come through GBIF. Species images are credited
              when source metadata is available.
            </p>
            <p>
              <a href={`${docsBaseUrl}/docs/data-and-attribution.md`}>
                Read data and attribution notes
              </a>
            </p>
          </article>

          <article className="about-card">
            <h2>Challenge fit</h2>
            <p>
              Bee Around is a GBIF challenge project for making open
              biodiversity data easier to understand, share, and reuse in public
              conversations.
            </p>
          </article>
        </section>
      </div>
    </section>
  )
}

export default AboutPage
