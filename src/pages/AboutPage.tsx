function AboutPage() {
  return (
    <section className="about-page" aria-labelledby="about-page-title">
      <section className="about-card">
        <p className="about-kicker">About</p>
        <h1 id="about-page-title">Bee Around</h1>
        <p>
          A compact biodiversity portrait for a place. This page is a simple
          placeholder for the project story, methods, and team.
        </p>
      </section>

      <section className="about-grid">
        <article className="about-card">
          <h2>How data is calculated</h2>
          <p>
            Short explanation of the data pipeline, ranking logic, card
            selection, and how the poster is generated will go here.
          </p>
        </article>

        <article className="about-card">
          <h2>Data sources</h2>
          <p>
            Placeholder for GBIF, iNaturalist, Wikidata, image attribution, and
            notes about known limits or assumptions.
          </p>
        </article>

        <article className="about-card">
          <h2>Developers</h2>
          <p>
            Add names, roles, contact links, and the GitHub repository here.
          </p>
        </article>
      </section>
    </section>
  )
}

export default AboutPage