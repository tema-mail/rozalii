import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { Product, Part } from '../../lib/catalog';
import ProductEditor, { imgSrc, type AdmProduct } from './ProductEditor';
import CsvImport from './CsvImport';
import GhConnect from './GhConnect';
import { PARTS_PATH, PRODUCTS_PATH, UPLOADS_DIR, buildOf, commit, humanError, fileToBase64, getToken, readJson, slugify, type FileChange } from './gh';

// Раздел «Товары» по образцу магазина Тильды (эталон – Elite Rose). С подключённым ключом GitHub изменения сохраняются
// в src/data/*.json одним коммитом, и сайт пересобирается (~1 минута). Без ключа – только просмотр.
// Перенос кабинета-стандарта Milovini. Разделы – дерево Тильды (Венки → Венки 90/110/125/140), слева подразделы с отступом,
// счётчик и фильтр раздела включают подразделы. Варианты «Цвет» – как у gaz-mag. Удаление – внутри товара, через окно
// «в архив / удалить навсегда / отмена» (правило владельца 27.10.2026), архив – отдельный раздел слева.

const fmt = (n: number | null) => (n == null ? '–' : n.toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽');
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const htmlToText = (h: string) => h.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const toAdm = (p: Product): AdmProduct => ({
  id: p.id, title: p.title, sku: p.sku ?? '', price: p.price, priceOld: p.priceOld, qty: p.stock == null ? '' : String(p.stock),
  mark: p.mark, descr: p.descr, text: htmlToText(p.text), images: p.images, parts: p.parts, path: p.path, visible: !p.hidden,
  seoTitle: p.seoTitle ?? '', seoDescr: p.seoDescr ?? '',
  // у Тильды товар без вариантов – один вариант; в редакторе это «нет вариантов»
  options: p.editions.length >= 2 ? p.options : [], editions: p.editions.length >= 2 ? p.editions : [],
});
// адрес нового товара – как у Тильды: /catalog/<страница раздела>/tproduct/<id>-<название>
const CATALOG_OF: Record<string, string> = { '634569741283': 'ritual_wreaths', '682128127473': 'ritual_baskets', '840602458883': 'pot' };

interface Flat { id: string; title: string; depth: number; ids: string[] }
/** Дерево разделов → плоский список с глубиной; ids – раздел и все его подразделы (как inPart на сайте). */
function flatten(tree: Part[], depth = 0): Flat[] {
  const all = (p: Part): string[] => [p.id, ...p.children.flatMap(all)];
  return tree.flatMap((p) => [{ id: p.id, title: p.title, depth, ids: all(p) }, ...flatten(p.children, depth + 1)]);
}
/** Добавить раздел в дерево: в корень или внутрь родителя. */
function insertPart(tree: Part[], part: Part, parent: string | null): Part[] {
  if (!parent) return [...tree, part];
  return tree.map((p) => (p.id === parent ? { ...p, children: [...p.children, part] } : { ...p, children: insertPart(p.children, part, parent) }));
}
/** CSV в формате выгрузки Тильды – собирается в браузере после входа (открытых файлов в кабинете нет). */
function csvHref(rows: Product[], flat: Flat[], site: string) {
  const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const name = (id: string) => flat.find((f) => f.id === id)?.title ?? id;
  const head = ['SKU', 'Category', 'Title', 'Description', 'Text', 'Photo', 'Price', 'Price Old', 'Quantity', 'Mark', 'Hidden', 'Archived', 'Url'];
  const body = rows.map((p) => [p.sku ?? '', p.parts.map(name).join(';'), p.title, p.descr, p.text.replace(/<[^>]+>/g, ' ').trim(),
    p.images.map((im) => (/^https?:/.test(im) ? im : site + im)).join(' '), p.price ?? '', p.priceOld ?? '', p.stock ?? '', p.mark, p.hidden ? 'yes' : '', p.archived ? 'yes' : '', `${site}${p.path}`].map(q).join(';'));
  return 'data:text/csv;charset=utf-8,' + encodeURIComponent('\ufeff' + [head.join(';'), ...body].join('\r\n'));
}

type Status = { kind: 'idle' | 'saving' | 'building' | 'done' | 'error'; text: string; url?: string; sha?: string };

export default function ProductsAdmin({ items, parts: initParts, base }: { items: Product[]; parts: Part[]; base: string }) {
  const [raw, setRaw] = useState<Product[]>(items);
  const [parts, setParts] = useState<Part[]>(initParts);
  const [connected, setConnected] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [part, setPart] = useState('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('site');
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [edit, setEdit] = useState<AdmProduct | null>(null);
  const [csv, setCsv] = useState(false);
  const [newPart, setNewPart] = useState<string | null>(null);
  const [del, setDel] = useState<AdmProduct | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle', text: '' });

  // С ключом – берём свежие данные прямо из репозитория: собранный сайт отстаёт на время сборки.
  // Счётчик сохранений: подгрузка, начатая до сохранения, не должна затереть его результат (найдено живым тестом 18.10.2026).
  const saves = useRef(0);
  const reload = async () => {
    const mark = saves.current;
    const [p, pt] = await Promise.all([readJson<Product[]>(PRODUCTS_PATH), readJson<Part[]>(PARTS_PATH)]);
    if (mark === saves.current) { setRaw(p); setParts(pt); }
  };
  useEffect(() => { if (getToken()) { setConnected(true); reload().catch(() => setStatus({ kind: 'error', text: 'Не удалось загрузить данные из GitHub – проверьте ключ' })); } }, []);

  // Следим за сборкой сайта, которую запустил именно наш коммит (более ранние сборки не считаются).
  useEffect(() => {
    if (status.kind !== 'building' || !status.sha) return;
    const sha = status.sha;
    let stop = false;
    const tick = async () => {
      if (stop) return;
      try {
        const b = await buildOf(sha);
        if (b && b.status === 'completed') {
          setStatus(b.conclusion === 'success' ? { kind: 'done', text: 'Сайт обновлён – изменения уже на сайте', url: b.url } : { kind: 'error', text: 'Сборка сайта упала – откройте журнал', url: b.url });
          return;
        }
        if (b) setStatus((s) => ({ ...s, url: b.url }));
      } catch {}
      setTimeout(tick, 6000);
    };
    const t = setTimeout(tick, 8000);
    return () => { stop = true; clearTimeout(t); };
  }, [status.kind, status.sha]);

  const list = useMemo(() => raw.map(toAdm), [raw]);
  const archived = useMemo(() => new Set(raw.filter((p) => p.archived).map((p) => p.id)), [raw]);
  const flat = useMemo(() => flatten(parts), [parts]);
  const title = (id: string) => flat.find((p) => p.id === id)?.title ?? id;
  const idsOf = (id: string) => flat.find((p) => p.id === id)?.ids ?? [id];
  const [newParent, setNewParent] = useState('');

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    const want = part === 'all' || part === 'hidden' ? [] : idsOf(part);
    let out = list.filter((p) => (part === 'archive' ? archived.has(p.id) : !archived.has(p.id) && (part === 'all' || (part === 'hidden' ? !p.visible : p.parts.some((x) => want.includes(x))))) && (!s || p.title.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s)));
    if (sort === 'price-asc') out = [...out].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    if (sort === 'price-desc') out = [...out].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    if (sort === 'name') out = [...out].sort((a, b) => a.title.localeCompare(b.title, 'ru'));
    return out;
  }, [list, part, q, sort, flat, archived]);

  /** Сохранить изменение одним коммитом. Изменение – правило над списком товаров (и разделов), а не готовый список:
   *  перед записью данные читаются из репозитория заново, и правило накладывается на них. Так сохранение не откатывает
   *  чужие или более ранние правки (вторая вкладка, незавершённая подгрузка). */
  const persist = async (mut: (list: Product[]) => Product[], message: string, extra: FileChange[] = [], mutParts?: (pt: Part[]) => Part[]) => {
    saves.current++;
    setRaw((r) => mut(r)); if (mutParts) setParts((pt) => mutParts(pt));
    if (!connected) { setStatus({ kind: 'error', text: 'Изменение видно только у вас – подключите сохранение, чтобы оно попало на сайт' }); return; }
    setStatus({ kind: 'saving', text: 'Сохраняем…' });
    try {
      const [freshP, freshPt] = await Promise.all([readJson<Product[]>(PRODUCTS_PATH), mutParts ? readJson<Part[]>(PARTS_PATH) : Promise.resolve(null)]);
      const nextRaw = mut(freshP);
      const files: FileChange[] = [{ path: PRODUCTS_PATH, text: JSON.stringify(nextRaw, null, 1) + '\n' }, ...extra];
      let nextParts: Part[] | null = null;
      if (mutParts && freshPt) { nextParts = mutParts(freshPt); files.push({ path: PARTS_PATH, text: JSON.stringify(nextParts, null, 1) + '\n' }); }
      const sha = await commit(files, `Админка: ${message}`);
      saves.current++;
      setRaw(nextRaw); if (nextParts) setParts(nextParts);
      setStatus({ kind: 'building', text: 'Сохранено. Сайт обновляется – обычно около минуты', sha });
    } catch (e: any) {
      setStatus({ kind: 'error', text: `Не сохранилось: ${humanError(e)}` });
    }
  };

  const save = async (p: AdmProduct, files: File[]) => {
    if (!p.title.trim()) return setStatus({ kind: 'error', text: 'Укажите название товара' });
    const isNew = !p.id;
    const id = isNew ? String(Date.now()) : p.id;
    const old = raw.find((x) => x.id === id);
    const uploads: FileChange[] = [];
    const images = [...p.images];
    let n = images.reduce((m, im) => Math.max(m, Number(im.match(/-(\d+)\.\w+$/)?.[1] ?? -1) + 1), 0);
    for (const f of files) {
      const ext = (f.name.split('.').pop() || 'jpg').toLowerCase();
      uploads.push({ path: `${UPLOADS_DIR}/${id}-${n}.${ext}`, base64: await fileToBase64(f) });
      images.push(`/uploads/${id}-${n}.${ext}`);
      n++;
    }
    const build = (old: Product | undefined): Product => ({
      ...(old ?? { sort: 0 }),
      id, path: old?.path ?? newPath({ ...p, id }),
      // описание не трогали – сохраняем исходную разметку (<strong>Состав:</strong> и т. п.); правили – текст построчно
      title: p.title.trim(), descr: p.descr.trim(), text: old && p.text === htmlToText(old.text) ? old.text : esc(p.text.trim()).replace(/\n/g, '<br />'),
      price: p.price, priceOld: p.priceOld, mark: p.mark.trim(), stock: p.qty.trim() ? Number(p.qty.replace(/\D/g, '')) : null,
      parts: p.parts, images, sku: p.sku.trim(), hidden: !p.visible,
      options: p.editions.length >= 2 ? p.options : [], editions: p.editions.length >= 2 ? p.editions : (old && old.editions.length < 2 ? old.editions : []),
      ...(p.seoTitle ? { seoTitle: p.seoTitle } : {}), ...(p.seoDescr ? { seoDescr: p.seoDescr } : {}),
    } as Product);
    const next = build(old);
    setEdit(null);
    if (!isNew && !uploads.length && JSON.stringify(old) === JSON.stringify(next)) return setStatus({ kind: 'done', text: 'Изменений нет – сохранять нечего' });
    await persist((list) => (isNew ? [build(undefined), ...list] : list.map((x) => (x.id === id ? build(x) : x))), `${isNew ? 'новый товар' : 'товар'} «${next.title}»`, uploads);
  };

  // «Удалить товар» внутри товара открывает окно: в архив (по умолчанию), удалить навсегда, отмена
  const remove = (p: AdmProduct) => setDel(p);
  const toArchive = async (p: AdmProduct, on: boolean) => {
    setDel(null); setEdit(null);
    await persist((list) => list.map((x) => (x.id === p.id ? { ...x, archived: on, hidden: on } : x)), `${on ? 'в архив' : 'из архива'}: товар «${p.title}»`);
  };
  const destroy = async (p: AdmProduct) => {
    setDel(null); setEdit(null);
    await persist((list) => list.filter((x) => x.id !== p.id), `удалён товар «${p.title}»`);
  };
  const newPath = (p: AdmProduct) => {
    const root = p.parts.map((id) => flat.find((f) => f.depth === 0 && f.ids.includes(id))?.id).find((id) => id && CATALOG_OF[id]);
    return `/catalog/${CATALOG_OF[root ?? ''] ?? 'ritual_wreaths'}/tproduct/${p.id || '<номер>'}-${slugify(p.title || 'tovar')}`;
  };

  const setVisible = (ids: string[], visible: boolean) =>
    persist((list) => list.map((x) => (ids.includes(x.id) ? { ...x, hidden: !visible } : x)), `${visible ? 'показано' : 'скрыто'} на сайте: ${ids.length} шт.`);

  const addToPart = (ids: string[], pid: string) =>
    persist((list) => list.map((x) => (ids.includes(x.id) && !x.parts.includes(pid) ? { ...x, parts: [...x.parts, pid] } : x)), `в раздел «${title(pid)}»: ${ids.length} шт.`);

  const createPart = async (name: string) => {
    const t = name.trim();
    if (!t) return;
    if (flat.some((p) => p.title.toLowerCase() === t.toLowerCase())) return setStatus({ kind: 'error', text: `Раздел «${t}» уже есть` });
    let id = slugify(t); while (flat.some((p) => p.id === id)) id += '-2';
    setNewPart(null);
    const ids = [...sel];
    const parent = newParent || null;
    await persist((list) => (ids.length ? list.map((x) => (ids.includes(x.id) ? { ...x, parts: [...x.parts, id] } : x)) : list), `новый раздел «${t}»${parent ? ` в «${title(parent)}»` : ''}${ids.length ? ` + ${ids.length} товаров` : ''}`, [], (pt) => insertPart(pt, { id, title: t, parent, children: [] }, parent));
    setNewParent('');
    setSel(new Set()); setPart(id);
  };

  const allOn = shown.length > 0 && shown.every((p) => sel.has(p.id));
  const toggle = (id: string) => { const s = new Set(sel); s.has(id) ? s.delete(id) : s.add(id); setSel(s); };
  const blank = (): AdmProduct => ({ id: '', title: '', sku: '', price: null, priceOld: null, qty: '', mark: '', descr: '', text: '', images: [], parts: !['all', 'hidden', 'archive'].includes(part) ? [...new Set([...(flat.find((f) => f.ids.includes(part) && f.depth === 0)?.id ? [flat.find((f) => f.ids.includes(part) && f.depth === 0)!.id] : []), part])] : [], path: '', visible: true, seoTitle: '', seoDescr: '', options: [], editions: [] });

  return (
    <div>
      <div class={`sync sync--${connected ? 'on' : 'off'}`}>
        {connected ? (
          <>
            <span class="sync__dot" />
            <span>Сохранение подключено – изменения попадают на сайт</span>
            {status.kind !== 'idle' && <span class={`sync__st sync__st--${status.kind}`}>{status.text}{status.url && <> · <a href={status.url} target="_blank" rel="noopener">журнал сборки</a></>}</span>}
            <button class="btn ghost" onClick={() => setShowConnect(true)}>Ключ</button>
          </>
        ) : (
          <>
            <span class="sync__dot" />
            <span>Режим просмотра: изменения не сохраняются.</span>
            {status.kind === 'error' && <span class="sync__st sync__st--error">{status.text}</span>}
            <button class="btn primary" onClick={() => setShowConnect(true)}>Подключить сохранение</button>
          </>
        )}
      </div>

      <div class="pa">
        <aside class="pa__side">
          <p class="pa__cap">Разделы</p>
          <button class={part === 'all' ? 'on' : ''} onClick={() => setPart('all')}>Все товары<span>{list.length - archived.size}</span></button>
          {flat.map((pt) => (
            <button class={`${part === pt.id ? 'on' : ''}${pt.depth ? ' sub' : ''}`} style={pt.depth ? `padding-left:${10 + pt.depth * 16}px` : ''} onClick={() => setPart(pt.id)}>{pt.title}<span>{list.filter((p) => p.parts.some((x) => pt.ids.includes(x))).length}</span></button>
          ))}
          <button class={part === 'hidden' ? 'on' : ''} onClick={() => setPart('hidden')}>Скрытые<span>{list.filter((p) => !p.visible && !archived.has(p.id)).length}</span></button>
          <button class={part === 'archive' ? 'on' : ''} onClick={() => setPart('archive')}>Архив<span>{archived.size}</span></button>
          {newPart === null ? (
            <button class="pa__addpart" onClick={() => setNewPart('')}>+ Добавить раздел</button>
          ) : (
            <form class="pa__newpart" onSubmit={(e) => { e.preventDefault(); createPart(newPart); }}>
              <input autoFocus placeholder="Название раздела" value={newPart} onInput={(e) => setNewPart((e.target as HTMLInputElement).value)} />
              <select value={newParent} onChange={(e) => setNewParent((e.target as HTMLSelectElement).value)} aria-label="Где создать">
                <option value="">В корне каталога</option>
                {flat.filter((f) => f.depth === 0).map((f) => <option value={f.id}>Внутри «{f.title}»</option>)}
              </select>
              {sel.size > 0 && <small class="muted">Выбранные товары ({sel.size}) попадут в него</small>}
              <div><button class="btn primary" type="submit">Создать</button><button class="btn ghost" type="button" onClick={() => setNewPart(null)}>Отмена</button></div>
            </form>
          )}
        </aside>

        <section class="pa__main">
          <div class="tools">
            <h1>{part === 'all' ? 'Все товары' : part === 'hidden' ? 'Скрытые товары' : part === 'archive' ? 'Архив' : title(part)} <span class="muted" style="font-size:15px;font-weight:400">{shown.length}</span></h1>
            <input type="search" placeholder="Название или артикул" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} />
            <select value={sort} onChange={(e) => setSort((e.target as HTMLSelectElement).value)} aria-label="Сортировка">
              <option value="site">Как на сайте</option><option value="name">По названию</option>
              <option value="price-asc">Сначала дешевле</option><option value="price-desc">Сначала дороже</option>
            </select>
            <button class="btn" onClick={() => setCsv(true)}>⇪ Импорт CSV</button>
            <a class="btn" href={csvHref(raw, flat, (typeof location !== 'undefined' ? location.origin : '') + base)} download="rozalii-products.csv">⇩ Экспорт CSV</a>
            <button class="btn primary" onClick={() => setEdit(blank())}>+ Добавить товар</button>
          </div>

          {sel.size > 0 && (
            <div class="pa__bulk">
              <b>Выбрано: {sel.size}</b>
              <button class="btn" onClick={() => { setVisible([...sel], false); setSel(new Set()); }}>Скрыть с сайта</button>
              <button class="btn" onClick={() => { setVisible([...sel], true); setSel(new Set()); }}>Показать на сайте</button>
              <select class="btn" value="" onChange={(e) => { const v = (e.target as HTMLSelectElement).value; if (v) { addToPart([...sel], v); setSel(new Set()); } }}>
                <option value="">Добавить в раздел…</option>{flat.map((pt) => <option value={pt.id}>{'  '.repeat(pt.depth)}{pt.depth ? '– ' : ''}{pt.title}</option>)}
              </select>
              <button class="btn ghost" onClick={() => setNewPart('')}>+ Новый раздел из выбранных</button>
              <button class="btn ghost" onClick={() => setSel(new Set())}>Снять выбор</button>
            </div>
          )}

          <div class="pt">
            <div class="pt__head">
              <label><input type="checkbox" checked={allOn} onChange={() => setSel(allOn ? new Set() : new Set(shown.map((p) => p.id)))} aria-label="Выбрать все" /></label>
              <span></span><span>Товар</span><span>Разделы</span><span>Цена</span><span>Остаток</span><span>На сайте</span>
            </div>
            {shown.map((p) => (
              <div class={`pt__row${sel.has(p.id) ? ' is-sel' : ''}${p.visible ? '' : ' is-off'}`} onClick={() => setEdit(p)}>
                <label onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={sel.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Выбрать ${p.title}`} /></label>
                {p.images[0] ? <img class="thumb" src={imgSrc(base, p.images[0])} alt="" loading="lazy" onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')} /> : <span class="thumb" />}
                <div><span class="pname">{p.title}</span><span class="muted pt__sku">{p.sku || 'без артикула'}{p.mark && <i class="pt__mark">{p.mark}</i>}{!p.visible && <i class="pt__off">скрыт</i>}</span></div>
                <div>{p.parts.map((id) => <span class="chip">{title(id)}</span>)}</div>
                <div class="pt__price"><b>{fmt(p.price)}</b>{p.priceOld && <s>{fmt(p.priceOld)}</s>}</div>
                <span class="muted">{p.qty || '∞'}</span>
                {archived.has(p.id) ? <button class="btn" onClick={(e) => { e.stopPropagation(); toArchive(p, false); }}>Вернуть</button> : (
                <label class="sw" onClick={(e) => e.stopPropagation()} title={p.visible ? 'Скрыть с сайта' : 'Показать на сайте'}>
                  <input type="checkbox" checked={p.visible} onChange={() => setVisible([p.id], !p.visible)} /><span />
                </label>)}
              </div>
            ))}
            {shown.length === 0 && <p class="muted" style="padding:28px;text-align:center">Ничего не найдено</p>}
          </div>
        </section>
      </div>

      {edit && <ProductEditor product={edit} parts={flat} base={base} newPath={newPath} onClose={() => setEdit(null)} onSave={save} onDelete={remove} />}
      {del && (
        <div class="ed" role="dialog" aria-modal="true" aria-label="Удалить товар">
          <div class="ed__bg" onClick={() => setDel(null)} />
          <div class="ed__panel" style="max-width:480px;height:auto;margin:18vh auto 0;padding:24px;border-radius:14px">
            <h2 style="margin:0 0 8px">Удалить товар «{del.title}»?</h2>
            <p class="muted" style="margin:0 0 18px">Удаление – насовсем: товар, его фото в карточке и страница пропадут с сайта, отката нет. В архиве товар не виден на сайте, но его можно вернуть.</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn primary" onClick={() => toArchive(del, true)}>Перенести в архив</button>
              <button class="btn ghost" style="color:#b0333f;border:1px solid #b0333f" onClick={() => destroy(del)}>Удалить навсегда</button>
              <button class="btn ghost" onClick={() => setDel(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
      {csv && <CsvImport base={base} onClose={() => setCsv(false)} />}
      {showConnect && <GhConnect onClose={() => setShowConnect(false)} onConnected={(ok) => { setConnected(ok); setShowConnect(false); if (ok) reload(); }} />}
    </div>
  );
}
