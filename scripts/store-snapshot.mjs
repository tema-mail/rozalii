/**
 * Снимок магазина rozalii.ru из API Тильды → public/_store/data.js (window.__RZ_STORE).
 * API отдаёт каталог только своему домену («Catalog is configured for another domain»), поэтому копия
 * берёт товары из снимка, а public/tilda-store-local.js отвечает скриптам каталога Тильды вместо API.
 *   node scripts/store-snapshot.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://store.tildaapi.com/api';
// корневые разделы магазина на страницах: главная/каталог/о нас, венки, корзины, горшки
const ROOTS = ['111128780593', '634569741283', '682128127473', '840602458883'];

const get = async (url) => {
  const t = await (await fetch(url)).text(); // без Origin/Referer – иначе API откажет
  if (t.startsWith('ERROR')) throw new Error(`${url}: ${t}`);
  return JSON.parse(t);
};

const SORTS = ['', 'price:asc', 'price:desc', 'title:asc', 'title:desc', 'created:desc', 'created:asc'];
const flat = (ps, out = []) => ((ps || []).forEach((x) => { out.push(x); flat(x.subparts, out); }), out);
const products = {};
const roots = {};
for (const uid of ROOTS) {
  const list = await get(`${API}/getproductslist/?storepartuid=${uid}&getparts=true&getoptions=true&slice=1&size=500&flag_root=withroot`);
  const filters = await get(`${API}/getfilters/?storepartuid=${uid}`);
  for (const p of list.products) products[p.uid] = p;
  const { products: ps, total, slice, nextslice, ...head } = list;
  if (ps.length !== total) throw new Error(`${uid}: пришло ${ps.length} из ${total}`);
  // точный порядок Тильды для каждой пары «подкатегория × сортировка»: у товаров нет цен и дат,
  // и при равных значениях Тильда ставит товары в своём порядке – его не угадать, только снять
  const paths = ['', ...flat(head.parts).map((x) => (x.path || []).join('/@/')).filter(Boolean)];
  const orders = {};
  for (const part of paths) for (const sort of SORTS) {
    const q = new URLSearchParams({ storepartuid: uid, slice: '1', size: '500', flag_root: 'withroot' });
    if (part) q.set('filters[storepartuid][0]', part);
    if (sort) q.set(`sort[${sort.split(':')[0]}]`, sort.split(':')[1]);
    const r = await get(`${API}/getproductslist/?${q}`);
    orders[`${part}|${sort}`] = r.products.map((p) => String(p.uid));
  }
  roots[uid] = { head, order: ps.map((p) => String(p.uid)), orders, filters };
  console.log(`раздел ${uid}: ${total} товаров, порядков снято ${Object.keys(roots[uid].orders).length}`);
}
mkdirSync(join(ROOT, 'public/_store'), { recursive: true });
writeFileSync(join(ROOT, 'public/_store/data.js'),
  `/* снимок магазина rozalii.ru ${new Date().toISOString().slice(0, 10)} – scripts/store-snapshot.mjs */\nwindow.__RZ_STORE=${JSON.stringify({ products, roots })};\n`);
console.log(`товаров всего: ${Object.keys(products).length}`);
