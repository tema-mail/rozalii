// Разметка schema.org: организация, хлебные крошки, товар, FAQ.
import { SITE } from './site';

export const orgLd = (url: string) => ({
  '@context': 'https://schema.org', '@type': 'Store', name: SITE.full, url,
  telephone: SITE.phones.map((p) => p.text), email: SITE.email,
  address: { '@type': 'PostalAddress', addressLocality: 'Сергиево-Посадский г. о.', streetAddress: 'д. Воронцово, 41с2', addressRegion: 'Московская область', addressCountry: 'RU' },
  openingHours: 'Mo-Su 09:00-21:00', areaServed: SITE.geo,
});

export const crumbsLd = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
});

export const faqLd = (items: [string, string][]) => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});
