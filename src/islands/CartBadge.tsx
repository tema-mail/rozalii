import { useEffect, useState } from 'preact/hooks';
import { CART_EVENT, cartCount } from '../lib/cart';

// Число позиций в заявке в шапке; обновляется по событию корзины и при смене вкладки.
export default function CartBadge() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const upd = () => setN(cartCount());
    upd();
    window.addEventListener(CART_EVENT, upd);
    window.addEventListener('storage', upd);
    return () => { window.removeEventListener(CART_EVENT, upd); window.removeEventListener('storage', upd); };
  }, []);
  return n ? <i aria-label={`в заявке ${n}`}>{n}</i> : null;
}
