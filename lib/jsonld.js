// Dane strukturalne (schema.org) jako tekst do <script type="application/ld+json">.
export const jsonLdTekst = (obiekt) => JSON.stringify(obiekt).replace(/</g, '\\u003c');

// Okruszki: [{ nazwa, href }] → BreadcrumbList
export const okruszkiJsonLd = (sciezka, siteUrl) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: sciezka.map((o, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: o.nazwa,
    item: siteUrl + o.href,
  })),
});

// Pierwsze 20 miejsc (najwięcej opinii, jak na liście) → ItemList
export const listaMiejscJsonLd = (places, nazwa) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: nazwa,
  numberOfItems: places.length,
  itemListElement: [...places]
    .sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0))
    .slice(0, 20)
    .map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Place',
        name: p.name,
        ...(p.adres || p.gmina ? { address: { '@type': 'PostalAddress', streetAddress: p.adres || undefined, addressLocality: p.gmina || 'Kraków', addressCountry: 'PL' } } : {}),
        ...(p.lat != null && p.lon != null ? { geo: { '@type': 'GeoCoordinates', latitude: p.lat, longitude: p.lon } } : {}),
        ...(p.website ? { url: p.website } : {}),
      },
    })),
});
