import { useEffect, useState } from 'preact/hooks';
import type { Edition } from '../../lib/catalog';

// Редактор товара – перенос с кабинета-стандарта (Milovini → gaz-mag; эталон Elite Rose, «Магазин → товар» Тильды):
// вкладки «Основное», «Фото», «Разделы», «Варианты», «SEO». Отличия по данным rozalii: разделы – дерево Тильды
// (Венки → Венки 90/110/125/140), варианты – «Цвет» у 19 товаров со своими артикулами; «Характеристики» и
// «Размеры и вес» нет – нет данных.

export interface AdmProduct {
  id: string; title: string; sku: string; price: number | null; priceOld: number | null; qty: string; mark: string;
  descr: string; text: string; images: string[]; parts: string[]; path: string; visible: boolean;
  seoTitle: string; seoDescr: string; options: { title: string; values: string[] }[]; editions: Edition[];
}
export interface AdmPart { id: string; title: string; depth?: number }

type TabName = 'Основное' | 'Фото' | 'Разделы' | 'Варианты' | 'SEO';
const TABS: TabName[] = ['Основное', 'Фото', 'Разделы', 'Варианты', 'SEO'];
export const imgSrc = (base: string, im: string) => (/^https?:/.test(im) ? im : base + im);

export default function ProductEditor({ product, parts, base, newPath, onClose, onSave, onDelete }: {
  product: AdmProduct; parts: AdmPart[]; base: string; newPath: (p: AdmProduct) => string;
  onClose: () => void; onSave: (p: AdmProduct, files: File[]) => void; onDelete: (p: AdmProduct) => void;
}) {
  const [p, setP] = useState<AdmProduct>(product);
  const [files, setFiles] = useState<{ file: File; url: string }[]>([]);
  const [tab, setTab] = useState<TabName>('Основное');
  const isNew = !product.id;
  const [optName, setOptName] = useState('Цвет');
  const [optValues, setOptValues] = useState('');
  const [addValue, setAddValue] = useState('');
  const uid = (i = 0) => String(Date.now() + i);
  const variants = p.editions.length >= 2;
  /** Создать варианты по одному параметру: «Цвет» + «Белые цветы, Синие цветы» → по варианту на значение. */
  const makeVariants = () => {
    const title = optName.trim();
    const values = [...new Set(optValues.split(',').map((v) => v.trim()).filter(Boolean))];
    if (!title || values.length < 2) return;
    setP({ ...p, options: [{ title, values }], editions: values.map((v, i) => ({ id: uid(i), sku: p.sku ? `${p.sku}-${i + 1}` : '', price: p.price, priceOld: p.priceOld, img: '', opts: { [title]: v } })) });
  };
  const opt = p.options[0];
  const addVariant = () => {
    const v = addValue.trim();
    if (!opt || !v || opt.values.includes(v)) return;
    setP({ ...p, options: [{ ...opt, values: [...opt.values, v] }], editions: [...p.editions, { id: uid(), sku: p.sku ? `${p.sku}-${p.editions.length + 1}` : '', price: p.price, priceOld: null, img: '', opts: { [opt.title]: v } }] });
    setAddValue('');
  };
  const removeVariant = (i: number) => {
    if (!opt) return;
    const gone = p.editions[i].opts[opt.title];
    const editions = p.editions.filter((_, n) => n !== i);
    // остался один вариант – это уже товар без вариантов
    setP(editions.length < 2 ? { ...p, options: [], editions: [], price: editions[0]?.price ?? p.price } : { ...p, options: [{ ...opt, values: opt.values.filter((v) => v !== gone) }], editions });
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);
  const set = (k: keyof AdmProduct) => (e: Event) => setP({ ...p, [k]: (e.target as HTMLInputElement).value });
  const num = (k: 'price' | 'priceOld') => (e: Event) => { const v = (e.target as HTMLInputElement).value.replace(/\D/g, ''); setP({ ...p, [k]: v ? Number(v) : null }); };
  const ed = (i: number, k: 'price' | 'priceOld' | 'sku') => (e: Event) => {
    const raw = (e.target as HTMLInputElement).value;
    const v = k === 'sku' ? raw : raw.replace(/\D/g, '') ? Number(raw.replace(/\D/g, '')) : null;
    setP({ ...p, editions: p.editions.map((x, n) => (n === i ? { ...x, [k]: v } : x)) });
  };
  const pathShown = p.path || newPath(p);
  // шаблон – как у SEO товаров на живом сайте (27.10.2026): «Ритуальный венок «Название» – Сергиев Посад»
  const autoTitle = `${p.title || 'Название товара'} – купить в Сергиевом Посаде | Розалия`;
  const autoDescr = `${p.title || 'Название товара'}: ${(p.descr || 'ритуальный венок').replace(/\.$/, '').toLowerCase()}. Производство Розалия, Сергиев Посад – доставка к месту прощания.`;
  const host = typeof location !== 'undefined' ? location.host : 'rozalii.ru';

  return (
    <div class="ed" role="dialog" aria-modal="true" aria-label={isNew ? 'Новый товар' : `Товар «${p.title}»`}>
      <div class="ed__bg" onClick={onClose} />
      <div class="ed__panel">
        <header class="ed__head">
          <div>
            <p class="muted" style="margin:0;font-size:12px">{isNew ? 'Магазин → новый товар' : `Магазин → товар № ${p.id}`}</p>
            <h2>{p.title || 'Новый товар'}</h2>
          </div>
          <label class="sw" title="Показывать на сайте">
            <input type="checkbox" checked={p.visible} onChange={(e) => setP({ ...p, visible: (e.target as HTMLInputElement).checked })} />
            <span />{p.visible ? 'Опубликован' : 'Скрыт'}
          </label>
          <button class="btn" onClick={onClose}>Закрыть</button>
          <button class="btn primary" onClick={() => onSave(p, files.map((f) => f.file))}>Сохранить</button>
        </header>
        <nav class="ed__tabs">{TABS.map((t) => <button class={t === tab ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>)}</nav>

        <div class="ed__body">
          {tab === 'Основное' && (
            <div class="fgrid">
              <label class="f f--wide"><span>Название товара</span><input value={p.title} onInput={set('title')} placeholder="Например, Амур" /></label>
              <label class="f"><span>Цена, ₽ {variants && <em>у вариантов – свои цены</em>}</span><input inputMode="numeric" value={p.price ?? ''} onInput={num('price')} placeholder="Пусто – цена не показывается" /></label>
              <label class="f"><span>Старая цена, ₽</span><input inputMode="numeric" value={p.priceOld ?? ''} onInput={num('priceOld')} placeholder="Для скидки" /></label>
              <label class="f"><span>Артикул</span><input value={p.sku} onInput={set('sku')} placeholder="W110-001" /></label>
              <label class="f"><span>Количество <em>пусто – без ограничения</em></span><input inputMode="numeric" value={p.qty} onInput={set('qty')} placeholder="∞" /></label>
              <label class="f"><span>Метка на карточке</span><input value={p.mark} onInput={set('mark')} placeholder="Хит, Новинка, -10%" /></label>
              <label class="f f--wide"><span>Краткое описание <em>под названием в каталоге</em></span><input value={p.descr} onInput={set('descr')} placeholder="Ритуальный венок с цветочной композицией." /></label>
              <label class="f f--wide"><span>Полное описание <em>на странице товара</em></span><textarea rows={6} value={p.text} onInput={set('text')} /></label>
            </div>
          )}

          {tab === 'Фото' && (
            <div>
              <p class="muted" style="margin:0 0 12px">Первое фото – обложка в каталоге. Фото венка лучше на светлом фоне, от 1000 px.</p>
              <div class="gal">
                {p.images.map((im, i) => (
                  <figure class="gal__item">
                    <img src={imgSrc(base, im)} alt="" />
                    {i === 0 && <span class="gal__cover">Обложка</span>}
                    <button class="gal__del" title="Убрать фото" onClick={() => setP({ ...p, images: p.images.filter((_, n) => n !== i) })}>×</button>
                  </figure>
                ))}
                {files.map((f, i) => (
                  <figure class="gal__item gal__item--new">
                    <img src={f.url} alt="" />
                    {p.images.length === 0 && i === 0 && <span class="gal__cover">Обложка</span>}
                    <span class="gal__badge">загрузится при сохранении</span>
                    <button class="gal__del" title="Убрать фото" onClick={() => setFiles(files.filter((_, n) => n !== i))}>×</button>
                  </figure>
                ))}
                <label class="gal__add">
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { const fl = [...((e.target as HTMLInputElement).files || [])]; setFiles([...files, ...fl.map((file) => ({ file, url: URL.createObjectURL(file) }))]); (e.target as HTMLInputElement).value = ''; }} />
                  <b>+</b><span>Загрузить фото</span><small>или перетащите сюда</small>
                </label>
              </div>
            </div>
          )}

          {tab === 'Разделы' && (
            <div>
              <p class="muted" style="margin:0 0 12px">Товар может быть в нескольких разделах – на сайте он покажется в каждом. Подраздел (Венки 110 и т. п.) – фильтр в каталоге раздела; отметьте и сам раздел.</p>
              <div class="checks">
                {parts.map((pt) => (
                  <label class="ck" style={pt.depth ? `margin-left:${pt.depth * 18}px` : ''}><input type="checkbox" checked={p.parts.includes(pt.id)} onChange={(e) => setP({ ...p, parts: (e.target as HTMLInputElement).checked ? [...p.parts, pt.id] : p.parts.filter((x) => x !== pt.id) })} />{pt.title}</label>
                ))}
              </div>
            </div>
          )}

          {tab === 'Варианты' && !variants && (
            <div class="fgrid">
              <p class="muted f--wide" style="margin:0">У товара нет вариантов. Задайте параметр и значения – получится по варианту на каждое значение (например, цвет цветов или ленты), артикулы и цены потом поправьте в таблице.</p>
              <label class="f"><span>Параметр</span><input value={optName} onInput={(e) => setOptName((e.target as HTMLInputElement).value)} placeholder="Цвет" /></label>
              <label class="f"><span>Значения через запятую</span><input value={optValues} onInput={(e) => setOptValues((e.target as HTMLInputElement).value)} placeholder="Белые цветы, Синие цветы, Розовые цветы" /></label>
              <div class="f--wide"><button class="btn primary" type="button" onClick={makeVariants} disabled={!optName.trim() || optValues.split(',').filter((v) => v.trim()).length < 2}>Создать варианты</button></div>
            </div>
          )}
          {tab === 'Варианты' && variants && (
            <div>
              <p class="muted" style="margin:0 0 12px">Покупатель выбирает вариант на странице товара; в корзину попадает артикул и цена варианта.</p>
              <table class="vt">
                <thead><tr>{p.options.map((o) => <th>{o.title}</th>)}<th>Артикул</th><th>Цена, ₽</th><th>Старая цена, ₽</th><th></th></tr></thead>
                <tbody>
                  {p.editions.map((x, i) => (
                    <tr>
                      {p.options.map((o) => <td>{x.opts[o.title]}</td>)}
                      <td><input value={x.sku} onInput={ed(i, 'sku')} aria-label="Артикул варианта" /></td>
                      <td><input inputMode="numeric" value={x.price ?? ''} onInput={ed(i, 'price')} aria-label="Цена варианта" /></td>
                      <td><input inputMode="numeric" value={x.priceOld ?? ''} onInput={ed(i, 'priceOld')} aria-label="Старая цена варианта" /></td>
                      <td><button class="btn ghost" type="button" title="Убрать вариант" onClick={() => removeVariant(i)}>×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {opt && (
                <div style="display:flex;gap:8px;margin-top:10px;align-items:center">
                  <input value={addValue} onInput={(e) => setAddValue((e.target as HTMLInputElement).value)} placeholder={`Новое значение «${opt.title}»`} aria-label="Новое значение" style="max-width:260px" />
                  <button class="btn" type="button" onClick={addVariant} disabled={!addValue.trim()}>+ Добавить вариант</button>
                </div>
              )}
            </div>
          )}

          {tab === 'SEO' && (
            <div class="fgrid">
              <p class="muted f--wide" style="margin:0">Title и Description страницы товара. Пустое поле – на странице останется заголовок «Название - Розалия», как сейчас у Тильды.</p>
              <label class="f f--wide"><span>Адрес страницы <em>{p.path ? 'у опубликованного товара не меняется – позиции в поиске' : 'из названия и раздела'}</em></span><div class="url"><input value={pathShown} readOnly /></div></label>
              <label class="f f--wide"><span>Title <em>{(p.seoTitle || autoTitle).length}/60</em></span><input value={p.seoTitle} placeholder={autoTitle} onInput={set('seoTitle')} /></label>
              <label class="f f--wide"><span>Description <em>{(p.seoDescr || autoDescr).length}/160</em></span><textarea rows={3} value={p.seoDescr} placeholder={autoDescr} onInput={set('seoDescr')} /></label>
              <div class="f--wide"><button type="button" class="btn" onClick={() => setP({ ...p, seoTitle: autoTitle, seoDescr: autoDescr })}>Заполнить по шаблону</button></div>
              <div class="snip f--wide">
                <span class="snip__url">{host} › {pathShown.split('/').filter(Boolean).join(' › ')}</span>
                <span class="snip__t">{p.seoTitle || `${p.title} - Розалия`}</span>
                <span class="snip__d">{p.seoDescr || p.descr}</span>
              </div>
            </div>
          )}
        </div>
        {!isNew && <footer class="ed__foot"><button class="btn ghost" style="color:#b0333f" onClick={() => onDelete(p)}>Удалить товар</button><a class="btn" href={`${base}${p.path}`} target="_blank">Открыть на сайте ↗</a></footer>}
      </div>
    </div>
  );
}
