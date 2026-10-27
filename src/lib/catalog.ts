// Товары и разделы для админки и для каталога копии Тильды.
// Источник правды – src/data/products.json и src/data/parts.json (модель кабинета-стандарта Milovini, правит админка).
// Сайт – копия Тильды: каталог берёт товары у tilda-store-local.js из window.__RZ_STORE, а тот собирается здесь
// (storeData) – снимок магазина Тильды src/data/store-snapshot.json + правки админки поверх: название, описание,
// цена, артикул, фото, разделы, варианты, скрытые товары, новые товары и подразделы. Точный порядок Тильды
// сохраняется: пока цена или название не правились, порядок «подраздел × сортировка» – как снят с Тильды.
import productsJson from '../data/products.json';
import partsJson from '../data/parts.json';
import snapshotJson from '../data/store-snapshot.json';

export interface Edition { id: string; sku: string; price: number | null; priceOld: number | null; img: string; opts: Record<string, string> }
export interface Product {
  id: string;
  /** адрес карточки как на Тильде: /catalog/<раздел>/tproduct/<id>-<slug> */
  path: string;
  title: string;
  descr: string;
  text: string;
  price: number | null;
  priceOld: number | null;
  mark: string;
  stock: number | null;
  parts: string[];
  sort: number;
  /** полные адреса static.tildacdn.com или загруженные через админку /uploads/… */
  images: string[];
  sku: string;
  hidden?: boolean;
  /** в архиве админки: на сайте не виден (hidden), возвращается из раздела «Архив» */
  archived?: boolean;
  options: { title: string; values: string[] }[];
  editions: Edition[];
  seoTitle?: string;
  seoDescr?: string;
}
export interface Part { id: string; title: string; parent: string | null; children: Part[] }

/** Все товары, включая скрытые – для админки. */
export const allProducts = productsJson as Product[];
export const products = allProducts.filter((p) => !p.hidden);
export const parts = partsJson as Part[];

const flatParts: Part[] = [];
const walk = (ps: Part[]) => ps.forEach((p) => { flatParts.push(p); walk(p.children); });
walk(parts);
export const partById = new Map(flatParts.map((p) => [p.id, p]));

export function partIds(id: string): Set<string> {
  const out = new Set<string>();
  const add = (p?: Part) => { if (!p) return; out.add(p.id); p.children.forEach(add); };
  add(partById.get(id));
  return out;
}
export const inPart = (p: Product, id: string) => { const ids = partIds(id); return p.parts.some((x) => ids.has(x)); };
/** Цепочка названий раздела – как path у подраздела Тильды: «Венки/@/Венки 110». */
export const partPath = (id: string): string[] => { const p = partById.get(id); return p ? [...(p.parent ? partPath(p.parent) : []), p.title] : []; };
export const productById = new Map(allProducts.map((p) => [p.id, p]));

type Raw = Record<string, any>;
interface Snapshot { date: string; products: Record<string, Raw>; roots: Record<string, Raw> }
export const snapshot = snapshotJson as unknown as Snapshot;
const ORIGIN = 'https://rozalii.ru'; // адреса в данных Тильды – с боевого домена, tilda-store-local.js переводит их на копию

const money = (n: number | null) => (n == null ? '' : String(n));
// фото из админки лежат на самом сайте (/uploads/…) – адрес с подпапкой показа, а не с боевого домена
const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
export const imgUrl = (img: string) => (/^https?:/.test(img) ? img : BASE + img);
const abs = imgUrl;

/** Товар админки → объект товара в формате API Тильды (снятый оригинал + правки). */
function toRaw(p: Product, base: Raw | undefined): Raw {
  const raw: Raw = base ? structuredClone(base) : { uid: Number(p.id), brand: 'Розалия', portion: 0, unit: '', single: '', buttonlink: '', buttontarget: '', pack_label: 'lwh', pack_x: 0, pack_y: 0, pack_z: 0, pack_m: 0, externalid: p.sku };
  const opt = p.options[0];
  Object.assign(raw, {
    title: p.title, descr: p.descr, text: p.text, sku: p.sku, mark: p.mark,
    price: p.price == null ? (base ? base.price : null) : String(p.price), priceold: money(p.priceOld),
    quantity: p.stock == null ? '' : String(p.stock), sort: p.sort, url: ORIGIN + p.path,
    gallery: base && JSON.stringify(JSON.parse(base.gallery || '[]').map((g: Raw) => g.img)) === JSON.stringify(p.images.map(abs))
      ? base.gallery : JSON.stringify(p.images.map((img) => ({ img: abs(img) }))),
    partuids: JSON.stringify(p.parts.map(Number)),
    json_options: opt ? JSON.stringify(p.options.map((o) => ({ title: o.title, params: { view: 'radio', hasColor: o.title === 'Цвет', linkImage: true }, values: o.values }))) : '',
  });
  if (p.price == null && base && base.price == null) raw.price = null;
  // вариант Тильды – снятый объект с правками (у товара без вариантов Тильда отдаёт один вариант – сам товар)
  const was = new Map<string, Raw>((base?.editions || []).map((e: Raw) => [String(e.uid), e]));
  // товар без вариантов у Тильды – один вариант, сам товар
  // у товара без вариантов цена и артикул – у самого товара (их правит админка), вариант Тильды их повторяет:
  // корзина и карточка Тильды показывают цену варианта (приёмка 28.10: цена 4321 сохранилась, но на сайте не видна)
  const one = p.editions.length < 2;
  const eds = one ? [{ id: p.editions[0]?.id ?? p.id, sku: p.sku, price: p.price, priceOld: p.priceOld, img: p.editions[0]?.img ?? p.images[0] ?? '', opts: p.editions[0]?.opts ?? {} }] : p.editions;
  if (eds.length) raw.editions = eds.map((e) => {
    const o: Raw = structuredClone(was.get(e.id) || { uid: Number(e.id), externalid: e.id, quantity: '' });
    const w = was.get(e.id);
    Object.assign(o, { sku: e.sku, price: e.price == null && w?.price == null && w ? w.price : money(e.price), priceold: money(e.priceOld), img: e.img ? abs(e.img) : '', ...e.opts });
    return o;
  });
  else delete raw.editions;
  return raw;
}

/** Дерево разделов в формате Тильды (head.parts корневого раздела): прежние объекты разделов с новыми названиями, новые – дописаны. */
function headParts(old: Raw[]): Raw[] {
  const was = new Map<string, Raw>();
  const add = (ps: Raw[]) => ps.forEach((p) => { was.set(String(p.uid), p); add(p.subparts || []); });
  add(old);
  const build = (ps: Part[]): Raw[] => ps.map((p, i) => {
    const o: Raw = structuredClone(was.get(p.id) || { uid: Number(p.id), breadcrumbtitle: '', recordid: 0, sort: 1000000 + i * 100, hideonpublic: '', url: '', img: '', imgalt: '', description: '', root: false });
    o.title = p.title; o.parentuid = p.parent ? Number(p.parent) : ''; o.path = partPath(p.id);
    delete o.subparts;
    if (p.children.length) o.subparts = build(p.children);
    return o;
  });
  // нулевой раздел (корень магазина) у Тильды – первым, без названия
  return [...old.filter((p) => !p.title), ...build(parts)];
}

/** window.__RZ_STORE для tilda-store-local.js: товары и порядки по каждому корневому разделу с правками админки. */
export function storeData() {
  const products: Record<string, Raw> = {};
  for (const p of allProducts) if (!p.hidden) products[p.id] = toRaw(p, snapshot.products[p.id]);
  const changed = (k: 'price' | 'title') => allProducts.some((p) => {
    const s = snapshot.products[p.id];
    return !s || (k === 'title' ? s.title !== p.title : (s.price ?? null) !== (p.price == null ? null : String(p.price)));
  });
  // старый путь подраздела («Венки/@/Венки 110») → id раздела: ключи порядков сняты по названиям Тильды
  const oldPath = new Map<string, string>();
  const index = (ps: Raw[]) => ps.forEach((p) => { if (p.title) oldPath.set((p.path || [p.title]).join('/@/'), String(p.uid)); index(p.subparts || []); });
  Object.values(snapshot.roots).forEach((r) => index(r.head.parts || []));
  const roots: Record<string, Raw> = {};
  for (const [rootId, r] of Object.entries(snapshot.roots)) {
    // главный корень магазина (111128780593) – не раздел админки: в нём все товары
    const member = (id: string, part: string) => { const p = productById.get(id); return !!p && !p.hidden && (partById.has(part) ? inPart(p, part) : part === rootId); };
    const fill = (list: string[], part: string, sort: string) => {
      const ids = list.filter((id) => member(id, part));
      ids.push(...allProducts.filter((p) => !ids.includes(p.id) && member(p.id, part)).map((p) => p.id));
      const [f, dir] = sort.split(':');
      if ((f === 'price' || f === 'title') && changed(f)) {
        const k = dir === 'desc' ? -1 : 1;
        const val = (id: string) => productById.get(id)!;
        ids.sort((a, b) => k * (f === 'price' ? (val(a).price ?? 0) - (val(b).price ?? 0) : val(a).title.localeCompare(val(b).title, 'ru', { numeric: true })));
      }
      return ids;
    };
    const orders: Record<string, string[]> = {};
    for (const [key, list] of Object.entries(r.orders as Record<string, string[]>)) {
      const [path, sort] = key.split('|');
      const part = path ? oldPath.get(path) : rootId;
      if (!part || (path && !partById.has(part))) continue;
      orders[`${path ? partPath(part).join('/@/') : ''}|${sort}`] = fill(list, part, sort);
    }
    const head = structuredClone(r.head);
    if (head.parts) head.parts = headParts(head.parts);
    roots[rootId] = { head, order: fill(r.order, rootId, ''), orders, filters: r.filters };
  }
  return { products, roots };
}
