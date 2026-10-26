// Индексируемые страницы – для sitemap.xml и страницы «Карта сайта».
import { productUrl, inSection } from './catalog';
import { R, SECTIONS, SERVICES } from './site';

export interface Node { name: string; href: string; children?: Node[] }

export const TREE: Node[] = [
  { name: 'Главная', href: '/' },
  { name: 'Каталог', href: R.katalog, children: SECTIONS.map((s) => ({ name: s.name, href: `/katalog/${s.slug}/`,
    children: inSection(s.slug).map((p) => ({ name: p.title, href: productUrl(p) })) })) },
  { name: 'Услуги', href: R.uslugi, children: SERVICES.map((s) => ({ name: s.name, href: `/uslugi/${s.slug}/` })) },
  { name: 'Оптом', href: R.optom }, { name: 'Доставка и оплата', href: R.dostavka }, { name: 'О компании', href: R.about },
  { name: 'Контакты', href: R.contacts }, { name: 'Политика конфиденциальности', href: R.policy },
  { name: 'Пользовательское соглашение', href: R.agreement }, { name: 'Согласие на обработку персональных данных', href: R.consent },
  { name: 'Карта сайта', href: R.map },
];

export const flat = (nodes: Node[] = TREE): string[] => nodes.flatMap((n) => [n.href, ...flat(n.children || [])]);
