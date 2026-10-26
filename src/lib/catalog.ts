// Каталог из src/data/catalog.json (собирает scripts/build-data.py из снимка Тильды) и SEO товара по шаблону.
// Цен у источника нет ни у одного товара – карточка «цена по запросу», корзина собирает заявку (вопрос владельцу №1).
import data from '../data/catalog.json';
import { SECTIONS } from './site';

export interface Variant { color: string; sku: string; photo: string | null }
export interface Product {
  uid: string; slug: string; section: string; sectionName: string; sub: string | null; subName: string | null;
  size: number | null; title: string; placeholder: boolean; sku: string; photos: string[]; variants: Variant[];
  oldUrl: string; madeToOrder: boolean;
}
export interface PageImg { src: string; w: number; h: number }

export const PRODUCTS = data.products as Product[];
export const IMAGES = data.images as Record<string, PageImg>;

export const productUrl = (p: Product) => `/katalog/${p.section}/${p.slug}/`;
export const sectionOf = (slug: string) => SECTIONS.find((s) => s.slug === slug)!;
export const inSection = (slug: string) => PRODUCTS.filter((p) => p.section === slug);

/** Чипы размеров венков в порядке источника. */
export const SIZE_CHIPS = [
  { key: '90', name: '90 см' }, { key: '110', name: '110 см' }, { key: '125', name: '125 см' },
  { key: '140-elit', name: '140 см элитные' }, { key: '140-zakaz', name: '140 см под заказ' },
];

/** Похожие: тот же размер или раздел, без самого товара. */
export function related(p: Product, n = 4) {
  const same = PRODUCTS.filter((x) => x.uid !== p.uid && x.section === p.section);
  return [...same.filter((x) => x.sub === p.sub), ...same.filter((x) => x.sub !== p.sub)].slice(0, n);
}

// ---------- SEO товара ----------
// Город – где производство и самовывоз (Сергиев Посад), а не Москва: стандарт владельца 18.10.2026.
const MAX_T = 60, MAX_D = 160;
const TYPE: Record<string, string> = {
  'ritualnye-venki': 'Ритуальный венок', 'ritualnye-korziny': 'Ритуальная корзина', 'kompozitsii-v-gorshkakh': 'Ритуальная композиция',
};

export function productSeoTitle(p: Product) {
  for (const tail of [' – купить в Сергиевом Посаде', ' – Сергиев Посад', '']) {
    if ((p.title + tail).length <= MAX_T) return p.title + tail;
  }
  return p.title.slice(0, MAX_T);
}

export function productSeoDescr(p: Product) {
  const colors = p.variants.length ? `${p.variants.length} ${plural(p.variants.length, 'исполнение', 'исполнения', 'исполнений')}, ` : '';
  const what = p.madeToOrder ? 'изготовление под заказ' : 'от производителя';
  const d = `${p.title} ${what} в Сергиевом Посаде: ${colors}лента с надписью, доставка к месту прощания. Опт и розница.`;
  return d.length <= MAX_D ? d : `${p.title} ${what} в Сергиевом Посаде. Лента с надписью, доставка, опт и розница.`.slice(0, MAX_D);
}

/** Описание карточки – только из того, что известно о товаре и о производстве (тексты страниц rozalii.ru). */
export function productText(p: Product): string[] {
  const type = TYPE[p.section];
  const out: string[] = [];
  if (p.section === 'ritualnye-venki') {
    out.push(`${type}${p.size ? ` размером ${p.size} см` : ''} для церемонии прощания, возложения или памятной даты.` +
      (p.madeToOrder ? ' Изготавливается под заказ: срок согласуем при оформлении.' : ''));
  } else if (p.section === 'ritualnye-korziny') {
    out.push('Плетёная ритуальная корзина с цветочной композицией – для прощания, возложения или памятной даты.');
  } else {
    out.push('Цветочная композиция в декоративном горшке – для памятной даты, возложения или оформления места прощания.');
  }
  if (p.variants.length) out.push(`Доступные исполнения: ${p.variants.map((v) => v.color.toLowerCase()).join(', ')}. Выберите исполнение – фото покажет вариант.`);
  out.push('Изготавливаем на собственном производстве в Сергиевом Посаде. К изделию можно добавить траурную ленту с вашей надписью: белую, чёрную, красную или бордовую – текст согласуем до изготовления.');
  return out;
}

export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}
