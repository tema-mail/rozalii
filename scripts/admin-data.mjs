/**
 * Начальные данные админки из снимка магазина Тильды: src/data/store-snapshot.json →
 * src/data/products.json (товары в модели кабинета-стандарта Milovini) и src/data/parts.json (дерево разделов).
 * Дальше эти файлы правит только админка (коммитом через GitHub), поэтому при существующих файлах
 * скрипт ничего не делает – перезапись только явно: node scripts/admin-data.mjs --force.
 *   node scripts/admin-data.mjs
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_P = join(ROOT, 'src/data/products.json');
const OUT_S = join(ROOT, 'src/data/parts.json');
if ((existsSync(OUT_P) || existsSync(OUT_S)) && !process.argv.includes('--force')) {
  console.log('products.json / parts.json уже есть – их правит админка; перезапись: --force');
  process.exit(0);
}
const S = JSON.parse(readFileSync(join(ROOT, 'src/data/store-snapshot.json'), 'utf8'));
const json = (s, d) => { try { return s ? JSON.parse(s) : d; } catch { return d; } };
const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));

const products = Object.values(S.products).sort((a, b) => a.sort - b.sort).map((r) => {
  const options = json(r.json_options, []).map((o) => ({ title: o.title, values: o.values }));
  return {
    id: String(r.uid),
    path: new URL(r.url).pathname,
    title: r.title,
    descr: r.descr || '',
    text: r.text || '',
    price: num(r.price),
    priceOld: num(r.priceold),
    mark: r.mark || '',
    stock: num(r.quantity),
    parts: json(r.partuids, []).map(String),
    sort: r.sort,
    images: json(r.gallery, []).map((g) => g.img),
    sku: r.sku || '',
    hidden: false,
    options,
    editions: (r.editions || []).map((e) => ({
      id: String(e.uid), sku: e.sku || '', price: num(e.price), priceOld: num(e.priceold), img: e.img || '',
      opts: Object.fromEntries(options.map((o) => [o.title, e[o.title] || ''])),
    })),
    seoTitle: '',
    seoDescr: '',
  };
});

// дерево разделов – из главного корня магазина (там Тильда отдаёт все разделы с подразделами)
const tree = (ps, parent = null) => ps.filter((p) => p.title).map((p) => ({
  id: String(p.uid), title: p.title, parent, children: tree(p.subparts || [], String(p.uid)),
}));
const main = Object.values(S.roots).find((r) => r.head.parts)?.head.parts || [];
const parts = tree(main).sort((a, b) => (main.find((p) => String(p.uid) === a.id)?.sort ?? 0) - (main.find((p) => String(p.uid) === b.id)?.sort ?? 0));

writeFileSync(OUT_P, JSON.stringify(products, null, 1) + '\n');
writeFileSync(OUT_S, JSON.stringify(parts, null, 1) + '\n');
console.log(`товаров ${products.length}, разделов ${parts.length} (с подразделами ${parts.reduce((n, p) => n + 1 + p.children.length, 0)})`);
