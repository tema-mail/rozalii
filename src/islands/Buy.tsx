import { useState } from 'preact/hooks';
import { addToCart } from '../lib/cart';
import { u } from '../lib/url';
import { R } from '../lib/site';

interface Props {
  uid: string; title: string; url: string; photos: string[]; variants: { color: string; sku: string; photo: string | null }[];
  sku: string; madeToOrder: boolean;
}
const RIBBONS = ['Без ленты', 'Белая', 'Чёрная', 'Красная', 'Бордовая'];
const pic = (b: string, w: number) => u(`${b}-${w}.webp`);

// Галерея + выбор цвета (фото варианта), лента с надписью и количество → строка заявки. Цены у источника нет – «цена по запросу».
export function Gallery({ photos, title, cur, setCur }: { photos: string[]; title: string; cur: number; setCur: (i: number) => void }) {
  return (
    <div class="gal">
      <div class="gal__main"><img src={pic(photos[cur], 1000)} alt={title} width={1000} height={1000} /></div>
      {photos.length > 1 && (
        <div class="gal__th">
          {photos.map((p, i) => (
            <button type="button" class={i === cur ? 'on' : ''} onClick={() => setCur(i)} aria-label={`Фото ${i + 1}`}>
              <img src={pic(p, 480)} alt="" loading="lazy" width={72} height={72} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Buy(p: Props) {
  const [cur, setCur] = useState(0);
  const [vi, setVi] = useState(0);
  const [qty, setQty] = useState(1);
  const [ribbon, setRibbon] = useState(RIBBONS[0]);
  const [text, setText] = useState('');
  const [added, setAdded] = useState(false);
  const v = p.variants[vi];

  const pickVariant = (i: number) => {
    setVi(i);
    const ph = p.variants[i].photo;
    if (ph) setCur(Math.max(0, p.photos.indexOf(ph)));
  };
  const add = () => {
    const rib = ribbon === RIBBONS[0] ? '' : `${ribbon} лента${text.trim() ? `: «${text.trim()}»` : ''}`;
    addToCart({ uid: p.uid, title: p.title, url: p.url, photo: v?.photo || p.photos[0], color: v?.color || '', qty, ribbon: rib });
    setAdded(true);
    setTimeout(() => setAdded(false), 5000);
  };

  return (
    <div class="pp">
      <Gallery photos={p.photos} title={p.title} cur={cur} setCur={setCur} />
      <div>
        <div class="buy">
          <div>
            <div class="buy__price">Цена по запросу</div>
            <div class="mut" style="font-size:14px">Менеджер назовёт стоимость и срок после заявки. Для оптовиков – отдельный прайс.</div>
          </div>
          {p.variants.length > 0 && (
            <div>
              <span class="opt-label">Исполнение: {v.color}</span>
              <div class="swatches">
                {p.variants.map((x, i) => <button type="button" class={`swatch${i === vi ? ' on' : ''}`} onClick={() => pickVariant(i)}>{x.color}</button>)}
              </div>
            </div>
          )}
          <div>
            <span class="opt-label">Траурная лента</span>
            <div class="swatches">
              {RIBBONS.map((r) => <button type="button" class={`swatch${r === ribbon ? ' on' : ''}`} onClick={() => setRibbon(r)}>{r}</button>)}
            </div>
            {ribbon !== RIBBONS[0] && (
              <label class="field" style="margin:10px 0 0">
                <span>Надпись на ленте</span>
                <input value={text} maxLength={120} placeholder="Например: «Светлая память»" onInput={(e) => setText((e.target as HTMLInputElement).value)} />
              </label>
            )}
          </div>
          <div class="btns" style="align-items:center">
            <div class="qty">
              <button type="button" aria-label="Меньше" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <input inputMode="numeric" aria-label="Количество" value={qty} onChange={(e) => setQty(Math.max(1, parseInt((e.target as HTMLInputElement).value, 10) || 1))} />
              <button type="button" aria-label="Больше" onClick={() => setQty(qty + 1)}>+</button>
            </div>
            <button type="button" class="btn" style="flex:1" onClick={add}>Добавить в заявку</button>
          </div>
          {p.madeToOrder && <div class="note">Изготавливается под заказ – срок назовём при подтверждении.</div>}
          <div class="mut" style="font-size:14px">Артикул: {v?.sku || p.sku}</div>
        </div>
      </div>
      {added && <div class="toast" role="status">Добавлено в заявку <a href={u(R.cart)}>Оформить →</a></div>}
    </div>
  );
}
