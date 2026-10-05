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

// „GMT+2" → „+02:00" dla danego dnia w Krakowie (czas letni i zimowy).
const przesuniecieWarszawa = (dzien) => {
  try {
    const nazwa = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Warsaw', timeZoneName: 'longOffset' })
      .formatToParts(new Date(`${dzien}T12:00:00Z`)).find((p) => p.type === 'timeZoneName').value; // „GMT+2" albo „GMT+01:00"
    const m = nazwa.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    return m ? `${m[1]}${m[2].padStart(2, '0')}:${m[3] || '00'}` : '+01:00';
  } catch (e) { return '+01:00'; }
};

// Wiek „4+" / „3–9 lat" → „4-" / „3-9" (typicalAgeRange)
const przedzialWieku = (wiek) => {
  const m = String(wiek || '').match(/(\d{1,2})\s*[–-]\s*(\d{1,2})/) || [];
  if (m[1]) return `${m[1]}-${m[2]}`;
  const od = String(wiek || '').match(/(\d{1,2})/);
  return od ? `${od[1]}-` : '';
};

// Pierwsze `limit` terminów (jeden Event na godzinę) z wierszy list /koncerty i /spektakle
export const wydarzeniaJsonLd = (wiersze, adresStrony, limit = 20) => {
  const wynik = [];
  for (const w of wiersze) {
    const godziny = w.godziny.length ? w.godziny : [{ godzina: '', link: '' }];
    for (const g of godziny) {
      if (wynik.length >= limit) return wynik;
      const link = g.link || w.link;
      const cena = (String(w.cena || '').match(/(\d+(?:[.,]\d+)?)\s*zł/i) || [])[1];
      const wiek = przedzialWieku(w.wiek);
      wynik.push({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: w.nazwa,
        startDate: g.godzina ? `${w.dzien}T${g.godzina}:00${przesuniecieWarszawa(w.dzien)}` : w.dzien,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
          '@type': 'Place',
          name: w.miejsce || 'Kraków',
          address: { '@type': 'PostalAddress', addressLocality: 'Kraków', addressCountry: 'PL' },
        },
        url: link || adresStrony,
        ...(wiek ? { typicalAgeRange: wiek } : {}),
        ...(link ? { offers: { '@type': 'Offer', url: link, availability: 'https://schema.org/InStock', ...(cena ? { price: cena.replace(',', '.'), priceCurrency: 'PLN' } : {}) } } : {}),
      });
    }
  }
  return wynik;
};
