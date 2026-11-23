### Fixed

- The per-game SEO test now reads the title and JSON-LD script from the rendered DOM instead of raw HTML, so a commented-out `<title>` or `VideoGame` script is caught instead of still passing.
