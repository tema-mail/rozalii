import { useState } from 'preact/hooks';

/* «Заявки» – перенос кабинета-стандарта (стенд Milovini). Код доски – с эталона ALEX KROWN v1 (src/v1/admin/Orders.tsx, режим leads),
   который повторяет доску EV SIBIR. Магазин без онлайн-оплаты: заказ из корзины = заявка (references/contracts.md),
   поэтому у заявки есть товары и категория – по ним считается спрос по товарам (отличие от эталона по модели данных).
   Своего приёмника нет: заказы из корзины живого rozalii.ru Тильда шлёт в Telegram и MAX – пока данных нет, показан пример
   с меткой. Удаление – внутри заявки, через окно «в архив / удалить навсегда / отмена», архив – отдельный вид
   (правило владельца 27.10.2026, образец EV SIBIR admin_lead.py). */

export interface LeadItem { uid: string; title: string; category: string; qty: number; price: number | null; variant?: string }
export interface Lead { id: string; createdAt: string; name: string; phone: string; form: string; page: string; message?: string; stage: 'новая' | 'в работе' | 'выполнена' | 'отказ'; source: string; items: LeadItem[]; category: string; archived?: boolean }

const STAGES: Lead['stage'][] = ['новая', 'в работе', 'выполнена', 'отказ'];
const dt = (s: string) => new Date(s).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const rub = (n: number) => n.toLocaleString('ru-RU').replace(/\u00a0/g, ' ') + ' ₽';
const goods = (l: Lead) => l.items.map((i) => `${i.title}${i.variant ? ` (${i.variant})` : ''}${i.qty > 1 ? ` × ${i.qty}` : ''}`).join(', ');
// цен на сайте пока нет – сумма только если цены есть у всех товаров заявки
const total = (l: Lead) => (l.items.every((i) => i.price != null) ? l.items.reduce((s, i) => s + (i.price ?? 0) * i.qty, 0) : null);
const sum = (l: Lead) => { const v = total(l); return v ? rub(v) : 'цена по запросу'; };

/* Заявки – как доска EV SIBIR (server/admin.py: board_page, list_page, export_csv, DND_JS): этап меняется
   перетаскиванием карточки в колонку, вид «Доска / Списком», выгрузка CSV (UTF-8 с BOM, «;») */
const STAGE_TITLE: Record<Lead['stage'], string> = { 'новая': 'Новые', 'в работе': 'В работе', 'выполнена': 'Выполнена', 'отказ': 'Отказ' };
const leadsCsv = (rows: Lead[]) => {
  const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['номер', 'дата', 'имя', 'телефон', 'форма', 'товары', 'категория', 'сумма', 'страница', 'этап', 'источник', 'сообщение', 'в архиве'];
  const body = rows.map((l) => [l.id, dt(l.createdAt), l.name, l.phone, l.form, goods(l), l.category, total(l) ?? '', l.page, STAGE_TITLE[l.stage], l.source, l.message ?? '', l.archived ? 'да' : ''].map(q).join(';'));
  return 'data:text/csv;charset=utf-8,' + encodeURIComponent('\ufeff' + [head.join(';'), ...body].join('\r\n'));
};

function LeadsView({ leads, example }: { leads: Lead[]; example: boolean }) {
  const [list, setList] = useState(leads);
  const [q, setQ] = useState('');
  const [src, setSrc] = useState('');
  const [view, setView] = useState<'board' | 'list'>('board');
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const needle = q.trim().toLowerCase();
  const [cat, setCat] = useState('');
  const [arch, setArch] = useState(false);
  const [open, setOpen] = useState<Lead | null>(null);
  const [ask, setAsk] = useState(false);
  const shown = list.filter((l) => !!l.archived === arch && (!src || l.source === src) && (!cat || l.category === cat) && (!needle || [l.id, l.name, l.phone, goods(l)].join(' ').toLowerCase().includes(needle)));
  const cats = [...new Set(list.map((l) => l.category).filter(Boolean))];
  const sources = [...new Set(list.map((l) => l.source))];
  const drop = (stg: Lead['stage']) => { if (drag) setList(list.map((x) => (x.id === drag ? { ...x, stage: stg } : x))); setDrag(null); setOver(null); };
  return (
    <>
      <div class="tools">
        <h1>Заявки {example && <span class="chip">пример</span>}</h1>
        <span class="seg">
          <button class={view === 'board' ? 'on' : ''} onClick={() => setView('board')}>Доска</button>
          <button class={view === 'list' ? 'on' : ''} onClick={() => setView('list')}>Списком</button>
        </span>
        <input type="search" placeholder="Номер, имя, телефон, товар" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} />
        <select value={cat} onChange={(e) => setCat((e.target as HTMLSelectElement).value)} aria-label="Категория"><option value="">Все категории</option>{cats.map((s) => <option>{s}</option>)}</select>
        <select value={src} onChange={(e) => setSrc((e.target as HTMLSelectElement).value)} aria-label="Источник"><option value="">Все источники</option>{sources.map((s) => <option>{s}</option>)}</select>
        <span class="seg">
          <button class={!arch ? 'on' : ''} onClick={() => setArch(false)}>Рабочие</button>
          <button class={arch ? 'on' : ''} onClick={() => setArch(true)}>Архив {list.filter((l) => l.archived).length}</button>
        </span>
        {/* выгрузка – вместе с архивом и столбцом «в архиве», иначе она выглядит как потеря данных */}
        <a class="btn" href={leadsCsv(list)} download="leads.csv">⇩ CSV</a>
      </div>
      {view === 'board' ? (
        <div class="kb">
          {STAGES.map((stg) => (
            <section class={`kb__col${over === stg ? ' is-over' : ''}`} onDragOver={(e) => { e.preventDefault(); setOver(stg); }} onDragLeave={() => setOver(null)} onDrop={(e) => { e.preventDefault(); drop(stg); }}>
              <h2>{STAGE_TITLE[stg]} <span>{shown.filter((l) => l.stage === stg).length}</span></h2>
              {shown.filter((l) => l.stage === stg).map((l) => (
                <article class={`kb__card${drag === l.id ? ' is-drag' : ''}`} style="cursor:pointer" onClick={() => setOpen(l)} draggable onDragStart={(e) => { e.dataTransfer?.setData('text/plain', l.id); setDrag(l.id); }} onDragEnd={() => setDrag(null)}>
                  <p class="kb__top"><b>№ {l.id}</b><span class="chip">{l.form}</span></p>
                  <p class="kb__who">{l.name} · {l.phone}</p>
                  {l.items.length > 0 && <p class="kb__goods">{goods(l)} · <b>{sum(l)}</b></p>}
                  {l.category && <p class="muted" style="font-size:12px">Категория: {l.category}</p>}
                  {l.message && <p>{l.message}</p>}
                  <p class="kb__meta"><span>{dt(l.createdAt)}</span><span class="muted">{l.source}</span></p>
                </article>
              ))}
              {shown.filter((l) => l.stage === stg).length === 0 && <p class="muted" style="font-size:12.5px;text-align:center;padding:16px 0">Пусто</p>}
            </section>
          ))}
        </div>
      ) : (
        <div class="tw">
          <table class="vt" style="width:100%">
            <thead><tr><th>Когда</th><th>Имя</th><th>Телефон</th><th>Товары</th><th>Категория</th><th>Форма</th><th>Источник</th><th>Этап</th></tr></thead>
            <tbody>
              {shown.map((l) => <tr style="cursor:pointer" onClick={() => setOpen(l)}><td>{dt(l.createdAt)}</td><td>{l.name}</td><td>{l.phone}</td><td>{goods(l) || <span class="muted">без товара</span>}</td><td>{l.category}</td><td class="muted">{l.form}</td><td class="muted">{l.source}</td><td><span class="chip">{STAGE_TITLE[l.stage]}</span></td></tr>)}
              {!shown.length && <tr><td colSpan={8} class="muted" style="text-align:center;padding:20px">Заявок пока нет</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {open && (
        <div class="ed" role="dialog" aria-modal="true" aria-label={`Заявка № ${open.id}`}>
          <div class="ed__bg" onClick={() => setOpen(null)} />
          <div class="ed__panel">
            <header class="ed__head">
              <div><p class="muted" style="margin:0;font-size:12px">{open.form} · {dt(open.createdAt)}{open.archived && ' · в архиве'}</p><h2>Заявка № {open.id}</h2></div>
              <select value={open.stage} aria-label="Этап" onChange={(e) => { const stage = (e.target as HTMLSelectElement).value as Lead['stage']; setList(list.map((x) => (x.id === open.id ? { ...x, stage } : x))); setOpen({ ...open, stage }); }}>{STAGES.map((s) => <option value={s}>{STAGE_TITLE[s]}</option>)}</select>
              <button class="btn" onClick={() => setOpen(null)}>Закрыть</button>
            </header>
            <div class="ed__body">
              <div class="fgrid">
                <p class="f"><span class="muted">Покупатель</span><span><b>{open.name}</b> · <a href={`tel:${open.phone.replace(/[^\d+]/g, '')}`}>{open.phone}</a></span></p>
                <p class="f"><span class="muted">Источник</span><span>{open.source}</span></p>
                <p class="f"><span class="muted">Страница</span><span>{open.page}</span></p>
                <p class="f"><span class="muted">Категория</span><span>{open.category || '–'}</span></p>
                {open.message && <p class="f f--wide"><span class="muted">Доставка и комментарий</span><span>{open.message}</span></p>}
              </div>
              <table class="vt" style="margin-top:14px">
                <thead><tr><th>Товар</th><th>Вариант</th><th>Категория</th><th>Кол-во</th><th>Цена</th></tr></thead>
                <tbody>{open.items.map((i) => <tr><td>{i.title}</td><td>{i.variant || '–'}</td><td>{i.category}</td><td>{i.qty}</td><td>{i.price == null ? <span class="muted">по запросу</span> : rub(i.price)}</td></tr>)}</tbody>
              </table>
            </div>
            <footer class="ed__foot">
              {open.archived
                ? <button class="btn" onClick={() => { setList(list.map((x) => (x.id === open.id ? { ...x, archived: false } : x))); setOpen(null); }}>Вернуть из архива</button>
                : <button class="btn ghost" style="color:#b0333f" onClick={() => setAsk(true)}>Удалить заявку</button>}
            </footer>
          </div>
        </div>
      )}
      {open && ask && (
        <div class="ed" role="dialog" aria-modal="true" aria-label="Удалить заявку" style="z-index:60">
          <div class="ed__bg" onClick={() => setAsk(false)} />
          <div class="ed__ask">
            <h2>Удалить заявку № {open.id}?</h2>
            <p class="muted">Удаление – насовсем: заявка, товары в ней и история этапов пропадут, отката нет. Из архива заявку можно вернуть, и она остаётся в статистике.</p>
            <div>
              <button class="btn primary" onClick={() => { setList(list.map((x) => (x.id === open.id ? { ...x, archived: true } : x))); setAsk(false); setOpen(null); }}>Перенести в архив</button>
              <button class="btn ghost" style="color:#b0333f;border:1px solid #b0333f" onClick={() => { setList(list.filter((x) => x.id !== open.id)); setAsk(false); setOpen(null); }}>Удалить навсегда</button>
              <button class="btn ghost" onClick={() => setAsk(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Leads({ leads, sample }: { leads: Lead[]; sample: Lead[] }) {
  const empty = !leads.length;
  // как у эталона: пока своих данных нет – сразу пример с пометкой
  const [example, setExample] = useState(empty);
  return (
    <div>
      {empty && (
        <p class="demo-note">
          {(example ? 'Пример доски – изменения в примере не сохраняются. ' : '') + 'Сейчас заказы из корзины живого rozalii.ru Тильда отправляет в Telegram и MAX – сюда они начнут падать, когда подключим свой приёмник заявок.'}
          <button class="btn" style="margin-left:auto" onClick={() => setExample(!example)}>{example ? 'Скрыть пример' : 'Показать пример'}</button>
        </p>
      )}
      <LeadsView key={String(example)} leads={example ? sample : leads} example={example} />
    </div>
  );
}
