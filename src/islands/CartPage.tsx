import { useEffect, useState } from 'preact/hooks';
import { CART_EVENT, readCart, writeCart, type CartItem } from '../lib/cart';
import { u } from '../lib/url';
import { R } from '../lib/site';
import LeadForm from './LeadForm';

// Корзина-заявка: позиции с цветом и лентой, количество, удаление; справа – форма. Цены нет – стоимость называет менеджер.
export default function CartPage() {
  const [items, setItems] = useState<CartItem[] | null>(null);
  useEffect(() => {
    const upd = () => setItems(readCart());
    upd();
    window.addEventListener(CART_EVENT, upd);
    return () => window.removeEventListener(CART_EVENT, upd);
  }, []);
  if (items === null) return null;
  if (!items.length) {
    return <div class="card" style="text-align:center;padding:40px">
      <h2>В заявке пока пусто</h2>
      <p class="mut">Выберите венок, корзину или композицию в каталоге – или оставьте заявку без выбора, поможем подобрать.</p>
      <div class="btns" style="justify-content:center"><a class="btn" href={u(R.katalog)}>В каталог</a><a class="btn btn--line" href={u(R.contacts)}>Связаться</a></div>
    </div>;
  }
  const set = (i: number, qty: number) => { const n = [...items]; if (qty < 1) n.splice(i, 1); else n[i] = { ...n[i], qty }; writeCart(n); };
  return (
    <div class="cart">
      <div class="card">
        {items.map((x, i) => (
          <div class="ci">
            <img src={u(`${x.photo}-480.webp`)} alt="" width={88} height={88} />
            <div>
              <a href={u(x.url)}>{x.title}</a>
              <div class="ci__m">{[x.color, x.ribbon].filter(Boolean).join(' · ') || 'Без ленты'}</div>
            </div>
            <div class="ci__act">
              <div class="qty">
                <button type="button" aria-label="Меньше" onClick={() => set(i, x.qty - 1)}>−</button>
                <input aria-label="Количество" inputMode="numeric" value={x.qty} onChange={(e) => set(i, parseInt((e.target as HTMLInputElement).value, 10) || 0)} />
                <button type="button" aria-label="Больше" onClick={() => set(i, x.qty + 1)}>+</button>
              </div>
              <button type="button" class="link" onClick={() => set(i, 0)}>Удалить</button>
            </div>
          </div>
        ))}
        <p class="mut" style="margin:16px 0 0;font-size:14px">Стоимость, срок изготовления и доставку менеджер подтвердит после заявки. Оптовым клиентам – цены по прайсу.</p>
      </div>
      <div class="card">
        <h2 style="font-size:24px">Оформить заявку</h2>
        <LeadForm kind="order" withCart button="Отправить заявку" placeholder="Дата и время, адрес доставки, место прощания" />
      </div>
    </div>
  );
}
