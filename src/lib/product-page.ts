// Карточка товара копии Тильды с правками админки. HTML карточки – как снят с Тильды (src/data/pages/*tproduct*.json,
// его перезаписывает npm run port), поэтому правки накладываются при сборке, а не в файл: данные товара в скрипте
// страницы (var product – из него Тильда рисует цену, варианты и фото), заголовок H1, title, og:title, description.
// Новый товар (создан в админке, на Тильде его нет) собирается по карточке соседнего товара того же раздела.
import { allProducts, imgUrl, productById, snapshot, type Product } from './catalog';

type Page = { path: string; head?: string; body?: string; htmlAttrs?: Record<string, string>; bodyAttrs?: Record<string, string> };
const ORIGIN = 'https://rozalii.ru';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (n: number | null) => (n == null ? '' : String(n));
const abs = imgUrl;
const idOf = (path: string) => path.match(/tproduct\/(\d+)/)?.[1];

function patchVar(body: string, p: Product, fresh: boolean): string {
  return body.replace(/var product = (\{[\s\S]*?\});(\s)/, (_m, json: string, sp: string) => {
    const o = JSON.parse(json);
    const snap = snapshot.products[p.id];
    const imagesSame = !fresh && snap && JSON.stringify(JSON.parse(snap.gallery || '[]').map((g: any) => g.img)) === JSON.stringify(p.images.map(abs));
    Object.assign(o, {
      uid: Number(p.id), title: p.title, descr: p.descr, text: p.text, price: money(p.price), sort: p.sort,
      partuids: p.parts.map(Number), url: ORIGIN + p.path,
      json_options: p.options.length ? JSON.stringify(p.options.map((x) => ({ title: x.title, params: { view: 'radio', hasColor: x.title === 'Цвет', linkImage: true }, values: x.values }))) : '',
    });
    if (!imagesSame) o.gallery = p.images.map((img) => ({ img: abs(img) }));
    const was = new Map<string, any>((o.editions || []).map((e: any) => [String(e.uid), e]));
    // товар без вариантов – один вариант с ценой и артикулом товара (их правит админка), как в src/lib/catalog.ts
    o.editions = (p.editions.length >= 2 ? p.editions : [{ id: p.editions[0]?.id ?? p.id, sku: p.sku, price: p.price, priceOld: p.priceOld, img: p.editions[0]?.img ?? '', opts: p.editions[0]?.opts ?? {} }])
      .map((e) => ({ ...(was.get(e.id) || { uid: Number(e.id), externalid: e.id, quantity: '' }), sku: e.sku, price: money(e.price), priceold: money(e.priceOld), img: e.img ? abs(e.img) : '', ...e.opts }));
    return `var product = ${JSON.stringify(o)};${sp}`;
  });
}

/** Страница карточки с правками админки; null – товар скрыт, страница не собирается. */
export function productPage(page: Page): Page | null {
  const id = idOf(page.path);
  const p = id ? productById.get(id) : undefined;
  if (!p) return page;
  if (p.hidden) return null;
  return render(page, p, false);
}

function render(page: Page, p: Product, fresh: boolean): Page {
  const old = (page.body || '').match(/itemprop="name"\s*>([^<]*)<\/h1>/)?.[1] ?? p.title;
  const was = (page.head || '').match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  const wasDescr = (page.head || '').match(/name="description" content="([^"]*)"/)?.[1] ?? '';
  // SEO на странице – как сейчас на Тильде; меняется, только если поле в админке отличается от того, что стоит
  const title = p.seoTitle || (fresh ? `${p.title} - Розалия` : '');
  const descr = p.seoDescr || (fresh ? p.descr : '');
  let head = page.head || '';
  if (title && esc(title) !== was) head = head.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`).replace(/(property="og:title" content=")[^"]*/, `$1${esc(title)}`);
  if (descr && esc(descr) !== wasDescr) head = head.replace(/(name="description" content=")[^"]*/, `$1${esc(descr)}`).replace(/(property="og:description" content=")[^"]*/, `$1${esc(descr)}`);
  let body = patchVar(page.body || '', p, fresh).replace(/(itemprop="name"\s*>)[^<]*(<\/h1>)/, `$1${esc(p.title)}$2`);
  if (fresh || old !== p.title) body = body.split(`>${old}<`).join(`>${esc(p.title)}<`);
  return { ...page, path: p.path.replace(/^\//, ''), head, body };
}

/** Карточки товаров, созданных в админке: по образцу первой карточки того же раздела. */
export function newProductPages(pages: Page[]): Page[] {
  const have = new Set(pages.map((pg) => idOf(pg.path)).filter(Boolean));
  const tpl = (p: Product) => pages.find((pg) => { const t = idOf(pg.path) && productById.get(idOf(pg.path)!); return t && t.parts.some((x) => p.parts.includes(x)); })
    || pages.find((pg) => idOf(pg.path));
  return allProducts.filter((p) => !p.hidden && !have.has(p.id) && !snapshot.products[p.id]).flatMap((p) => {
    const t = tpl(p);
    return t ? [render(t, p, true)] : [];
  });
}
